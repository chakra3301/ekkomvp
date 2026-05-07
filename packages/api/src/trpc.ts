import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@ekko/database";

import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error
            ? error.cause.message
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/// Bumps `User.lastActiveAt` at most once per minute per user so the feed can
/// render "active now" signals without paying for a DB write on every request.
/// Fire-and-forget — a failed write shouldn't bubble up to the user.
const ACTIVITY_THROTTLE_MS = 60_000;
const lastActivityWrite = new Map<string, number>();

const trackActivity = middleware(async ({ ctx, next }) => {
  // Defensive try/catch in addition to the .catch — on serverless the
  // dangling promise from prisma.user.update can turn into a 500 when the
  // column is missing or the DB is otherwise unhappy. Presence is
  // strictly best-effort; never let it crash a real request.
  try {
    if (ctx.user) {
      const userId = ctx.user.id;
      const now = Date.now();
      const last = lastActivityWrite.get(userId) ?? 0;
      if (now - last > ACTIVITY_THROTTLE_MS) {
        lastActivityWrite.set(userId, now);
        void prisma.user
          .update({ where: { id: userId }, data: { lastActiveAt: new Date() } })
          .catch(() => {
            // best-effort — don't crash a request over a presence write
          });
      }
    }
  } catch {
    // swallow
  }
  return next();
});

// Most endpoints require the user to have passed the invite gate.
// Endpoints used to PASS the gate (auth.*, invite.redeem,
// signupApplication.myStatus) use `pregatedProcedure` so a fresh
// Supabase auth user can complete onboarding before being gated.
const requireAccess = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  if (!ctx.user.accessGranted) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "EKKO is invite-only. Redeem an invite code or wait for application approval.",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Authenticated but pre-gate. Use sparingly — only for endpoints that
// must work BEFORE invite redemption / application approval flips
// `accessGranted` true.
export const pregatedProcedure = t.procedure.use(isAuthed).use(trackActivity);

// Default for all gated functionality. Authenticated + activity-tracked
// + access-gated.
export const protectedProcedure = t.procedure
  .use(isAuthed)
  .use(trackActivity)
  .use(requireAccess);

const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have admin access",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);
