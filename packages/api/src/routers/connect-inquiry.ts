import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";

import { router, protectedProcedure } from "../trpc";
import { assertCleanContent } from "../lib/content-filter";
import { sendPushToUser } from "../lib/push";

// Form payloads, narrowed per inquiry type. Validation lives here so
// junky data never lands in the JSON column. New fields can be added
// without a migration; we just expand the schema.

const bookingPayloadSchema = z.object({
  projectType: z.string().max(80).optional(),
  budget: z.string().max(60).optional(),
  timeline: z.string().max(60).optional(),
  // Free-form pitch / context. Required so the recipient gets *something*.
  message: z.string().min(1).max(800),
  // Optional URL to a brief PDF / Notion / wherever.
  link: z.string().max(400).optional(),
});

const applicationPayloadSchema = z.object({
  // Index into the brand's `clientData.briefs` array (recipient resolves
  // the title from their own data — saves us copying the title here and
  // diverging if the brief is later edited).
  briefIndex: z.number().int().min(0).max(50).optional(),
  // Snapshot of the brief title at apply time so the inbox can show
  // context even if the brief is later removed.
  briefTitle: z.string().max(120).optional(),
  // Free-form pitch.
  message: z.string().min(1).max(800),
  // Optional links to relevant work.
  link: z.string().max(400).optional(),
});

const notePayloadSchema = z.object({
  message: z.string().min(1).max(800),
});

export const connectInquiryRouter = router({
  // Send a new inquiry. Server validates the payload by type, then
  // creates the row, fires a notification + push.
  send: protectedProcedure
    .input(
      z.object({
        toUserId: z.string().uuid(),
        type: z.enum(["BOOKING_REQUEST", "APPLICATION", "NOTE"]),
        payload: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.toUserId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can't send an inquiry to yourself",
        });
      }

      // Per-type payload validation.
      let payload: unknown;
      let preview: string;
      switch (input.type) {
        case "BOOKING_REQUEST": {
          const parsed = bookingPayloadSchema.parse(input.payload);
          assertCleanContent(parsed.message);
          payload = parsed;
          preview = parsed.message.slice(0, 180);
          break;
        }
        case "APPLICATION": {
          const parsed = applicationPayloadSchema.parse(input.payload);
          assertCleanContent(parsed.message);
          payload = parsed;
          // Lead with the brief title when present so the inbox row is
          // immediately scannable.
          preview = parsed.briefTitle
            ? `${parsed.briefTitle} — ${parsed.message}`.slice(0, 180)
            : parsed.message.slice(0, 180);
          break;
        }
        case "NOTE": {
          const parsed = notePayloadSchema.parse(input.payload);
          assertCleanContent(parsed.message);
          payload = parsed;
          preview = parsed.message.slice(0, 180);
          break;
        }
      }

      // Make sure the recipient is a real user (with a profile) so we
      // can read their displayName for push.
      const recipient = await prisma.user.findUnique({
        where: { id: input.toUserId },
        include: { profile: true },
      });
      if (!recipient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
      }

      const inquiry = await prisma.connectInquiry.create({
        data: {
          fromUserId: ctx.user.id,
          toUserId: input.toUserId,
          type: input.type,
          payload: payload as object,
          preview,
        },
        include: {
          fromUser: {
            include: {
              profile: {
                select: { username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      });

      await prisma.notification.create({
        data: {
          type: "CONNECT_INQUIRY",
          userId: input.toUserId,
          actorId: ctx.user.id,
          entityId: inquiry.id,
          entityType: "CONNECT_INQUIRY",
        },
      });

      const senderName = inquiry.fromUser.profile?.displayName || "Someone";
      const titleByType = {
        BOOKING_REQUEST: "wants to book a call",
        APPLICATION: "applied to a brief",
        NOTE: "sent you a note",
      } as const;
      sendPushToUser(input.toUserId, {
        title: `${senderName} ${titleByType[input.type]}`,
        body: preview,
        url: `/likes?tab=requests`,
      }).catch(() => {});

      return inquiry;
    }),

  // Inbox for the signed-in user. Returns received inquiries in
  // reverse-chronological order with sender profile attached.
  listReceived: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          cursor: z.string().uuid().nullable().optional(),
          status: z.enum(["PENDING", "ACCEPTED", "DECLINED"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const items = await prisma.connectInquiry.findMany({
        where: {
          toUserId: ctx.user.id,
          ...(input?.status ? { status: input.status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          fromUser: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
              connectProfile: {
                select: {
                  id: true,
                  headline: true,
                  location: true,
                  profileTemplate: true,
                  accentColor: true,
                  mediaSlots: true,
                },
              },
            },
          },
        },
      });

      const nextCursor = items.length > limit ? items.pop()!.id : null;
      return { inquiries: items, nextCursor };
    }),

  markAsRead: protectedProcedure
    .input(z.object({ inquiryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Only the recipient can mark as read. Updating a foreign row will
      // count = 0 and silently no-op.
      await prisma.connectInquiry.updateMany({
        where: { id: input.inquiryId, toUserId: ctx.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.connectInquiry.updateMany({
      where: { toUserId: ctx.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }),

  setStatus: protectedProcedure
    .input(
      z.object({
        inquiryId: z.string().uuid(),
        status: z.enum(["PENDING", "ACCEPTED", "DECLINED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.connectInquiry.updateMany({
        where: { id: input.inquiryId, toUserId: ctx.user.id },
        data: { status: input.status },
      });
      if (updated.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
      }
      return { success: true };
    }),

  // Used to drive the badge on the Likes → Requests tab.
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await prisma.connectInquiry.count({
      where: { toUserId: ctx.user.id, readAt: null },
    });
    return { count };
  }),
});
