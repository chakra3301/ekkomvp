import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, pregatedProcedure, adminProcedure } from "../trpc";
import { prisma, SignupApplicationStatus } from "@ekko/database";
import {
  sendTransactionalEmail,
  applicationApprovedTemplate,
  applicationWaitlistedTemplate,
} from "../lib/email";

// Public sign-up application: someone without an invite can apply via
// the website. Distinct from the existing `Application` model used for
// work-order applications (see /routers/application.ts).
export const signupApplicationRouter = router({
  // ─── Public: anyone can submit. No auth required. Anti-spam is
  //   enforced at the edge (rate-limit + Captcha layer) — left to the
  //   web form, not the tRPC procedure itself.
  submit: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        portfolioUrl: z.string().url().optional().or(z.literal("")),
        disciplines: z.array(z.string().min(1).max(40)).min(1).max(8),
        city: z.string().max(80).optional(),
        statement: z.string().min(1).max(280),
        referralCode: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Resolve referrer from a referral code if one was provided.
      let referrerUserId: string | null = null;
      if (input.referralCode && input.referralCode.trim().length > 0) {
        const code = input.referralCode.replace(/[\s-]/g, "").toUpperCase();
        const invite = await prisma.invite.findUnique({ where: { code } });
        if (invite?.issuedByUserId) referrerUserId = invite.issuedByUserId;
      }

      // Soft de-dup: if the same email already has a PENDING or
      // WAITLISTED application, return that instead of creating a new
      // row. Avoids a flood of duplicates from impatient users.
      const existing = await prisma.signupApplication.findFirst({
        where: {
          email: input.email,
          status: { in: [SignupApplicationStatus.PENDING, SignupApplicationStatus.WAITLISTED] },
        },
        orderBy: { submittedAt: "desc" },
      });
      if (existing) {
        return { id: existing.id, status: existing.status, deduped: true as const };
      }

      const created = await prisma.signupApplication.create({
        data: {
          email: input.email,
          portfolioUrl: input.portfolioUrl || null,
          disciplines: input.disciplines,
          city: input.city || null,
          statement: input.statement,
          referrerUserId,
        },
      });
      return { id: created.id, status: created.status, deduped: false as const };
    }),

  // ─── Pre-gate: a signed-in user who applied (no invite) checks
  //   whether their application has been approved. If APPROVED and the
  //   email matches, this flips accessGranted=true. Idempotent.
  myStatus: pregatedProcedure.query(async ({ ctx }) => {
    if (ctx.user.accessGranted) {
      return { gated: true as const, source: "already_granted" as const };
    }
    const app = await prisma.signupApplication.findFirst({
      where: { email: ctx.user.email },
      orderBy: { submittedAt: "desc" },
    });
    if (!app) return { gated: false as const, status: null };

    if (app.status === SignupApplicationStatus.APPROVED) {
      // Flip the gate now that we've confirmed the email match.
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { accessGranted: true, cohort: app.cohort ?? undefined },
      });
      return { gated: true as const, source: "application_approved" as const };
    }
    return { gated: false as const, status: app.status };
  }),

  // ─── Admin: review queue.
  listAdmin: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(SignupApplicationStatus).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const items = await prisma.signupApplication.findMany({
        where: input.status ? { status: input.status } : {},
        orderBy: { submittedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop();
        nextCursor = next?.id;
      }
      return { items, nextCursor };
    }),

  review: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        decision: z.enum(["APPROVED", "WAITLISTED", "DECLINED"]),
        notes: z.string().max(1000).optional(),
        cohort: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const status =
        input.decision === "APPROVED"
          ? SignupApplicationStatus.APPROVED
          : input.decision === "WAITLISTED"
            ? SignupApplicationStatus.WAITLISTED
            : SignupApplicationStatus.DECLINED;

      // Load the existing row so we can tell whether this is the first
      // PENDING→terminal transition (which is the only time we send a
      // notification email — re-reviews stay silent).
      const existing = await prisma.signupApplication.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      }
      const isFirstReview = existing.status === SignupApplicationStatus.PENDING;

      const updated = await prisma.signupApplication.update({
        where: { id: input.id },
        data: {
          status,
          notes: input.notes ?? undefined,
          cohort: input.cohort ?? undefined,
          reviewerId: ctx.user.id,
          reviewedAt: new Date(),
        },
      });

      // Only APPROVED and WAITLISTED get an email; DECLINED is silent
      // (locked decision in CLAUDE.md). Send only on the first review
      // so toggling between states later doesn't double-mail.
      if (
        isFirstReview &&
        (status === SignupApplicationStatus.APPROVED ||
          status === SignupApplicationStatus.WAITLISTED)
      ) {
        const template =
          status === SignupApplicationStatus.APPROVED
            ? applicationApprovedTemplate()
            : applicationWaitlistedTemplate();
        const result = await sendTransactionalEmail({
          to: existing.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
        if (result.ok) {
          return prisma.signupApplication.update({
            where: { id: input.id },
            data: { notifiedAt: new Date() },
          });
        } else {
          console.warn(
            `[signupApplication.review] email send failed for ${existing.email}: ${result.error}`
          );
        }
      }

      return updated;
    }),

  // Stats for the admin dashboard sidebar.
  adminStats: adminProcedure.query(async () => {
    const [pending, approved, waitlisted, declined] = await Promise.all([
      prisma.signupApplication.count({ where: { status: SignupApplicationStatus.PENDING } }),
      prisma.signupApplication.count({ where: { status: SignupApplicationStatus.APPROVED } }),
      prisma.signupApplication.count({ where: { status: SignupApplicationStatus.WAITLISTED } }),
      prisma.signupApplication.count({ where: { status: SignupApplicationStatus.DECLINED } }),
    ]);
    return { pending, approved, waitlisted, declined };
  }),
});
