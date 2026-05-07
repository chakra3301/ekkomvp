import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, pregatedProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { prisma, ConnectTier, InviteStatus } from "@ekko/database";

// 32-char alphabet without 0/O/1/I/L to avoid OCR/typo confusion.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// Accept the human-readable form (with hyphens, lowercase) and normalize
// to the canonical storage form: uppercase, no separators.
function normalizeCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

export const inviteRouter = router({
  // ─── Pre-gate: the user has just signed in via Apple/Google but
  //   doesn't yet have accessGranted=true.

  validate: pregatedProcedure
    .input(z.object({ code: z.string().min(4).max(32) }))
    .query(async ({ input }) => {
      const code = normalizeCode(input.code);
      const invite = await prisma.invite.findUnique({ where: { code } });
      if (!invite) return { valid: false as const, reason: "not_found" as const };
      if (invite.status !== InviteStatus.ACTIVE) {
        return { valid: false as const, reason: "already_used" as const };
      }
      if (invite.expiresAt < new Date()) {
        return { valid: false as const, reason: "expired" as const };
      }
      return { valid: true as const, isFounder: invite.isFounder, cohort: invite.cohort };
    }),

  // Atomically: lock the invite to this user, flip accessGranted, write
  // referral graph, grant founder tier if applicable.
  redeem: pregatedProcedure
    .input(z.object({ code: z.string().min(4).max(32) }))
    .mutation(async ({ ctx, input }) => {
      const code = normalizeCode(input.code);
      const userId = ctx.user.id;

      // Already gated? No-op success so iOS can call this idempotently
      // after a flaky network without bricking the user.
      if (ctx.user.accessGranted) {
        return { ok: true as const, alreadyGated: true as const };
      }

      return await prisma.$transaction(async (tx) => {
        const invite = await tx.invite.findUnique({ where: { code } });
        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invite code not found." });
        }
        if (invite.status !== InviteStatus.ACTIVE) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This invite has already been used.",
          });
        }
        if (invite.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has expired." });
        }

        // Lock the invite to this user.
        await tx.invite.update({
          where: { code },
          data: {
            redeemedByUserId: userId,
            redeemedAt: new Date(),
            status: InviteStatus.REDEEMED,
          },
        });

        // Mark the user as gated, set founder bits, link inviter.
        await tx.user.update({
          where: { id: userId },
          data: {
            accessGranted: true,
            isFounder: invite.isFounder,
            cohort: invite.cohort,
            invitedByUserId: invite.issuedByUserId ?? undefined,
          },
        });

        // Founder invites grant INFINITE tier on the connect profile if
        // one exists. If the profile doesn't exist yet (early in
        // onboarding), `connectProfile.create` will pick this up via
        // the user's isFounder flag — see the create path.
        if (invite.isFounder) {
          await tx.connectProfile.updateMany({
            where: { userId },
            data: { connectTier: ConnectTier.INFINITE },
          });
        }

        // Referral graph entry (only when there's a real inviter — admin
        // codes like the App Review code have a null issuer).
        if (invite.issuedByUserId) {
          await tx.memberReferral.upsert({
            where: { inviteeUserId: userId },
            create: {
              inviterUserId: invite.issuedByUserId,
              inviteeUserId: userId,
            },
            update: {},
          });

          // Decrement the inviter's available balance if they had one.
          await tx.memberInvite.updateMany({
            where: { userId: invite.issuedByUserId, availableCount: { gt: 0 } },
            data: { availableCount: { decrement: 1 } },
          });
        }

        return { ok: true as const, alreadyGated: false as const, isFounder: invite.isFounder };
      });
    }),

  // ─── Gated: member-facing invite economy.

  // The signed-in member's invite balance + history.
  myBalance: protectedProcedure.query(async ({ ctx }) => {
    const balance = await prisma.memberInvite.findUnique({
      where: { userId: ctx.user.id },
    });
    const issued = await prisma.invite.count({
      where: { issuedByUserId: ctx.user.id },
    });
    const redeemed = await prisma.invite.count({
      where: { issuedByUserId: ctx.user.id, status: InviteStatus.REDEEMED },
    });
    return {
      availableCount: balance?.availableCount ?? 0,
      totalIssued: issued,
      totalRedeemed: redeemed,
      lastRefreshAt: balance?.lastRefreshAt ?? null,
      nextRefreshAt: balance?.nextRefreshAt ?? null,
    };
  }),

  // List the invites I've issued, newest first.
  listMine: protectedProcedure.query(async ({ ctx }) => {
    return prisma.invite.findMany({
      where: { issuedByUserId: ctx.user.id },
      orderBy: { issuedAt: "desc" },
      take: 50,
      include: {
        redeemedBy: {
          select: { id: true, profile: { select: { displayName: true, username: true, avatarUrl: true } } },
        },
      },
    });
  }),

  // Member generates a fresh code (decrements balance).
  generate: protectedProcedure.mutation(async ({ ctx }) => {
    return prisma.$transaction(async (tx) => {
      const balance = await tx.memberInvite.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!balance || balance.availableCount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't have any invites available right now.",
        });
      }

      // Retry a few times on rare collision (8 chars * 31 alphabet = ~10^12 keyspace).
      let code = generateCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await tx.invite.findUnique({ where: { code } });
        if (!exists) break;
        code = generateCode();
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const invite = await tx.invite.create({
        data: {
          code,
          issuedByUserId: ctx.user.id,
          expiresAt,
          status: InviteStatus.ACTIVE,
        },
      });
      await tx.memberInvite.update({
        where: { userId: ctx.user.id },
        data: {
          availableCount: { decrement: 1 },
          totalIssued: { increment: 1 },
        },
      });

      return invite;
    });
  }),

  // Member can cancel an invite they issued IF it hasn't been redeemed yet.
  revoke: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const code = normalizeCode(input.code);
      const invite = await prisma.invite.findUnique({ where: { code } });
      if (!invite || invite.issuedByUserId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found." });
      }
      if (invite.status !== InviteStatus.ACTIVE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite is no longer active.",
        });
      }
      const updated = await prisma.invite.update({
        where: { code },
        data: { status: InviteStatus.REVOKED },
      });
      // Refund the slot.
      await prisma.memberInvite.updateMany({
        where: { userId: ctx.user.id },
        data: { availableCount: { increment: 1 } },
      });
      return updated;
    }),

  // ─── Admin: mint codes outside the member economy (founders, App
  //   Review, partnerships). Founders' codes carry isFounder=true.

  adminMint: adminProcedure
    .input(
      z.object({
        count: z.number().int().min(1).max(200).default(1),
        cohort: z.string().max(50).optional(),
        isFounder: z.boolean().default(false),
        label: z.string().max(80).optional(),
        // Days from now until expiry. Default 90 days for admin-minted
        // codes since founder seeding has slower turnaround.
        ttlDays: z.number().int().min(1).max(365).default(90),
      })
    )
    .mutation(async ({ input }) => {
      const expiresAt = new Date(Date.now() + input.ttlDays * 24 * 60 * 60 * 1000);
      const codes: string[] = [];
      for (let i = 0; i < input.count; i++) {
        let code = generateCode();
        for (let attempt = 0; attempt < 5; attempt++) {
          const exists = await prisma.invite.findUnique({ where: { code } });
          if (!exists) break;
          code = generateCode();
        }
        await prisma.invite.create({
          data: {
            code,
            expiresAt,
            cohort: input.cohort,
            isFounder: input.isFounder,
            label: input.label,
          },
        });
        codes.push(code);
      }
      return { codes };
    }),

  adminList: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(InviteStatus).optional(),
        isFounder: z.boolean().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
    )
    .query(async ({ input }) => {
      return prisma.invite.findMany({
        where: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.isFounder !== undefined ? { isFounder: input.isFounder } : {}),
        },
        orderBy: { issuedAt: "desc" },
        take: input.limit,
        include: {
          issuedBy: {
            select: {
              id: true,
              profile: { select: { username: true, displayName: true, avatarUrl: true } },
            },
          },
          redeemedBy: {
            select: {
              id: true,
              profile: { select: { username: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      });
    }),
});
