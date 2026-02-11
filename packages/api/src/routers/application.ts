import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";
import { createNotification } from "../lib/notifications";

export const applicationRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        coverLetter: z.string().min(10).max(LIMITS.APPLICATION_COVER_LETTER_MAX),
        proposedRate: z.number().min(0).optional().nullable(),
        timeline: z.string().max(200).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { role: true },
      });

      if (user?.role !== "CREATIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only creatives can apply to projects",
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (project.status !== "OPEN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This project is no longer accepting applications",
        });
      }
      if (project.isDirect) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot apply to direct requests",
        });
      }

      // Check for existing application
      const existing = await prisma.application.findUnique({
        where: {
          projectId_creativeId: {
            projectId: input.projectId,
            creativeId: ctx.user.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already applied to this project",
        });
      }

      const application = await prisma.application.create({
        data: {
          projectId: input.projectId,
          creativeId: ctx.user.id,
          coverLetter: input.coverLetter,
          proposedRate: input.proposedRate,
          timeline: input.timeline,
        },
      });

      // Notify the client
      createNotification({
        type: "APPLICATION",
        userId: project.clientId,
        actorId: ctx.user.id,
        entityId: project.id,
        entityType: "project",
      });

      return application;
    }),

  getForProject: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: projectId }) => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (project.clientId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can view applications",
        });
      }

      return prisma.application.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: {
          creative: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  username: true,
                  headline: true,
                  hourlyRateMin: true,
                  hourlyRateMax: true,
                },
              },
            },
          },
        },
      });
    }),

  getMyApplications: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.GIGS_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const applications = await prisma.application.findMany({
        where: { creativeId: ctx.user.id },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              budgetType: true,
              budgetMin: true,
              budgetMax: true,
              status: true,
              client: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarUrl: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (applications.length > limit) {
        const nextItem = applications.pop();
        nextCursor = nextItem!.id;
      }

      return { applications, nextCursor };
    }),

  accept: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: applicationId }) => {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { project: true },
      });

      if (!application) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }
      if (application.project.clientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your project" });
      }
      if (application.status !== "PENDING" && application.status !== "VIEWED" && application.status !== "SHORTLISTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This application has already been processed",
        });
      }

      const agreedRate = application.proposedRate || application.project.budgetMin || 0;

      // Transaction: accept application, create work order + escrow, decline others, update project status
      const result = await prisma.$transaction(async (tx) => {
        // Accept this application
        await tx.application.update({
          where: { id: applicationId },
          data: { status: "ACCEPTED" },
        });

        // Decline all other applications
        await tx.application.updateMany({
          where: {
            projectId: application.projectId,
            id: { not: applicationId },
            status: { in: ["PENDING", "VIEWED", "SHORTLISTED"] },
          },
          data: { status: "DECLINED" },
        });

        // Update project status
        await tx.project.update({
          where: { id: application.projectId },
          data: { status: "ASSIGNED" },
        });

        // Create work order
        const workOrder = await tx.workOrder.create({
          data: {
            projectId: application.projectId,
            clientId: application.project.clientId,
            creativeId: application.creativeId,
            agreedRate,
            agreedBudgetType: application.project.budgetType,
            deadline: application.project.deadline,
          },
        });

        // Create escrow
        const totalAmount = application.project.budgetMax || application.project.budgetMin || agreedRate;
        await tx.escrow.create({
          data: {
            workOrderId: workOrder.id,
            totalAmount,
          },
        });

        return workOrder;
      });

      // Notify the creative
      createNotification({
        type: "WORK_ORDER_UPDATE",
        userId: application.creativeId,
        actorId: ctx.user.id,
        entityId: result.id,
        entityType: "workorder",
      });

      return result;
    }),

  decline: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: applicationId }) => {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { project: true },
      });

      if (!application) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }
      if (application.project.clientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your project" });
      }

      return prisma.application.update({
        where: { id: applicationId },
        data: { status: "DECLINED" },
      });
    }),
});
