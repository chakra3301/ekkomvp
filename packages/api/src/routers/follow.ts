import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { createNotification } from "../lib/notifications";

export const followRouter = router({
  follow: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: targetUserId }) => {
      if (ctx.user.id === targetUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot follow yourself" });
      }

      const targetProfile = await prisma.profile.findUnique({
        where: { userId: targetUserId },
      });
      if (!targetProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: ctx.user.id, followingId: targetUserId } },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Already following this user" });
      }

      const currentProfile = await prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!currentProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }

      await prisma.$transaction([
        prisma.follow.create({
          data: { followerId: ctx.user.id, followingId: targetUserId },
        }),
        prisma.profile.update({
          where: { id: currentProfile.id },
          data: { followingCount: { increment: 1 } },
        }),
        prisma.profile.update({
          where: { id: targetProfile.id },
          data: { followersCount: { increment: 1 } },
        }),
      ]);

      await createNotification({
        type: "FOLLOW",
        userId: targetUserId,
        actorId: ctx.user.id,
        entityId: ctx.user.id,
        entityType: "user",
      });

      return { success: true };
    }),

  unfollow: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: targetUserId }) => {
      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: ctx.user.id, followingId: targetUserId } },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not following this user" });
      }

      const currentProfile = await prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });
      const targetProfile = await prisma.profile.findUnique({
        where: { userId: targetUserId },
      });

      await prisma.$transaction([
        prisma.follow.delete({ where: { id: existing.id } }),
        prisma.profile.update({
          where: { id: currentProfile!.id },
          data: { followingCount: { decrement: 1 } },
        }),
        prisma.profile.update({
          where: { id: targetProfile!.id },
          data: { followersCount: { decrement: 1 } },
        }),
      ]);

      return { success: true };
    }),

  isFollowing: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: targetUserId }) => {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: ctx.user.id, followingId: targetUserId } },
      });
      return { isFollowing: !!follow };
    }),

  getFollowers: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { userId, cursor, limit } = input;
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            include: {
              profile: {
                select: { username: true, displayName: true, avatarUrl: true, verificationStatus: true },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (follows.length > limit) {
        nextCursor = follows.pop()?.id;
      }
      return { followers: follows, nextCursor };
    }),

  getFollowing: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { userId, cursor, limit } = input;
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          following: {
            include: {
              profile: {
                select: { username: true, displayName: true, avatarUrl: true, verificationStatus: true },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (follows.length > limit) {
        nextCursor = follows.pop()?.id;
      }
      return { following: follows, nextCursor };
    }),
});
