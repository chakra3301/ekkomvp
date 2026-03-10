"use client";

import { Capacitor } from "@capacitor/core";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";

const RC_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_KEY || "";
const ENTITLEMENT_ID = "infinite";

/**
 * Initialize RevenueCat. Call once on app launch (native only).
 */
export async function initPurchases(userId?: string) {
  if (!Capacitor.isNativePlatform() || !RC_API_KEY) return;

  await Purchases.configure({
    apiKey: RC_API_KEY,
    appUserID: userId || undefined,
  });
}

/**
 * Identify the user after login so purchases are tied to their account.
 */
export async function identifyUser(userId: string) {
  if (!Capacitor.isNativePlatform()) return;
  await Purchases.logIn({ appUserID: userId });
}

/**
 * Check if the user currently has the "infinite" entitlement.
 */
export async function checkInfiniteEntitlement(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

/**
 * Get the monthly package for purchase.
 */
export async function getMonthlyPackage(): Promise<PurchasesPackage | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.monthly ?? null;
  } catch {
    return null;
  }
}

/**
 * Purchase the Infinite subscription. Returns true on success.
 */
export async function purchaseInfinite(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: "Purchases only available on iOS" };
  }

  try {
    const pkg = await getMonthlyPackage();
    if (!pkg) {
      return { success: false, error: "Subscription not available" };
    }

    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: pkg,
    });

    const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: isActive };
  } catch (e: any) {
    // User cancelled
    if (e?.code === "1" || e?.message?.includes("cancelled")) {
      return { success: false, error: "cancelled" };
    }
    return { success: false, error: e?.message || "Purchase failed" };
  }
}

/**
 * Restore previous purchases (e.g. after reinstall).
 */
export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
