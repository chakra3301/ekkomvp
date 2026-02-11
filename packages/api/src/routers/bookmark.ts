import { z } from "zod";
import { prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";

export const bookmarkRouter = router({
  toggle: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: postId }) => {
      const userId = ctx.user.id;

      const existing = await prisma.bookmark.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existing) {
        await prisma.$transaction([
          prisma.bookmark.delete({
            where: { id: existing.id },
          }),
          prisma.post.update({
            where: { id: postId },
            data: { bookmarksCount: { decrement: 1 } },
          }),
        ]);
        return { bookmarked: false };
      } else {
        await prisma.$transaction([
          prisma.bookmark.create({
            data: { postId, userId },
          }),
          prisma.post.update({
            where: { id: postId },
            data: { bookmarksCount: { increment: 1 } },
          }),
        ]);
        return { bookmarked: true };
      }
    }),

  isBookmarked: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: postId }) => {
      const bookmark = await prisma.bookmark.findUnique({
        where: { postId_userId: { postId, userId: ctx.user.id } },
      });
      return { isBookmarked: !!bookmark };
    }),

  getBookmarked: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.FEED_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: ctx.user.id },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          post: {
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
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (bookmarks.length > limit) {
        const nextItem = bookmarks.pop();
        nextCursor = nextItem?.id;
      }

      const posts = bookmarks
        .map((b) => b.post)
        .filter(
          (post) =>
            !post.collectiveId || post.collectiveVisibility === "BOTH"
        )
        .map((post) => ({
          ...post,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        }));

      return { posts, nextCursor };
    }),
});
