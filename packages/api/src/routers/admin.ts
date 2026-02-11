import { z } from "zod";
import { prisma } from "@ekko/database";

import { router, adminProcedure } from "../trpc";

export const adminRouter = router({
  getDashboardStats: adminProcedure.query(async () => {
    const [totalUsers, totalPosts, pendingReports, suspendedUsers] = await Promise.all([
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.post.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
    ]);
    return { totalUsers, totalPosts, pendingReports, suspendedUsers };
  }),

  getUsers: adminProcedure
    .input(
      z.object({
        query: z.string().optional(),
        role: z.enum(["CREATIVE", "CLIENT", "ADMIN"]).optional(),
        status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { query, role, status, cursor, limit } = input;

      const where: Record<string, unknown> = {};
      if (role) where.role = role;
      if (status) where.status = status;
      if (query) {
        where.OR = [
          { email: { contains: query, mode: "insensitive" } },
          { profile: { username: { contains: query, mode: "insensitive" } } },
          { profile: { displayName: { contains: query, mode: "insensitive" } } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return { users, nextCursor };
    }),

  suspendUser: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ input: userId }) => {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });
      return user;
    }),

  unsuspendUser: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ input: userId }) => {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });
      return user;
    }),

  deletePost: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ input: postId }) => {
      await prisma.post.delete({
        where: { id: postId },
      });
      return { deleted: true };
    }),
});
