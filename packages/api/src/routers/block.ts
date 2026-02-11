import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";

import { router, protectedProcedure } from "../trpc";

export const blockRouter = router({
  block: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: blockedId }) => {
      if (blockedId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot block yourself" });
      }

      await prisma.block.upsert({
        where: {
          blockerId_blockedId: { blockerId: ctx.user.id, blockedId },
        },
        create: { blockerId: ctx.user.id, blockedId },
        update: {},
      });

      // Also remove any follow relationships in both directions
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: ctx.user.id, followingId: blockedId },
            { followerId: blockedId, followingId: ctx.user.id },
          ],
        },
      });

      return { blocked: true };
    }),

  unblock: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: blockedId }) => {
      await prisma.block.deleteMany({
        where: { blockerId: ctx.user.id, blockedId },
      });
      return { blocked: false };
    }),

  isBlocked: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: userId }) => {
      const [blockedByMe, blockedByThem] = await Promise.all([
        prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: ctx.user.id, blockedId: userId } },
        }),
        prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: userId, blockedId: ctx.user.id } },
        }),
      ]);
      return {
        blockedByMe: !!blockedByMe,
        blockedByThem: !!blockedByThem,
      };
    }),

  getBlockedUsers: protectedProcedure.query(async ({ ctx }) => {
    const blocks = await prisma.block.findMany({
      where: { blockerId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        blocked: {
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

    return blocks.map((b) => ({
      id: b.blocked.id,
      profile: b.blocked.profile,
      blockedAt: b.createdAt,
    }));
  }),
});
