import { NextResponse } from "next/server";
import { Prisma, prisma } from "@ekko/database";

// Monthly invite refresh — see CLAUDE.md "Active build: Invite-Only Access System".
//
// Trigger:    Vercel Cron, scheduled in /apps/connect/vercel.json
// Schedule:   "0 0 1 * *" — 00:00 UTC on the 1st of every month
// Auth:       Authorization: Bearer ${CRON_SECRET}
// Idempotent: GREATEST() in the SQL means re-running is a no-op for users
//             already at or above target balance.
//
// Logic:
//   For every user who is gated AND has been active in the last 30 days,
//   top up MemberInvite.availableCount to {founder: 5, regular: 3}.
//   Don't subtract — if a user has more codes outstanding than the target
//   (e.g. via admin grants), leave the higher balance alone.
//   Dormant users (no activity in 30d) are skipped entirely.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REGULAR_TARGET = 3;
const FOUNDER_TARGET = 5;
const ACTIVE_WINDOW_DAYS = 30;
const REFRESH_INTERVAL_DAYS = 30;

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically
  // when the env var is set. Without the secret, refuse to run — this
  // route otherwise hands out invite balance and shouldn't be public.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    // Use Prisma.raw for the INTERVAL literals — they're hardcoded
    // constants above, not user input, so injection isn't possible.
    // Integer values (5/3 targets) still go through parameterized binds.
    const refreshInterval = Prisma.raw(`INTERVAL '${REFRESH_INTERVAL_DAYS} days'`);
    const activeWindow = Prisma.raw(`INTERVAL '${ACTIVE_WINDOW_DAYS} days'`);

    const refreshed = await prisma.$executeRaw(Prisma.sql`
      INSERT INTO member_invites (user_id, available_count, last_refresh_at, next_refresh_at)
      SELECT
        u.id,
        CASE WHEN u.is_founder THEN ${FOUNDER_TARGET} ELSE ${REGULAR_TARGET} END,
        NOW(),
        NOW() + ${refreshInterval}
      FROM users u
      WHERE u.access_granted = TRUE
        AND u.last_active_at > NOW() - ${activeWindow}
      ON CONFLICT (user_id) DO UPDATE
      SET
        available_count = GREATEST(member_invites.available_count, EXCLUDED.available_count),
        last_refresh_at = EXCLUDED.last_refresh_at,
        next_refresh_at = EXCLUDED.next_refresh_at
    `);

    const durationMs = Date.now() - startedAt;
    console.log(
      `[cron/refresh-invites] refreshed=${refreshed} duration=${durationMs}ms`
    );
    return NextResponse.json({
      ok: true,
      refreshed,
      durationMs,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`[cron/refresh-invites] failed: ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
