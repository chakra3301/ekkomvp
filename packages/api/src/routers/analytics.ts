import { z } from "zod";
import { prisma } from "@ekko/database";

import { router, publicProcedure, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
  trackProfileView: publicProcedure
    .input(z.string().uuid())
    .mutation(async ({ input: profileId, ctx }) => {
      const viewerId = ctx.user?.id || null;

      // Debounce: max 1 view per viewer per profile per day
      if (viewerId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.profileView.findFirst({
          where: {
            profileId,
            viewerId,
            createdAt: { gte: today },
          },
        });

        if (existing) return { tracked: false };
      }

      await prisma.$transaction([
        prisma.profileView.create({
          data: { profileId, viewerId },
        }),
        prisma.profile.update({
          where: { id: profileId },
          data: { profileViewsCount: { increment: 1 } },
        }),
      ]);

      return { tracked: true };
    }),

  trackPostView: publicProcedure
    .input(z.string().uuid())
    .mutation(async ({ input: postId, ctx }) => {
      const viewerId = ctx.user?.id || null;

      // Debounce: max 1 view per viewer per post per day
      if (viewerId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.postView.findFirst({
          where: {
            postId,
            viewerId,
            createdAt: { gte: today },
          },
        });

        if (existing) return { tracked: false };
      }

      await prisma.postView.create({
        data: { postId, viewerId },
      });

      return { tracked: true };
    }),

  getProfileAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true, profileViewsCount: true },
    });

    if (!profile) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Profile views per day for last 30 days
    const profileViews = await prisma.profileView.findMany({
      where: {
        profileId: profile.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    // Group by day
    const viewsByDay = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      viewsByDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const view of profileViews) {
      const day = new Date(view.createdAt).toISOString().slice(0, 10);
      viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
    }

    const dailyViews = [...viewsByDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Top posts by engagement
    const topPosts = await prisma.post.findMany({
      where: { userId: ctx.user.id },
      orderBy: [
        { likesCount: "desc" },
        { commentsCount: "desc" },
      ],
      take: 10,
      select: {
        id: true,
        content: true,
        likesCount: true,
        commentsCount: true,
        bookmarksCount: true,
        createdAt: true,
      },
    });

    // Post views for last 30 days
    const postIds = topPosts.map((p) => p.id);
    const postViews = await prisma.postView.groupBy({
      by: ["postId"],
      where: {
        postId: { in: postIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });
    const postViewMap = new Map(postViews.map((pv) => [pv.postId, pv._count]));

    const topPostsWithViews = topPosts.map((p) => ({
      ...p,
      views: postViewMap.get(p.id) || 0,
    }));

    // Follower growth (new followers in last 30 days)
    const newFollowers = await prisma.follow.count({
      where: {
        followingId: ctx.user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Total followers
    const totalFollowers = await prisma.profile.findUnique({
      where: { userId: ctx.user.id },
      select: { followersCount: true },
    });

    // Total post views (30d) - get all user's post IDs first
    const allUserPostIds = await prisma.post.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    const totalPostViews = await prisma.postView.count({
      where: {
        postId: { in: allUserPostIds.map((p) => p.id) },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      profileViewsTotal: profile.profileViewsCount,
      profileViews30d: profileViews.length,
      dailyViews,
      topPosts: topPostsWithViews,
      totalPostViews30d: totalPostViews,
      totalFollowers: totalFollowers?.followersCount || 0,
      newFollowers30d: newFollowers,
    };
  }),
});
