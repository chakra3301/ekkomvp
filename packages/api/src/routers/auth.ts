import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { prisma, UserRole } from "@ekko/database";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  completeUserInfo: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(100),
        phone: z.string().max(20).optional(),
        dateOfBirth: z.string().optional(),
        role: z.enum(["CREATIVE", "CLIENT"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {
        phone: input.phone || null,
        dateOfBirth: input.dateOfBirth
          ? new Date(input.dateOfBirth)
          : null,
      };

      if (input.role) {
        data.role = input.role as UserRole;
      }

      const updated = await prisma.user.update({
        where: { id: ctx.user.id },
        data,
      });

      return updated;
    }),
});
