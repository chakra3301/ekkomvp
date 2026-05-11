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

  // Pre-auth existence check used by the splash to decide between the OTP
  // login path (existing users) and the signup path (new emails). Public
  // so the splash can call it before the user is signed in. Yes, this
  // technically lets someone probe whether an address is registered —
  // acceptable for an invite-only product, and no worse than what most
  // password-reset flows expose implicitly.
  checkEmailExists: publicProcedure
    .input(z.object({ email: z.string().email().max(254) }))
    .query(async ({ input }) => {
      const u = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
        select: { id: true },
      });
      return { exists: u !== null };
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
