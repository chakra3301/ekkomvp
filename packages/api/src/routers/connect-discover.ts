import { z } from "zod";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";

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
            subscriptionTier: z.enum(["FREE", "PRO", "BUSINESS", "ALL"]).optional(),
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

      if (filters?.location) {
        where.location = { contains: filters.location, mode: "insensitive" };
      }

      // Role & tier filters apply to the related User/Profile
      const userWhere: Record<string, unknown> = {};
      if (filters?.role && filters.role !== "ALL") {
        userWhere.role = filters.role;
      }

      const profileWhere: Record<string, unknown> = {};
      if (filters?.subscriptionTier && filters.subscriptionTier !== "ALL") {
        profileWhere.subscriptionTier = filters.subscriptionTier;
      }

      if (Object.keys(userWhere).length > 0 || Object.keys(profileWhere).length > 0) {
        where.user = {
          ...userWhere,
          ...(Object.keys(profileWhere).length > 0 ? { profile: profileWhere } : {}),
        };
      }

      const profiles = await prisma.connectProfile.findMany({
        where,
        take: limit,
        orderBy: [{ updatedAt: "desc" }],
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
});
