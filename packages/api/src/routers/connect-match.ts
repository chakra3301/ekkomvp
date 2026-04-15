import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";
import { sendPushToUser } from "../lib/push";

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
        const connectProfile = await prisma.connectProfile.findUnique({
          where: { userId },
          select: { connectTier: true },
        });

        const tier = connectProfile?.connectTier || "FREE";
        const dailyLimit =
          tier === "INFINITE"
            ? CONNECT_LIMITS.DAILY_LIKES_INFINITE
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

      // Atomic: create swipe, check mutual, create match (or find existing if
      // the reverse side raced us to it), and update counters/notifications.
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.connectSwipe.findUnique({
          where: { userId_targetUserId: { userId, targetUserId: input.targetUserId } },
        });
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Already swiped on this user" });
        }

        await tx.connectSwipe.create({
          data: {
            userId,
            targetUserId: input.targetUserId,
            type: input.type,
            likedContentType: input.likedContentType,
            likedContentIndex: input.likedContentIndex,
            matchNote: input.matchNote,
          },
        });

        if (input.type !== "LIKE") return { matched: false as const };

        await tx.connectProfile.updateMany({
          where: { userId: input.targetUserId },
          data: { likesReceivedCount: { increment: 1 } },
        });

        await tx.notification.create({
          data: {
            type: "CONNECT_LIKE",
            userId: input.targetUserId,
            actorId: userId,
          },
        });

        const reverseSwipe = await tx.connectSwipe.findUnique({
          where: {
            userId_targetUserId: { userId: input.targetUserId, targetUserId: userId },
          },
        });

        if (!reverseSwipe || reverseSwipe.type !== "LIKE") {
          return { matched: false as const };
        }

        const [user1Id, user2Id] = [userId, input.targetUserId].sort();

        // Upsert-style: if the other side raced us, fall back to the existing row.
        let match;
        try {
          match = await tx.connectMatch.create({ data: { user1Id, user2Id } });
        } catch (e: unknown) {
          if ((e as { code?: string }).code !== "P2002") throw e;
          const found = await tx.connectMatch.findFirst({
            where: { user1Id, user2Id },
          });
          if (!found) throw e;
          match = found;
        }

        await tx.connectProfile.updateMany({
          where: { userId },
          data: { matchesCount: { increment: 1 } },
        });
        await tx.connectProfile.updateMany({
          where: { userId: input.targetUserId },
          data: { matchesCount: { increment: 1 } },
        });

        await tx.notification.createMany({
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

        return { matched: true as const, matchId: match.id };
      });

      // Side effects outside the transaction (non-blocking pushes)
      if (input.type === "LIKE") {
        sendPushToUser(input.targetUserId, {
          title: "Ekko Connect",
          body: "Someone liked your profile ❤️",
          url: "/likes",
        }).catch((e) => console.error("[push] like notification failed:", e));

        if (result.matched) {
          const [actorProfile, targetProfile] = await Promise.all([
            prisma.profile.findUnique({ where: { userId }, select: { displayName: true } }),
            prisma.profile.findUnique({ where: { userId: input.targetUserId }, select: { displayName: true } }),
          ]);
          const matchUrl = `/matches/${result.matchId}`;
          sendPushToUser(input.targetUserId, {
            title: "It's a Match! 🎉",
            body: `You and ${actorProfile?.displayName || "someone"} both liked each other`,
            url: matchUrl,
          }).catch((e) => console.error("[push] match notification failed:", e));
          sendPushToUser(userId, {
            title: "It's a Match! 🎉",
            body: `You and ${targetProfile?.displayName || "someone"} both liked each other`,
            url: matchUrl,
          }).catch((e) => console.error("[push] match notification failed:", e));
        }
      }

      return result;
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

  undoLastSwipe: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Find the most recent swipe (within the last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30_000);

    const lastSwipe = await prisma.connectSwipe.findFirst({
      where: {
        userId,
        createdAt: { gte: thirtySecondsAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastSwipe) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No recent swipe to undo",
      });
    }

    // Delete the swipe
    await prisma.connectSwipe.delete({
      where: { id: lastSwipe.id },
    });

    // If it was a LIKE, decrement likes received counter
    if (lastSwipe.type === "LIKE") {
      await prisma.connectProfile.updateMany({
        where: { userId: lastSwipe.targetUserId },
        data: { likesReceivedCount: { decrement: 1 } },
      });
    }

    return {
      success: true,
      undoneTargetUserId: lastSwipe.targetUserId,
      undoneType: lastSwipe.type,
    };
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
