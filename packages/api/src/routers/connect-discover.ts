import { z } from "zod";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";

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

      // Get IDs of users already swiped on
      const swipedUserIds = await prisma.connectSwipe.findMany({
        where: { userId },
        select: { targetUserId: true },
      });
      const swipedSet = new Set(swipedUserIds.map((s) => s.targetUserId));

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

      const likes = await prisma.connectSwipe.findMany({
        where: {
          targetUserId: ctx.user.id,
          type: "LIKE",
          // Exclude users who already have a mutual match
          NOT: {
            userId: {
              in: (
                await prisma.connectMatch.findMany({
                  where: {
                    OR: [
                      { user1Id: ctx.user.id, status: "ACTIVE" },
                      { user2Id: ctx.user.id, status: "ACTIVE" },
                    ],
                  },
                  select: { user1Id: true, user2Id: true },
                })
              ).flatMap((m) =>
                m.user1Id === ctx.user.id ? [m.user2Id] : [m.user1Id]
              ),
            },
          },
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
              connectProfile: true,
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
                  disciplines: {
                    include: { discipline: true },
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
});
