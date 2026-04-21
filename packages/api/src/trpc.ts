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
  if (ctx.user) {
    const userId = ctx.user.id;
    const now = Date.now();
    const last = lastActivityWrite.get(userId) ?? 0;
    if (now - last > ACTIVITY_THROTTLE_MS) {
      lastActivityWrite.set(userId, now);
      prisma.user
        .update({ where: { id: userId }, data: { lastActiveAt: new Date() } })
        .catch(() => {
          // best-effort — don't crash a request over a presence write
        });
    }
  }
  return next();
});

export const protectedProcedure = t.procedure.use(isAuthed).use(trackActivity);

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
