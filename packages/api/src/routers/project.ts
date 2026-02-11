import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma, ProjectStatus } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, publicProcedure, protectedProcedure } from "../trpc";
import { createNotification } from "../lib/notifications";

const createProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  budgetType: z.enum(["FIXED", "HOURLY", "MILESTONE"]),
  budgetMin: z.number().min(0).optional().nullable(),
  budgetMax: z.number().min(0).optional().nullable(),
  duration: z.string().max(100).optional().nullable(),
  locationType: z.enum(["REMOTE", "ONSITE", "HYBRID"]),
  location: z.string().max(200).optional().nullable(),
  deadline: z.string().optional().nullable(),
  skillsNeeded: z.array(z.string()).default([]),
  disciplineId: z.string().uuid().optional().nullable(),
  isDirect: z.boolean().default(false),
  targetCreativeId: z.string().uuid().optional().nullable(),
});

export const projectRouter = router({
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { role: true },
      });

      if (user?.role !== "CLIENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can create projects",
        });
      }

      if (input.isDirect && !input.targetCreativeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Direct requests must specify a target creative",
        });
      }

      const project = await prisma.project.create({
        data: {
          clientId: ctx.user.id,
          title: input.title,
          description: input.description,
          budgetType: input.budgetType,
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          duration: input.duration,
          locationType: input.locationType,
          location: input.location,
          deadline: input.deadline ? new Date(input.deadline) : null,
          skillsNeeded: input.skillsNeeded,
          disciplineId: input.disciplineId,
          isDirect: input.isDirect,
          targetCreativeId: input.targetCreativeId,
          status: input.isDirect ? "OPEN" : "OPEN",
        },
      });

      // Notify target creative for direct requests
      if (input.isDirect && input.targetCreativeId) {
        createNotification({
          type: "WORK_REQUEST",
          userId: input.targetCreativeId,
          actorId: ctx.user.id,
          entityId: project.id,
          entityType: "project",
        });
      }

      return project;
    }),

  getAll: publicProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.GIGS_PAGE_SIZE),
        disciplineId: z.string().uuid().optional(),
        budgetType: z.enum(["FIXED", "HOURLY", "MILESTONE"]).optional(),
        locationType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit, disciplineId, budgetType, locationType, search } = input;

      const where: Record<string, unknown> = {
        status: "OPEN" as ProjectStatus,
        isDirect: false,
      };

      if (disciplineId) where.disciplineId = disciplineId;
      if (budgetType) where.budgetType = budgetType;
      if (locationType) where.locationType = locationType;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const projects = await prisma.project.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  username: true,
                  companyName: true,
                },
              },
            },
          },
          discipline: { select: { id: true, name: true, slug: true } },
          _count: { select: { applications: true } },
        },
      });

      let nextCursor: string | undefined;
      if (projects.length > limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem!.id;
      }

      return { projects, nextCursor };
    }),

  getById: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input: id }) => {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  username: true,
                  companyName: true,
                  headline: true,
                },
              },
            },
          },
          discipline: { select: { id: true, name: true, slug: true } },
          _count: { select: { applications: true } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return project;
    }),

  getMyProjects: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.GIGS_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const projects = await prisma.project.findMany({
        where: { clientId: ctx.user.id },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          discipline: { select: { id: true, name: true } },
          _count: { select: { applications: true } },
        },
      });

      let nextCursor: string | undefined;
      if (projects.length > limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem!.id;
      }

      return { projects, nextCursor };
    }),

  getDirectRequests: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.GIGS_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const projects = await prisma.project.findMany({
        where: {
          targetCreativeId: ctx.user.id,
          isDirect: true,
          status: "OPEN",
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  username: true,
                  companyName: true,
                },
              },
            },
          },
          discipline: { select: { id: true, name: true } },
        },
      });

      let nextCursor: string | undefined;
      if (projects.length > limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem!.id;
      }

      return { projects, nextCursor };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).max(5000).optional(),
        budgetType: z.enum(["FIXED", "HOURLY", "MILESTONE"]).optional(),
        budgetMin: z.number().min(0).optional().nullable(),
        budgetMax: z.number().min(0).optional().nullable(),
        deadline: z.string().optional().nullable(),
        skillsNeeded: z.array(z.string()).optional(),
        disciplineId: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (project.clientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your project" });
      }
      if (project.status !== "DRAFT" && project.status !== "OPEN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only edit draft or open projects",
        });
      }

      return prisma.project.update({
        where: { id },
        data: {
          ...data,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
        },
      });
    }),

  cancel: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (project.clientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your project" });
      }

      return prisma.project.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    }),
});
