import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { CONNECT_LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";
import { sendPushToUser } from "../lib/push";
import { assertCleanContent } from "../lib/content-filter";

export const connectChatRouter = router({
  getMessages: protectedProcedure
    .input(
      z.object({
        matchId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(CONNECT_LIMITS.MESSAGES_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { matchId, cursor, limit } = input;

      // Verify user is in this match
      const match = await prisma.connectMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      if (match.user1Id !== ctx.user.id && match.user2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your match" });
      }

      const messages = await prisma.connectMessage.findMany({
        where: { matchId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        const next = messages.pop();
        nextCursor = next?.id;
      }

      return { messages, nextCursor };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        matchId: z.string().uuid(),
        content: z.string().max(CONNECT_LIMITS.MESSAGE_MAX).default(""),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { matchId, content, imageUrl } = input;

      if (!content && !imageUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Message must have content or an image" });
      }

      assertCleanContent(content);

      // Verify user is in this match and it's active
      const match = await prisma.connectMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      if (match.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Match is no longer active" });
      }

      if (match.user1Id !== ctx.user.id && match.user2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your match" });
      }

      const receiverId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;

      const message = await prisma.connectMessage.create({
        data: {
          matchId,
          senderId: ctx.user.id,
          content: content || (imageUrl ? "📷 Photo" : ""),
          imageUrl,
        },
        include: {
          sender: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Update match updatedAt for sorting
      await prisma.connectMatch.update({
        where: { id: matchId },
        data: { updatedAt: new Date() },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          type: "CONNECT_MESSAGE",
          userId: receiverId,
          actorId: ctx.user.id,
          entityId: matchId,
          entityType: "CONNECT_MATCH",
        },
      });

      // Push notification
      const senderName = message.sender.profile?.displayName || "Someone";
      const preview = imageUrl
        ? "📷 Photo"
        : (content || "").slice(0, 50) + ((content || "").length > 50 ? "…" : "");
      sendPushToUser(receiverId, {
        title: senderName,
        body: preview,
        url: `/matches/${matchId}`,
      }).catch(() => {});

      return message;
    }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        matchId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Mark all unread messages in this match as read
      await prisma.connectMessage.updateMany({
        where: {
          matchId: input.matchId,
          senderId: { not: ctx.user.id },
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return { success: true };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    // Get all active matches for user
    const matches = await prisma.connectMatch.findMany({
      where: {
        OR: [{ user1Id: ctx.user.id }, { user2Id: ctx.user.id }],
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const matchIds = matches.map((m) => m.id);

    if (matchIds.length === 0) return { count: 0 };

    const count = await prisma.connectMessage.count({
      where: {
        matchId: { in: matchIds },
        senderId: { not: ctx.user.id },
        readAt: null,
      },
    });

    return { count };
  }),

  bridgeToEkko: protectedProcedure
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

      // If already bridged, return existing conversation
      if (match.ekkoConversationId) {
        return { conversationId: match.ekkoConversationId };
      }

      const otherUserId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;

      // Normalize participant order for EKKO conversation
      const [p1, p2] = [ctx.user.id, otherUserId].sort();

      // Find or create EKKO conversation
      let conversation = await prisma.conversation.findUnique({
        where: {
          participant1Id_participant2Id: {
            participant1Id: p1,
            participant2Id: p2,
          },
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participant1Id: p1,
            participant2Id: p2,
          },
        });
      }

      // Link the match to the EKKO conversation
      await prisma.connectMatch.update({
        where: { id: matchId },
        data: { ekkoConversationId: conversation.id },
      });

      return { conversationId: conversation.id };
    }),
});
