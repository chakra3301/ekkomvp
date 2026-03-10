import { NextResponse } from "next/server";
import { prisma } from "@ekko/database";

// RevenueCat webhook — updates ConnectProfile.connectTier when subscription
// status changes. Configure this URL in RevenueCat dashboard:
// https://ekkoconnect.app/api/webhooks/revenuecat
//
// Set REVENUECAT_WEBHOOK_SECRET in your env vars and add it as the
// Authorization header in RevenueCat's webhook settings.

export async function POST(req: Request) {
  // Verify webhook auth
  const authHeader = req.headers.get("authorization");
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const event = body.event;

    if (!event) {
      return NextResponse.json({ error: "No event" }, { status: 400 });
    }

    // RevenueCat sends app_user_id which we set to the Supabase user ID
    const userId = event.app_user_id;
    if (!userId || userId.startsWith("$RCAnonymous")) {
      return NextResponse.json({ ok: true }); // skip anonymous users
    }

    const eventType: string = event.type;
    const entitlementIds: string[] =
      event.entitlement_ids || event.entitlement_id
        ? [event.entitlement_id]
        : [];

    const hasInfinite = entitlementIds.includes("infinite");

    // Events that grant access
    const grantEvents = [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "PRODUCT_CHANGE",
      "UNCANCELLATION",
    ];

    // Events that revoke access
    const revokeEvents = [
      "EXPIRATION",
      "BILLING_ISSUE",
      "SUBSCRIPTION_PAUSED",
    ];

    if (grantEvents.includes(eventType) && hasInfinite) {
      await prisma.connectProfile.updateMany({
        where: { userId },
        data: { connectTier: "INFINITE" },
      });
    } else if (revokeEvents.includes(eventType)) {
      await prisma.connectProfile.updateMany({
        where: { userId },
        data: { connectTier: "FREE" },
      });
    } else if (eventType === "CANCELLATION") {
      // User cancelled but still has access until end of period.
      // Don't downgrade yet — EXPIRATION will handle it.
      console.log(`[RevenueCat] User ${userId} cancelled, access continues until expiry`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RevenueCat webhook error]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
