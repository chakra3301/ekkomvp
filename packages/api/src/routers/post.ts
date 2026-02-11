import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, MediaType, PortfolioBlockType } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, publicProcedure, protectedProcedure } from "../trpc";
import { createNotification } from "../lib/notifications";
import { extractTags } from "../lib/tags";

const postBlockTypeSchema = z.nativeEnum(PortfolioBlockType).refine((v) => v !== "DIVIDER", {
  message: "Divider is not allowed in posts",
});

const createPostSchema = z.object({
  content: z.string().max(LIMITS.POST_MAX_LENGTH).optional(),
  mediaUrls: z.array(z.string().url()).max(LIMITS.MAX_POST_IMAGES).optional(),
  mediaType: z.nativeEnum(MediaType).default(MediaType.IMAGE),
  blocks: z
    .array(
      z.object({
        type: postBlockTypeSchema,
        content: z.record(z.unknown()),
      })
    )
    .max(20)
    .optional(),
});

const updatePostSchema = z.object({
  id: z.string().uuid(),
  content: z.string().max(LIMITS.POST_MAX_LENGTH).optional(),
});

const commentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(LIMITS.COMMENT_MAX_LENGTH),
});

export const postRouter = router({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const hasContent = !!input.content?.trim();
      const hasMedia = input.mediaUrls && input.mediaUrls.length > 0;
      const hasBlocks = input.blocks && input.blocks.length > 0;
      if (!hasContent && !hasMedia && !hasBlocks) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post must have content, media, or blocks",
        });
      }

      const tags = input.content ? extractTags(input.content) : [];

      const post = await prisma.post.create({
        data: {
          userId: ctx.user.id,
          content: input.content?.trim() || null,
          mediaUrls: input.mediaUrls || [],
          mediaType: input.mediaType,
          tags,
          blocks:
            input.blocks && input.blocks.length > 0
              ? {
                  create: input.blocks.map((b, i) => ({
                    type: b.type as PortfolioBlockType,
                    content: b.content as object,
                    sortOrder: i,
                  })),
                }
              : undefined,
        },
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
          blocks: { orderBy: { sortOrder: "asc" } },
        },
      });

      return post;
    }),

  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const post = await prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (post.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own posts",
        });
      }

      // Check if within 24 hours
      const hoursSinceCreation =
        (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 24) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Posts can only be edited within 24 hours",
        });
      }

      const updatedPost = await prisma.post.update({
        where: { id: input.id },
        data: {
          content: input.content,
          isEdited: true,
        },
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
        },
      });

      return updatedPost;
    }),

  delete: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: postId }) => {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (post.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own posts",
        });
      }

      await prisma.post.delete({
        where: { id: postId },
      });

      return { success: true };
    }),

  pin: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: postId }) => {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      if (post.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only pin your own posts" });
      }

      if (post.isPinned) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Post is already pinned" });
      }

      const pinnedCount = await prisma.post.count({
        where: { userId: ctx.user.id, isPinned: true },
      });

      if (pinnedCount >= 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only pin up to 3 posts",
        });
      }

      await prisma.post.update({
        where: { id: postId },
        data: { isPinned: true, pinnedAt: new Date() },
      });

      return { success: true };
    }),

  unpin: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: postId }) => {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      if (post.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only unpin your own posts" });
      }

      await prisma.post.update({
        where: { id: postId },
        data: { isPinned: false, pinnedAt: null },
      });

      return { success: true };
    }),

  getPinnedByUser: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input: userId, ctx }) => {
      const posts = await prisma.post.findMany({
        where: {
          userId,
          isPinned: true,
          OR: [
            { collectiveId: null },
            { collectiveVisibility: "BOTH" },
          ],
        },
        orderBy: { pinnedAt: "desc" },
        take: 3,
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
          blocks: { orderBy: { sortOrder: "asc" } },
          likes: ctx.user
            ? { where: { userId: ctx.user.id }, select: { id: true } }
            : false,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return posts.map((post) => ({
        ...post,
        isLiked: ctx.user ? Array.isArray(post.likes) && post.likes.length > 0 : false,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      }));
    }),

  getById: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input: postId }) => {
      const post = await prisma.post.findUnique({
        where: { id: postId },
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
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      };
    }),

  like: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: postId }) => {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: ctx.user.id,
          },
        },
      });

      if (existingLike) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already liked this post",
        });
      }

      await prisma.$transaction([
        prisma.like.create({
          data: {
            postId,
            userId: ctx.user.id,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);

      await createNotification({
        type: "LIKE",
        userId: post.userId,
        actorId: ctx.user.id,
        entityId: postId,
        entityType: "post",
      });

      return { success: true };
    }),

  unlike: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: postId }) => {
      const existingLike = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: ctx.user.id,
          },
        },
      });

      if (!existingLike) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Like not found",
        });
      }

      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      return { success: true };
    }),

  getComments: publicProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { postId, cursor, limit } = input;

      const comments = await prisma.comment.findMany({
        where: { postId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "asc" },
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
        },
      });

      let nextCursor: string | undefined = undefined;
      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  addComment: protectedProcedure
    .input(commentSchema)
    .mutation(async ({ ctx, input }) => {
      const post = await prisma.post.findUnique({
        where: { id: input.postId },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const [comment] = await prisma.$transaction([
        prisma.comment.create({
          data: {
            postId: input.postId,
            userId: ctx.user.id,
            content: input.content,
          },
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
          },
        }),
        prisma.post.update({
          where: { id: input.postId },
          data: { commentsCount: { increment: 1 } },
        }),
      ]);

      await createNotification({
        type: "COMMENT",
        userId: post.userId,
        actorId: ctx.user.id,
        entityId: input.postId,
        entityType: "post",
      });

      return comment;
    }),

  deleteComment: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: commentId }) => {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (comment.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments",
        });
      }

      await prisma.$transaction([
        prisma.comment.delete({
          where: { id: commentId },
        }),
        prisma.post.update({
          where: { id: comment.postId },
          data: { commentsCount: { decrement: 1 } },
        }),
      ]);

      return { success: true };
    }),
});
