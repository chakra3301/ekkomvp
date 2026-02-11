import { z } from "zod";
import { prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
  getNotifications: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.NOTIFICATION_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const notifications = await prisma.notification.findMany({
        where: { userId: ctx.user.id },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            include: {
              profile: {
                select: { username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        nextCursor = notifications.pop()?.id;
      }

      return { notifications, nextCursor };
    }),

  markAsRead: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: notificationId }) => {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: ctx.user.id },
        data: { read: true },
      });
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.notification.updateMany({
      where: { userId: ctx.user.id, read: false },
      data: { read: true },
    });
    return { success: true };
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await prisma.notification.count({
      where: { userId: ctx.user.id, read: false },
    });
    return { count };
  }),
});
