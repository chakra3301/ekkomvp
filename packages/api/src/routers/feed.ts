import { z } from "zod";
import { prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, publicProcedure, protectedProcedure } from "../trpc";

const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).default(LIMITS.FEED_PAGE_SIZE),
});

export const feedRouter = router({
  getChronological: publicProcedure
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input;

      // Get blocked user IDs for filtering
      let blockedUserIds: string[] = [];
      if (ctx.user) {
        const blocks = await prisma.block.findMany({
          where: { blockerId: ctx.user.id },
          select: { blockedId: true },
        });
        blockedUserIds = blocks.map((b) => b.blockedId);
      }

      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { collectiveId: null },
            { collectiveVisibility: "BOTH" },
          ],
          ...(blockedUserIds.length > 0
            ? { userId: { notIn: blockedUserIds } }
            : {}),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
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
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      // Transform posts to include likesCount and commentsCount
      const transformedPosts = posts.map((post) => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      }));

      return {
        posts: transformedPosts,
        nextCursor,
      };
    }),

  getCollectivesFeed: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      // Get all collective IDs the user is an active member of
      const memberships = await prisma.collectiveMember.findMany({
        where: { userId: ctx.user.id, status: "ACTIVE" },
        select: { collectiveId: true },
      });

      const collectiveIds = memberships.map((m) => m.collectiveId);

      if (collectiveIds.length === 0) {
        return { posts: [], nextCursor: undefined };
      }

      const posts = await prisma.post.findMany({
        where: {
          collectiveId: { in: collectiveIds },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
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
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
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

      return {
        posts: transformedPosts,
        nextCursor,
      };
    }),

  getUserPosts: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.FEED_PAGE_SIZE),
        excludePinned: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { userId, cursor, limit, excludePinned } = input;

      const posts = await prisma.post.findMany({
        where: {
          userId,
          ...(excludePinned ? { isPinned: false } : {}),
          OR: [
            { collectiveId: null },
            { collectiveVisibility: "BOTH" },
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
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
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      // Transform posts to include likesCount and commentsCount
      const transformedPosts = posts.map((post) => ({
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      }));

      return {
        posts: transformedPosts,
        nextCursor,
      };
    }),

  getLikedPosts: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.FEED_PAGE_SIZE),
      })
    )
    .query(async ({ input }) => {
      const { userId, cursor, limit } = input;

      const likes = await prisma.like.findMany({
        where: { userId },
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
                    },
                  },
                },
              },
              collective: { select: { name: true, slug: true } },
              blocks: { orderBy: { sortOrder: "asc" } },
              likes: {
                select: {
                  userId: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (likes.length > limit) {
        const nextItem = likes.pop();
        nextCursor = nextItem?.id;
      }

      // Filter out private collective posts and transform
      const posts = likes
        .map((like) => like.post)
        .filter(
          (post) =>
            !post.collectiveId || post.collectiveVisibility === "BOTH"
        )
        .map((post) => ({
          ...post,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        }));

      return {
        posts,
        nextCursor,
      };
    }),
});
