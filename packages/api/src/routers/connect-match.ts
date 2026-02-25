import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";

export const connectMatchRouter = router({
  swipe: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().uuid(),
        type: z.enum(["LIKE", "PASS"]),
        likedContentType: z.enum(["PHOTO", "VIDEO", "AUDIO", "MODEL", "PROMPT"]).optional(),
        likedContentIndex: z.number().int().min(0).optional(),
        matchNote: z.string().max(CONNECT_LIMITS.MATCH_NOTE_MAX).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (userId === input.targetUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot swipe on yourself" });
      }

      // Check daily like limit
      if (input.type === "LIKE") {
        const userProfile = await prisma.profile.findUnique({
          where: { userId },
          select: { subscriptionTier: true },
        });

        const tier = userProfile?.subscriptionTier || "FREE";
        const dailyLimit =
          tier === "BUSINESS"
            ? CONNECT_LIMITS.DAILY_LIKES_BUSINESS
            : tier === "PRO"
              ? CONNECT_LIMITS.DAILY_LIKES_PRO
              : CONNECT_LIMITS.DAILY_LIKES_FREE;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayLikes = await prisma.connectSwipe.count({
          where: {
            userId,
            type: "LIKE",
            createdAt: { gte: todayStart },
          },
        });

        if (todayLikes >= dailyLimit) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Daily like limit reached (${dailyLimit}). Upgrade for more!`,
          });
        }
      }

      // Check if already swiped
      const existing = await prisma.connectSwipe.findUnique({
        where: { userId_targetUserId: { userId, targetUserId: input.targetUserId } },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Already swiped on this user" });
      }

      // Create swipe
      await prisma.connectSwipe.create({
        data: {
          userId,
          targetUserId: input.targetUserId,
          type: input.type,
          likedContentType: input.likedContentType,
          likedContentIndex: input.likedContentIndex,
          matchNote: input.matchNote,
        },
      });

      // If LIKE, check for mutual
      if (input.type === "LIKE") {
        // Increment likes received counter
        await prisma.connectProfile.updateMany({
          where: { userId: input.targetUserId },
          data: { likesReceivedCount: { increment: 1 } },
        });

        // Send notification
        await prisma.notification.create({
          data: {
            type: "CONNECT_LIKE",
            userId: input.targetUserId,
            actorId: userId,
          },
        });

        // Check if target has already liked us
        const reverseSwipe = await prisma.connectSwipe.findUnique({
          where: {
            userId_targetUserId: {
              userId: input.targetUserId,
              targetUserId: userId,
            },
          },
        });

        if (reverseSwipe && reverseSwipe.type === "LIKE") {
          // Mutual match! Create match with normalized user order
          const [user1Id, user2Id] = [userId, input.targetUserId].sort();

          const match = await prisma.connectMatch.create({
            data: { user1Id, user2Id },
          });

          // Increment match counters
          await prisma.$transaction([
            prisma.connectProfile.updateMany({
              where: { userId },
              data: { matchesCount: { increment: 1 } },
            }),
            prisma.connectProfile.updateMany({
              where: { userId: input.targetUserId },
              data: { matchesCount: { increment: 1 } },
            }),
          ]);

          // Send match notifications to both users
          await prisma.notification.createMany({
            data: [
              {
                type: "CONNECT_MATCH",
                userId,
                actorId: input.targetUserId,
                entityId: match.id,
                entityType: "CONNECT_MATCH",
              },
              {
                type: "CONNECT_MATCH",
                userId: input.targetUserId,
                actorId: userId,
                entityId: match.id,
                entityType: "CONNECT_MATCH",
              },
            ],
          });

          return { matched: true, matchId: match.id };
        }
      }

      return { matched: false };
    }),

  getMatches: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(CONNECT_LIMITS.MATCHES_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { cursor, limit } = input;

      const matches = await prisma.connectMatch.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: "ACTIVE",
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          user1: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verificationStatus: true,
                },
              },
              connectProfile: {
                select: { headline: true, mediaSlots: true },
              },
            },
          },
          user2: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verificationStatus: true,
                },
              },
              connectProfile: {
                select: { headline: true, mediaSlots: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true, senderId: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (matches.length > limit) {
        const next = matches.pop();
        nextCursor = next?.id;
      }

      // Map to simpler format with the "other" user
      const formatted = matches.map((match) => {
        const otherUser = match.user1Id === userId ? match.user2 : match.user1;
        const lastMessage = match.messages[0] || null;

        return {
          id: match.id,
          otherUser,
          lastMessage,
          createdAt: match.createdAt,
        };
      });

      return { matches: formatted, nextCursor };
    }),

  getMatch: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: matchId }) => {
      const match = await prisma.connectMatch.findUnique({
        where: { id: matchId },
        include: {
          user1: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verificationStatus: true,
                },
              },
              connectProfile: true,
            },
          },
          user2: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verificationStatus: true,
                },
              },
              connectProfile: true,
            },
          },
        },
      });

      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      if (match.user1Id !== ctx.user.id && match.user2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your match" });
      }

      return match;
    }),

  unmatch: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: matchId }) => {
      const match = await prisma.connectMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      if (match.user1Id !== ctx.user.id && match.user2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your match" });
      }

      await prisma.connectMatch.update({
        where: { id: matchId },
        data: { status: "UNMATCHED" },
      });

      // Decrement match counters
      await prisma.$transaction([
        prisma.connectProfile.updateMany({
          where: { userId: match.user1Id },
          data: { matchesCount: { decrement: 1 } },
        }),
        prisma.connectProfile.updateMany({
          where: { userId: match.user2Id },
          data: { matchesCount: { decrement: 1 } },
        }),
      ]);

      return { success: true };
    }),
});
