import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";
import { router, protectedProcedure } from "../trpc";

const profileSelect = {
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export const messageRouter = router({
  getOrCreateConversation: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: otherUserId }) => {
      if (ctx.user.id === otherUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself" });
      }

      // Normalize participant ordering for unique constraint
      const [p1, p2] = [ctx.user.id, otherUserId].sort();

      const include = {
        participant1: { include: { profile: { select: profileSelect } } },
        participant2: { include: { profile: { select: profileSelect } } },
      };

      let conversation = await prisma.conversation.findUnique({
        where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
        include,
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { participant1Id: p1, participant2Id: p2 },
          include,
        });
      }

      return conversation;
    }),

  getConversations: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.CONVERSATIONS_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: ctx.user.id },
            { participant2Id: ctx.user.id },
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { lastMessageAt: "desc" },
        include: {
          participant1: { include: { profile: { select: profileSelect } } },
          participant2: { include: { profile: { select: profileSelect } } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true, senderId: true, readAt: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (conversations.length > limit) {
        nextCursor = conversations.pop()?.id;
      }

      return { conversations, nextCursor };
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.MESSAGES_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { conversationId, cursor, limit } = input;

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (
        !conversation ||
        (conversation.participant1Id !== ctx.user.id &&
          conversation.participant2Id !== ctx.user.id)
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const messages = await prisma.message.findMany({
        where: { conversationId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            include: { profile: { select: profileSelect } },
          },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        nextCursor = messages.pop()?.id;
      }

      return { messages, nextCursor };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(LIMITS.MESSAGE_MAX_LENGTH),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: input.conversationId },
      });
      if (
        !conversation ||
        (conversation.participant1Id !== ctx.user.id &&
          conversation.participant2Id !== ctx.user.id)
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const receiverId =
        conversation.participant1Id === ctx.user.id
          ? conversation.participant2Id
          : conversation.participant1Id;

      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            receiverId,
            content: input.content,
          },
          include: {
            sender: {
              include: { profile: { select: profileSelect } },
            },
          },
        }),
        prisma.conversation.update({
          where: { id: input.conversationId },
          data: { lastMessageAt: new Date() },
        }),
      ]);

      return message;
    }),

  markAsRead: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: conversationId }) => {
      await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: ctx.user.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      });
      return { success: true };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await prisma.message.count({
      where: {
        receiverId: ctx.user.id,
        readAt: null,
      },
    });
    return { count };
  }),
});
