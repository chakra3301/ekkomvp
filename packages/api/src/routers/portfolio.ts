import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, MediaType, PortfolioBlockType, PortfolioLayout } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, publicProcedure, protectedProcedure } from "../trpc";

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

const createPortfolioItemSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  mediaUrls: z.array(z.string().url()).min(1).max(LIMITS.MAX_PORTFOLIO_IMAGES),
  mediaType: z.nativeEnum(MediaType).default(MediaType.IMAGE),
  thumbnailUrl: z.string().url().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  projectName: z.string().max(100).optional(),
  clientName: z.string().max(100).optional(),
  projectUrl: z.string().url().optional().or(z.literal("")),
});

const updatePortfolioItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  mediaUrls: z.array(z.string().url()).min(1).max(LIMITS.MAX_PORTFOLIO_IMAGES).optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  projectName: z.string().max(100).optional().nullable(),
  clientName: z.string().max(100).optional().nullable(),
  projectUrl: z.string().url().optional().nullable().or(z.literal("")),
  isPublic: z.boolean().optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().min(0),
    })
  ),
});

export const portfolioRouter = router({
  getByUserId: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input: userId }) => {
      const items = await prisma.portfolioItem.findMany({
        where: {
          userId,
          isPublic: true,
        },
        orderBy: { sortOrder: "asc" },
      });

      return items;
    }),

  getById: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input: id }) => {
      const item = await prisma.portfolioItem.findUnique({
        where: { id },
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
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Portfolio item not found",
        });
      }

      return item;
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    const items = await prisma.portfolioItem.findMany({
      where: { userId: ctx.user.id },
      orderBy: { sortOrder: "asc" },
    });

    return items;
  }),

  create: protectedProcedure
    .input(createPortfolioItemSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the highest sort order
      const lastItem = await prisma.portfolioItem.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { sortOrder: "desc" },
      });

      const sortOrder = (lastItem?.sortOrder ?? -1) + 1;

      const item = await prisma.portfolioItem.create({
        data: {
          userId: ctx.user.id,
          ...input,
          tags: input.tags || [],
          projectUrl: input.projectUrl || null,
          sortOrder,
        },
      });

      return item;
    }),

  update: protectedProcedure
    .input(updatePortfolioItemSchema)
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.portfolioItem.findUnique({
        where: { id: input.id },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Portfolio item not found",
        });
      }

      if (item.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own portfolio items",
        });
      }

      const { id, ...updateData } = input;

      const updatedItem = await prisma.portfolioItem.update({
        where: { id },
        data: {
          ...updateData,
          projectUrl: updateData.projectUrl || null,
        },
      });

      return updatedItem;
    }),

  delete: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const item = await prisma.portfolioItem.findUnique({
        where: { id },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Portfolio item not found",
        });
      }

      if (item.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own portfolio items",
        });
      }

      await prisma.portfolioItem.delete({
        where: { id },
      });

      return { success: true };
    }),

  reorder: protectedProcedure
    .input(reorderSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify all items belong to the user
      const itemIds = input.items.map((i) => i.id);
      const items = await prisma.portfolioItem.findMany({
        where: {
          id: { in: itemIds },
          userId: ctx.user.id,
        },
      });

      if (items.length !== itemIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reorder your own portfolio items",
        });
      }

      // Update sort orders in transaction
      await prisma.$transaction(
        input.items.map((item) =>
          prisma.portfolioItem.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );

      return { success: true };
    }),

  // ============ PORTFOLIO PROJECTS (Case Studies / Galleries) ============

  // Get all projects for a user (public view)
  getProjectsByUsername: publicProcedure
    .input(z.string())
    .query(async ({ input: username }) => {
      const profile = await prisma.profile.findUnique({
        where: { username },
        select: { userId: true },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const projects = await prisma.portfolioProject.findMany({
        where: {
          userId: profile.userId,
          isPublic: true,
        },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        include: {
          _count: {
            select: { blocks: true },
          },
        },
      });

      return projects;
    }),

  // Get a single project by username and slug (public view)
  getProjectBySlug: publicProcedure
    .input(
      z.object({
        username: z.string(),
        slug: z.string(),
      })
    )
    .query(async ({ input }) => {
      const profile = await prisma.profile.findUnique({
        where: { username: input.username },
        select: { userId: true, displayName: true, avatarUrl: true, verificationStatus: true },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const project = await prisma.portfolioProject.findUnique({
        where: {
          userId_slug: {
            userId: profile.userId,
            slug: input.slug,
          },
        },
        include: {
          blocks: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!project || !project.isPublic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Increment view count
      await prisma.portfolioProject.update({
        where: { id: project.id },
        data: { viewCount: { increment: 1 } },
      });

      return {
        ...project,
        author: {
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          verificationStatus: profile.verificationStatus,
          username: input.username,
        },
      };
    }),

  // Get my projects (includes private ones)
  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.portfolioProject.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      include: {
        _count: {
          select: { blocks: true },
        },
      },
    });

    return projects;
  }),

  // Get a single project for editing
  getMyProject: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: projectId }) => {
      const project = await prisma.portfolioProject.findUnique({
        where: { id: projectId },
        include: {
          blocks: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own projects",
        });
      }

      return project;
    }),

  // Create a new project
  createProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(2000).optional(),
        coverUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        category: z.string().max(50).optional(),
        tags: z.array(z.string().max(30)).max(15).optional(),
        clientName: z.string().max(100).optional(),
        projectDate: z.string().datetime().optional(),
        projectUrl: z.string().url().optional().or(z.literal("")),
        layout: z.nativeEnum(PortfolioLayout).default(PortfolioLayout.GRID),
        isPublic: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate unique slug
      let baseSlug = generateSlug(input.title);
      let slug = baseSlug;
      let counter = 1;

      // Check if slug exists and make unique if needed
      while (true) {
        const existing = await prisma.portfolioProject.findUnique({
          where: {
            userId_slug: {
              userId: ctx.user.id,
              slug,
            },
          },
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Get the highest sort order
      const lastProject = await prisma.portfolioProject.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { sortOrder: "desc" },
      });

      const sortOrder = (lastProject?.sortOrder ?? -1) + 1;

      const project = await prisma.portfolioProject.create({
        data: {
          userId: ctx.user.id,
          title: input.title,
          slug,
          description: input.description,
          coverUrl: input.coverUrl,
          thumbnailUrl: input.thumbnailUrl,
          category: input.category,
          tags: input.tags || [],
          clientName: input.clientName,
          projectDate: input.projectDate ? new Date(input.projectDate) : null,
          projectUrl: input.projectUrl || null,
          layout: input.layout,
          isPublic: input.isPublic,
          isFeatured: input.isFeatured,
          sortOrder,
        },
      });

      return project;
    }),

  // Update a project
  updateProject: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional().nullable(),
        coverUrl: z.string().url().optional().nullable(),
        thumbnailUrl: z.string().url().optional().nullable(),
        category: z.string().max(50).optional().nullable(),
        tags: z.array(z.string().max(30)).max(15).optional(),
        clientName: z.string().max(100).optional().nullable(),
        projectDate: z.string().datetime().optional().nullable(),
        projectUrl: z.string().url().optional().nullable().or(z.literal("")),
        layout: z.nativeEnum(PortfolioLayout).optional(),
        isPublic: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.portfolioProject.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own projects",
        });
      }

      const { id, ...updateData } = input;

      // If title changed, update slug
      let newSlug = project.slug;
      if (updateData.title && updateData.title !== project.title) {
        let baseSlug = generateSlug(updateData.title);
        newSlug = baseSlug;
        let counter = 1;

        while (true) {
          const existing = await prisma.portfolioProject.findUnique({
            where: {
              userId_slug: {
                userId: ctx.user.id,
                slug: newSlug,
              },
            },
          });
          if (!existing || existing.id === id) break;
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      const updatedProject = await prisma.portfolioProject.update({
        where: { id },
        data: {
          ...updateData,
          slug: newSlug,
          projectDate: updateData.projectDate ? new Date(updateData.projectDate) : updateData.projectDate === null ? null : undefined,
          projectUrl: updateData.projectUrl || null,
        },
      });

      return updatedProject;
    }),

  // Delete a project
  deleteProject: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const project = await prisma.portfolioProject.findUnique({
        where: { id },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own projects",
        });
      }

      await prisma.portfolioProject.delete({
        where: { id },
      });

      return { success: true };
    }),

  // Reorder projects
  reorderProjects: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const projectIds = input.items.map((i) => i.id);
      const projects = await prisma.portfolioProject.findMany({
        where: {
          id: { in: projectIds },
          userId: ctx.user.id,
        },
      });

      if (projects.length !== projectIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reorder your own projects",
        });
      }

      await prisma.$transaction(
        input.items.map((item) =>
          prisma.portfolioProject.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );

      return { success: true };
    }),

  // ============ PORTFOLIO BLOCKS ============

  // Add a block to a project
  addBlock: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        type: z.nativeEnum(PortfolioBlockType),
        content: z.record(z.any()), // Flexible JSON content
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.portfolioProject.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only add blocks to your own projects",
        });
      }

      // Get the highest sort order
      const lastBlock = await prisma.portfolioBlock.findFirst({
        where: { projectId: input.projectId },
        orderBy: { sortOrder: "desc" },
      });

      const sortOrder = (lastBlock?.sortOrder ?? -1) + 1;

      const block = await prisma.portfolioBlock.create({
        data: {
          projectId: input.projectId,
          type: input.type,
          content: input.content,
          sortOrder,
        },
      });

      return block;
    }),

  // Update a block
  updateBlock: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        type: z.nativeEnum(PortfolioBlockType).optional(),
        content: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const block = await prisma.portfolioBlock.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Block not found",
        });
      }

      if (block.project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit blocks in your own projects",
        });
      }

      const { id, ...updateData } = input;

      const updatedBlock = await prisma.portfolioBlock.update({
        where: { id },
        data: updateData,
      });

      return updatedBlock;
    }),

  // Delete a block
  deleteBlock: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const block = await prisma.portfolioBlock.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Block not found",
        });
      }

      if (block.project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete blocks in your own projects",
        });
      }

      await prisma.portfolioBlock.delete({
        where: { id },
      });

      return { success: true };
    }),

  // Reorder blocks within a project
  reorderBlocks: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        blocks: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.portfolioProject.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reorder blocks in your own projects",
        });
      }

      const blockIds = input.blocks.map((b) => b.id);
      const blocks = await prisma.portfolioBlock.findMany({
        where: {
          id: { in: blockIds },
          projectId: input.projectId,
        },
      });

      if (blocks.length !== blockIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid block IDs",
        });
      }

      await prisma.$transaction(
        input.blocks.map((block) =>
          prisma.portfolioBlock.update({
            where: { id: block.id },
            data: { sortOrder: block.sortOrder },
          })
        )
      );

      return { success: true };
    }),
});
