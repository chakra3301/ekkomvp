import { z } from "zod";
import { prisma, ReportTargetType, ReportReason, ReportStatus } from "@ekko/database";

import { router, protectedProcedure, adminProcedure } from "../trpc";

export const reportRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        targetType: z.nativeEnum(ReportTargetType),
        targetId: z.string().uuid(),
        reason: z.nativeEnum(ReportReason),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await prisma.report.create({
        data: {
          reporterId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          description: input.description,
        },
      });
      return report;
    }),

  getAll: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(ReportStatus).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { status, cursor, limit } = input;

      const reports = await prisma.report.findMany({
        where: status ? { status } : undefined,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (reports.length > limit) {
        const nextItem = reports.pop();
        nextCursor = nextItem?.id;
      }

      // Fetch reporter profiles
      const reporterIds = [...new Set(reports.map((r) => r.reporterId))];
      const reporters = await prisma.profile.findMany({
        where: { userId: { in: reporterIds } },
        select: { userId: true, username: true, displayName: true, avatarUrl: true },
      });
      const reporterMap = new Map(reporters.map((r) => [r.userId, r]));

      const enrichedReports = reports.map((r) => ({
        ...r,
        reporter: reporterMap.get(r.reporterId) || null,
      }));

      return { reports: enrichedReports, nextCursor };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.nativeEnum(ReportStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await prisma.report.update({
        where: { id: input.id },
        data: {
          status: input.status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        },
      });
      return report;
    }),

  getStats: adminProcedure.query(async () => {
    const [pending, reviewed, resolved, dismissed] = await Promise.all([
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "REVIEWED" } }),
      prisma.report.count({ where: { status: "RESOLVED" } }),
      prisma.report.count({ where: { status: "DISMISSED" } }),
    ]);
    return { pending, reviewed, resolved, dismissed, total: pending + reviewed + resolved + dismissed };
  }),
});
