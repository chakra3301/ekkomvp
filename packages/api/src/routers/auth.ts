import { z } from "zod";
import { router, publicProcedure, pregatedProcedure } from "../trpc";
import { prisma, UserRole } from "@ekko/database";

// Auth router uses pregatedProcedure throughout so a freshly
// signed-in user (who has not yet redeemed an invite) can still call
// `me` and `completeUserInfo` to finish onboarding before the gate.
export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  me: pregatedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  completeUserInfo: pregatedProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(100).optional(),
        phone: z.string().max(20).optional(),
        dateOfBirth: z.string().optional(),
        role: z.enum(["CREATIVE", "CLIENT"]).optional(),
        pushToken: z.string().optional(),
        pushPlatform: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {};

      if (input.phone !== undefined) data.phone = input.phone || null;
      if (input.dateOfBirth !== undefined) {
        data.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
      }
      if (input.role) data.role = input.role as UserRole;
      if (input.pushToken !== undefined) data.pushToken = input.pushToken || null;
      if (input.pushPlatform !== undefined) data.pushPlatform = input.pushPlatform || null;

      const updated = await prisma.user.update({
        where: { id: ctx.user.id },
        data,
      });

      return updated;
    }),
});
