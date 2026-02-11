import { z } from "zod";
import { prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, publicProcedure } from "../trpc";

export const trendingRouter = router({
  getTrendingTags: publicProcedure.query(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        tags: { isEmpty: false },
      },
      select: { tags: true },
    });

    // Aggregate tag frequencies
    const tagCounts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    // Sort by frequency and return top 10
    const trending = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return trending;
  }),

  getTrendingPosts: publicProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.FEED_PAGE_SIZE),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Fetch recent posts with engagement data
      const posts = await prisma.post.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          OR: [
            { collectiveId: null },
            { collectiveVisibility: "BOTH" },
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [
          { likesCount: "desc" },
          { commentsCount: "desc" },
          { createdAt: "desc" },
        ],
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
            },
          },
          collective: { select: { name: true, slug: true } },
          blocks: { orderBy: { sortOrder: "asc" } },
          likes: { select: { userId: true } },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      const transformedPosts = posts.map((post) => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      }));

      return { posts: transformedPosts, nextCursor };
    }),
});
