import { z } from "zod";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";

/// Deterministic hash for a string that produces a number in [0, 1).
/// Used to scatter user pins within a city grid cell so the globe view shows
/// each user at a stable position without ever revealing their real coords.
function hashToUnit(seed: string, salt: string): number {
  let h = 2166136261 >>> 0;
  const combined = `${seed}:${salt}`;
  for (let i = 0; i < combined.length; i++) {
    h ^= combined.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h & 0xffffffff) / 0xffffffff;
}

/// Snaps a stored lat/lon to a city-level grid (~22km) and adds a
/// deterministic per-user scatter (~±11km) based on userId. The real
/// coordinate never leaves the server — the client only sees a point
/// that is stable per user, spread across city bounds for aesthetics.
function privacyScatter(
  userId: string,
  latitude: number,
  longitude: number
): { lat: number; lon: number } {
  const GRID = 0.2; // degrees, ~22km at the equator
  const JITTER = 0.11; // ±0.11° ≈ ±12km

  const gridLat = Math.round(latitude / GRID) * GRID;
  const gridLon = Math.round(longitude / GRID) * GRID;

  const jitterLat = (hashToUnit(userId, "lat") - 0.5) * 2 * JITTER;
  const jitterLon = (hashToUnit(userId, "lon") - 0.5) * 2 * JITTER;

  return {
    lat: gridLat + jitterLat,
    lon: gridLon + jitterLon,
  };
}

// Haversine distance in miles between two lat/lng points
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const connectDiscoverRouter = router({
  getDiscoveryQueue: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(CONNECT_LIMITS.DISCOVERY_BATCH_SIZE),
        filters: z
          .object({
            disciplineIds: z.array(z.string().uuid()).optional(),
            role: z.enum(["CREATIVE", "CLIENT", "ALL"]).optional(),
            location: z.string().optional(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
            maxDistanceMiles: z.number().min(1).max(500).optional(),
            globalSearch: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { limit, filters } = input;

      // Exclude only users we already *liked* — passing is now non-destructive
      // (the client recycles passed cards to the bottom of the local stack),
      // so old PASS records shouldn't permanently hide those profiles.
      const likedUserIds = await prisma.connectSwipe.findMany({
        where: { userId, type: "LIKE" },
        select: { targetUserId: true },
      });
      const swipedSet = new Set(likedUserIds.map((s) => s.targetUserId));

      // Get IDs of blocked users (both directions)
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      });
      const blockedSet = new Set<string>();
      blocks.forEach((b) => {
        blockedSet.add(b.blockerId);
        blockedSet.add(b.blockedId);
      });

      // Combine exclusions
      const excludeIds = new Set([userId, ...swipedSet, ...blockedSet]);

      // Build where clause for Connect profiles
      const where: Record<string, unknown> = {
        isActive: true,
        userId: { notIn: Array.from(excludeIds) },
      };

      // Apply filters
      if (filters?.disciplineIds && filters.disciplineIds.length > 0) {
        where.disciplineIds = { hasSome: filters.disciplineIds };
      }

      if (filters?.location && !filters?.globalSearch) {
        where.location = { contains: filters.location, mode: "insensitive" };
      }

      // Role filter applies to the related User
      const userWhere: Record<string, unknown> = {};
      if (filters?.role && filters.role !== "ALL") {
        userWhere.role = filters.role;
      }

      if (Object.keys(userWhere).length > 0) {
        where.user = userWhere;
      }

      // Distance-based bounding box pre-filter (when not global search)
      const useDistanceFilter =
        !filters?.globalSearch &&
        filters?.latitude != null &&
        filters?.longitude != null &&
        filters?.maxDistanceMiles;

      if (useDistanceFilter) {
        // Rough bounding box (~1 degree lat ≈ 69 miles)
        const latDelta = filters!.maxDistanceMiles! / 69;
        const lonDelta =
          filters!.maxDistanceMiles! /
          (69 * Math.cos((filters!.latitude! * Math.PI) / 180));
        where.latitude = {
          gte: filters!.latitude! - latDelta,
          lte: filters!.latitude! + latDelta,
        };
        where.longitude = {
          gte: filters!.longitude! - lonDelta,
          lte: filters!.longitude! + lonDelta,
        };
      }

      // Fetch more than needed so we can filter by actual distance
      const fetchLimit = useDistanceFilter ? limit * 3 : limit;

      const profiles = await prisma.connectProfile.findMany({
        where,
        take: fetchLimit,
        orderBy: [
          { connectTier: "desc" },        // INFINITE (alphabetically > FREE) first
          { likesReceivedCount: "desc" },  // Most liked
          { matchesCount: "desc" },        // Most connected
          { updatedAt: "desc" },           // Most recently active
        ],
        include: {
          user: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  bio: true,
                  headline: true,
                  location: true,
                  verificationStatus: true,
                  subscriptionTier: true,
                  followersCount: true,
                  disciplines: {
                    include: { discipline: true },
                  },
                },
              },
            },
          },
        },
      });

      // Post-filter by exact Haversine distance
      if (useDistanceFilter) {
        const filtered = profiles.filter((p) => {
          if (p.latitude == null || p.longitude == null) return false;
          const dist = haversineDistance(
            filters!.latitude!,
            filters!.longitude!,
            p.latitude,
            p.longitude
          );
          return dist <= filters!.maxDistanceMiles!;
        });
        return filtered.slice(0, limit);
      }

      return profiles;
    }),

  getLikesReceived: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(CONNECT_LIMITS.LIKES_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      // Look up matched user ids first so the main query has a simple filter.
      const matches = await prisma.connectMatch.findMany({
        where: {
          OR: [
            { user1Id: ctx.user.id, status: "ACTIVE" },
            { user2Id: ctx.user.id, status: "ACTIVE" },
          ],
        },
        select: { user1Id: true, user2Id: true },
      });
      const matchedUserIds = matches.map((m) =>
        m.user1Id === ctx.user.id ? m.user2Id : m.user1Id
      );

      const likes = await prisma.connectSwipe.findMany({
        where: {
          targetUserId: ctx.user.id,
          type: "LIKE",
          ...(matchedUserIds.length > 0
            ? { userId: { notIn: matchedUserIds } }
            : {}),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verificationStatus: true,
                  subscriptionTier: true,
                },
              },
              connectProfile: {
                select: {
                  id: true,
                  mediaSlots: true,
                  headline: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (likes.length > limit) {
        const next = likes.pop();
        nextCursor = next?.id;
      }

      return { likes, nextCursor };
    }),

  getSwipeHistory: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(CONNECT_LIMITS.HISTORY_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { cursor, limit } = input;

      // Exclude blocked users
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      });
      const blockedSet = new Set<string>();
      blocks.forEach((b) => {
        blockedSet.add(b.blockerId);
        blockedSet.add(b.blockedId);
      });
      blockedSet.delete(userId);

      const swipes = await prisma.connectSwipe.findMany({
        where: {
          userId,
          ...(blockedSet.size > 0
            ? { targetUserId: { notIn: Array.from(blockedSet) } }
            : {}),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          targetUser: {
            include: {
              connectProfile: {
                select: {
                  id: true,
                  userId: true,
                  headline: true,
                  location: true,
                  mediaSlots: true,
                },
              },
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  disciplines: {
                    include: { discipline: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (swipes.length > limit) {
        const next = swipes.pop();
        nextCursor = next?.id;
      }

      const items = swipes
        .filter((s) => s.targetUser.connectProfile)
        .map((s) => ({
          id: s.targetUser.connectProfile!.id,
          userId: s.targetUserId,
          headline: s.targetUser.connectProfile!.headline,
          location: s.targetUser.connectProfile!.location,
          mediaSlots: s.targetUser.connectProfile!.mediaSlots,
          user: {
            profile: s.targetUser.profile,
          },
          swipeType: s.type,
          swipedAt: s.createdAt,
        }));

      return { items, nextCursor };
    }),

  /// Returns a privacy-safe set of pins for the globe view. Stored GPS coords
  /// are never exposed — each pin is snapped to a ~22km grid with a
  /// deterministic per-user scatter, so a user's dot is stable across
  /// sessions but can't be reverse-geocoded back to their real location.
  ///
  /// Gated to INFINITE-tier users because the globe is a paid feature.
  getGlobalPins: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;

      // Gate: require admin or INFINITE-tier — matches hasInfiniteAccess on the client.
      const self = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          connectProfile: { select: { connectTier: true } },
        },
      });
      const isAdmin = self?.role === "ADMIN";
      const isInfinite = self?.connectProfile?.connectTier === "INFINITE";
      if (!isAdmin && !isInfinite) {
        return { pins: [] };
      }

      // Blocks filter both directions — don't show users who blocked the viewer
      // and don't show users the viewer blocked.
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: { blockerId: true, blockedId: true },
      });
      const blockedSet = new Set<string>();
      blocks.forEach((b) => {
        blockedSet.add(b.blockerId);
        blockedSet.add(b.blockedId);
      });
      blockedSet.add(userId); // also exclude self

      const profiles = await prisma.connectProfile.findMany({
        where: {
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
          userId: { notIn: Array.from(blockedSet) },
        },
        select: {
          userId: true,
          location: true,
          latitude: true,
          longitude: true,
          connectTier: true,
          user: {
            select: {
              role: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  username: true,
                },
              },
            },
          },
        },
        take: 5000, // cap the payload — enough for a populated globe
      });

      const pins = profiles
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => {
          const { lat, lon } = privacyScatter(
            p.userId,
            p.latitude!,
            p.longitude!
          );
          return {
            userId: p.userId,
            lat,
            lon,
            city: p.location ?? null,
            role: p.user.role, // CREATIVE | CLIENT | ADMIN
            isInfinite: p.connectTier === "INFINITE",
            displayName: p.user.profile?.displayName ?? null,
            avatarUrl: p.user.profile?.avatarUrl ?? null,
            username: p.user.profile?.username ?? null,
          };
        });

      return { pins };
    }),
});
