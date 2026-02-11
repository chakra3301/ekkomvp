import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@ekko/database";
import { LIMITS } from "@ekko/config";

import { router, protectedProcedure } from "../trpc";
import { createNotification } from "../lib/notifications";

export const workorderRouter = router({
  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: id }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          project: {
            select: { id: true, title: true, description: true, budgetType: true, budgetMin: true, budgetMax: true },
          },
          client: {
            select: {
              id: true,
              profile: {
                select: { displayName: true, avatarUrl: true, username: true },
              },
            },
          },
          creative: {
            select: {
              id: true,
              profile: {
                select: { displayName: true, avatarUrl: true, username: true },
              },
            },
          },
          milestones: { orderBy: { order: "asc" } },
          deliveries: {
            orderBy: { createdAt: "desc" },
            include: {
              milestone: { select: { id: true, title: true } },
            },
          },
          escrow: true,
        },
      });

      if (!workOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }

      if (workOrder.clientId !== ctx.user.id && workOrder.creativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not a participant" });
      }

      return workOrder;
    }),

  getMyWorkOrders: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(LIMITS.WORK_ORDERS_PAGE_SIZE),
        status: z.enum(["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "IN_REVISION", "COMPLETED", "CANCELLED", "DISPUTED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, status } = input;

      const where: Record<string, unknown> = {
        OR: [{ clientId: ctx.user.id }, { creativeId: ctx.user.id }],
      };
      if (status) where.status = status;

      const workOrders = await prisma.workOrder.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { updatedAt: "desc" },
        include: {
          project: { select: { id: true, title: true } },
          client: {
            select: {
              id: true,
              profile: {
                select: { displayName: true, avatarUrl: true, username: true },
              },
            },
          },
          creative: {
            select: {
              id: true,
              profile: {
                select: { displayName: true, avatarUrl: true, username: true },
              },
            },
          },
          escrow: { select: { status: true, totalAmount: true } },
          _count: { select: { milestones: true, deliveries: true } },
        },
      });

      let nextCursor: string | undefined;
      if (workOrders.length > limit) {
        const nextItem = workOrders.pop();
        nextCursor = nextItem!.id;
      }

      return { workOrders, nextCursor };
    }),

  acceptDirectRequest: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: projectId }) => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (!project.isDirect || project.targetCreativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This is not a direct request for you" });
      }
      if (project.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This request is no longer open" });
      }

      const agreedRate = project.budgetMin || project.budgetMax || 0;
      const totalAmount = project.budgetMax || project.budgetMin || 0;

      const result = await prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id: projectId },
          data: { status: "ASSIGNED" },
        });

        const workOrder = await tx.workOrder.create({
          data: {
            projectId,
            clientId: project.clientId,
            creativeId: ctx.user.id,
            agreedRate,
            agreedBudgetType: project.budgetType,
            deadline: project.deadline,
          },
        });

        await tx.escrow.create({
          data: {
            workOrderId: workOrder.id,
            totalAmount,
          },
        });

        return workOrder;
      });

      createNotification({
        type: "WORK_ORDER_UPDATE",
        userId: project.clientId,
        actorId: ctx.user.id,
        entityId: result.id,
        entityType: "workorder",
      });

      return result;
    }),

  declineDirectRequest: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: projectId }) => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (!project.isDirect || project.targetCreativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This is not a direct request for you" });
      }

      return prisma.project.update({
        where: { id: projectId },
        data: { status: "CANCELLED" },
      });
    }),

  fundEscrow: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: workOrderId }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: { escrow: true },
      });

      if (!workOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }
      if (workOrder.clientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the client can fund escrow" });
      }
      if (!workOrder.escrow) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No escrow found" });
      }
      if (workOrder.escrow.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Escrow already funded" });
      }

      const escrow = await prisma.escrow.update({
        where: { id: workOrder.escrow.id },
        data: {
          status: "FUNDED",
          fundedAmount: workOrder.escrow.totalAmount,
        },
      });

      createNotification({
        type: "ESCROW_UPDATE",
        userId: workOrder.creativeId,
        actorId: ctx.user.id,
        entityId: workOrderId,
        entityType: "workorder",
      });

      return escrow;
    }),

  start: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: workOrderId }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: { escrow: true },
      });

      if (!workOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }
      if (workOrder.creativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creative can start work" });
      }
      if (!workOrder.escrow || workOrder.escrow.status !== "FUNDED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Escrow must be funded before starting work" });
      }

      const updated = await prisma.workOrder.update({
        where: { id: workOrderId },
        data: { status: "IN_PROGRESS", startDate: new Date() },
      });

      createNotification({
        type: "WORK_ORDER_UPDATE",
        userId: workOrder.clientId,
        actorId: ctx.user.id,
        entityId: workOrderId,
        entityType: "workorder",
      });

      return updated;
    }),

  addMilestone: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string().uuid(),
        title: z.string().min(1).max(LIMITS.MILESTONE_TITLE_MAX),
        description: z.string().max(LIMITS.MILESTONE_DESCRIPTION_MAX).optional().nullable(),
        amount: z.number().min(0),
        dueDate: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: input.workOrderId },
        include: { _count: { select: { milestones: true } } },
      });

      if (!workOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }
      if (workOrder.clientId !== ctx.user.id && workOrder.creativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const milestone = await prisma.milestone.create({
        data: {
          workOrderId: input.workOrderId,
          title: input.title,
          description: input.description,
          amount: input.amount,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          order: workOrder._count.milestones,
        },
      });

      // Notify other party
      const otherUserId = workOrder.clientId === ctx.user.id ? workOrder.creativeId : workOrder.clientId;
      createNotification({
        type: "MILESTONE_UPDATE",
        userId: otherUserId,
        actorId: ctx.user.id,
        entityId: workOrder.id,
        entityType: "workorder",
      });

      return milestone;
    }),

  updateMilestone: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(LIMITS.MILESTONE_TITLE_MAX).optional(),
        description: z.string().max(LIMITS.MILESTONE_DESCRIPTION_MAX).optional().nullable(),
        amount: z.number().min(0).optional(),
        dueDate: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const milestone = await prisma.milestone.findUnique({
        where: { id: input.id },
        include: { workOrder: true },
      });

      if (!milestone) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Milestone not found" });
      }
      if (milestone.workOrder.clientId !== ctx.user.id && milestone.workOrder.creativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const { id, ...data } = input;
      return prisma.milestone.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        },
      });
    }),

  reorderMilestones: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string().uuid(),
        milestoneIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: input.workOrderId },
      });

      if (!workOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }
      if (workOrder.clientId !== ctx.user.id && workOrder.creativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      await prisma.$transaction(
        input.milestoneIds.map((id, index) =>
          prisma.milestone.update({
            where: { id },
            data: { order: index },
          })
        )
      );

      return { success: true };
    }),

  submitDelivery: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string().uuid(),
        milestoneId: z.string().uuid().optional().nullable(),
        message: z.string().min(1).max(LIMITS.DELIVERY_MESSAGE_MAX),
        attachments: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: input.workOrderId },
      });

      if (!workOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }
      if (workOrder.creativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creative can submit deliveries" });
      }

      const delivery = await prisma.$transaction(async (tx) => {
        const d = await tx.delivery.create({
          data: {
            workOrderId: input.workOrderId,
            milestoneId: input.milestoneId,
            message: input.message,
            attachments: input.attachments,
          },
        });

        // Update work order status
        await tx.workOrder.update({
          where: { id: input.workOrderId },
          data: { status: "DELIVERED" },
        });

        // Update milestone status if applicable
        if (input.milestoneId) {
          await tx.milestone.update({
            where: { id: input.milestoneId },
            data: { status: "DELIVERED" },
          });
        }

        return d;
      });

      createNotification({
        type: "DELIVERY",
        userId: workOrder.clientId,
        actorId: ctx.user.id,
        entityId: workOrder.id,
        entityType: "workorder",
      });

      return delivery;
    }),

  approveDelivery: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: deliveryId }) => {
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          workOrder: {
            include: {
              milestones: true,
              escrow: true,
            },
          },
        },
      });

      if (!delivery) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
      }
      if (delivery.workOrder.clientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the client can approve deliveries" });
      }
      if (delivery.status !== "PENDING_REVIEW") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery already processed" });
      }

      await prisma.$transaction(async (tx) => {
        // Approve delivery
        await tx.delivery.update({
          where: { id: deliveryId },
          data: { status: "APPROVED" },
        });

        // Approve milestone if applicable
        if (delivery.milestoneId) {
          await tx.milestone.update({
            where: { id: delivery.milestoneId },
            data: { status: "APPROVED" },
          });
        }

        // Check if all milestones are approved (or no milestones = fixed price)
        const milestones = delivery.workOrder.milestones;
        const allApproved = milestones.length === 0 || milestones.every(
          (m) => m.id === delivery.milestoneId ? true : m.status === "APPROVED"
        );

        if (allApproved) {
          // Complete work order
          await tx.workOrder.update({
            where: { id: delivery.workOrderId },
            data: { status: "COMPLETED", completedAt: new Date() },
          });

          // Release escrow
          if (delivery.workOrder.escrow) {
            await tx.escrow.update({
              where: { id: delivery.workOrder.escrow.id },
              data: {
                status: "RELEASED",
                releasedAmount: delivery.workOrder.escrow.totalAmount,
              },
            });
          }
        } else {
          // Back to in progress for next milestone
          await tx.workOrder.update({
            where: { id: delivery.workOrderId },
            data: { status: "IN_PROGRESS" },
          });
        }
      });

      createNotification({
        type: "WORK_ORDER_UPDATE",
        userId: delivery.workOrder.creativeId,
        actorId: ctx.user.id,
        entityId: delivery.workOrderId,
        entityType: "workorder",
      });

      return { success: true };
    }),

  requestRevision: protectedProcedure
    .input(
      z.object({
        deliveryId: z.string().uuid(),
        revisionNote: z.string().min(1).max(LIMITS.DELIVERY_MESSAGE_MAX),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const delivery = await prisma.delivery.findUnique({
        where: { id: input.deliveryId },
        include: { workOrder: true },
      });

      if (!delivery) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
      }
      if (delivery.workOrder.clientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the client can request revisions" });
      }
      if (delivery.status !== "PENDING_REVIEW") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery already processed" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: input.deliveryId },
          data: { status: "REVISION_REQUESTED", revisionNote: input.revisionNote },
        });

        await tx.workOrder.update({
          where: { id: delivery.workOrderId },
          data: { status: "IN_REVISION" },
        });

        if (delivery.milestoneId) {
          await tx.milestone.update({
            where: { id: delivery.milestoneId },
            data: { status: "IN_REVISION" },
          });
        }
      });

      createNotification({
        type: "WORK_ORDER_UPDATE",
        userId: delivery.workOrder.creativeId,
        actorId: ctx.user.id,
        entityId: delivery.workOrderId,
        entityType: "workorder",
      });

      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: workOrderId }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: workOrderId },
        include: { escrow: true },
      });

      if (!workOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }
      if (workOrder.clientId !== ctx.user.id && workOrder.creativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }
      if (workOrder.status === "COMPLETED" || workOrder.status === "CANCELLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Work order already finalized" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.workOrder.update({
          where: { id: workOrderId },
          data: { status: "CANCELLED" },
        });

        // Refund escrow if funded
        if (workOrder.escrow && (workOrder.escrow.status === "FUNDED" || workOrder.escrow.status === "PARTIALLY_RELEASED")) {
          await tx.escrow.update({
            where: { id: workOrder.escrow.id },
            data: { status: "REFUNDED" },
          });
        }
      });

      // Notify other party
      const otherUserId = workOrder.clientId === ctx.user.id ? workOrder.creativeId : workOrder.clientId;
      createNotification({
        type: "WORK_ORDER_UPDATE",
        userId: otherUserId,
        actorId: ctx.user.id,
        entityId: workOrderId,
        entityType: "workorder",
      });

      return { success: true };
    }),
});
