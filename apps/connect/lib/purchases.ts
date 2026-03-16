// IAP disabled — stub exports for future use

export async function initPurchases() {}
export async function identifyUser(_userId: string) {}
export async function checkInfiniteEntitlement() { return false; }
export async function getMonthlyPackage() { return null; }
export async function purchaseInfinite() { return { success: false, error: "IAP disabled" }; }
export async function restorePurchases() { return false; }
