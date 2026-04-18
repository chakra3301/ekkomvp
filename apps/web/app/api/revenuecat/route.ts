import { NextRequest, NextResponse } from "next/server";
import { prisma, ConnectTier } from "@ekko/database";

/**
 * RevenueCat → EKKO webhook.
 *
 * Fires on every subscription lifecycle event (purchase, renewal, cancel,
 * expiration, refund, billing issue, etc.) and reconciles the user's
 * `connectTier` so access is granted / revoked within seconds instead of
 * waiting for the user's next app launch.
 *
 * Auth: shared bearer token via Authorization header, configured in
 * RevenueCat's webhook settings and `REVENUECAT_WEBHOOK_SECRET` env var.
 *
 * Docs: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  /** Entitlements currently active for the user after this event. */
  entitlement_ids?: string[] | null;
  /** Older name for the same field — handle both for safety. */
  entitlement_id?: string | null;
  event_timestamp_ms?: number;
  id: string;
}

interface RevenueCatPayload {
  event: RevenueCatEvent;
  api_version?: string;
}

export async function POST(req: NextRequest) {
  // 1. Verify the shared secret.
  const auth = req.headers.get("authorization");
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expected) {
    console.error("[RC Webhook] REVENUECAT_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate the payload shape.
  let payload: RevenueCatPayload;
  try {
    payload = (await req.json()) as RevenueCatPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const event = payload.event;
  if (!event?.app_user_id || !event.type) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  // RevenueCat sends test events before enabling the webhook — accept them
  // so their UI shows a green check, but don't touch the DB.
  if (event.type === "TEST") {
    console.log("[RC Webhook] Test event received");
    return NextResponse.json({ ok: true });
  }

  // 3. Derive the tier from the active entitlements rather than event type.
  //    This handles every lifecycle uniformly:
  //    - INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / PRODUCT_CHANGE → "infinite" present → INFINITE
  //    - EXPIRATION / REFUND / SUBSCRIPTION_PAUSED → "infinite" absent → FREE
  //    - CANCELLATION → user cancelled but still within paid period → "infinite" still present → INFINITE
  //      (will downgrade on the subsequent EXPIRATION event when the period ends)
  const activeEntitlements = new Set(
    event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : [])
  );
  const targetTier: ConnectTier = activeEntitlements.has("infinite")
    ? ConnectTier.INFINITE
    : ConnectTier.FREE;

  // 4. Apply the tier. `updateMany` is used so unknown user IDs don't throw —
  //    RevenueCat occasionally replays events for users who've since been
  //    deleted, and we'd rather no-op than 500 on retry.
  try {
    const result = await prisma.connectProfile.updateMany({
      where: { userId: event.app_user_id },
      data: { connectTier: targetTier },
    });
    console.log(
      `[RC Webhook] ${event.type} → ${event.app_user_id} → ${targetTier} (rows: ${result.count})`
    );
  } catch (err) {
    console.error("[RC Webhook] DB update failed:", err);
    // Return 500 so RevenueCat retries — transient DB errors shouldn't drop events.
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
