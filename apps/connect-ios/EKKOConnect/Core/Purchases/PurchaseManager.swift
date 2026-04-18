import SwiftUI
import RevenueCat

/// Manages in-app purchases via RevenueCat for the INFINITE tier upgrade.
@Observable
final class PurchaseManager {
    var currentTier: ConnectTier = .FREE
    var offerings: Offerings?
    var isPurchasing = false
    var errorMessage: String?

    private var trpc: TRPCClient?
    private weak var appState: AppState?

    // MARK: - Setup

    func configure(apiKey: String, userId: String?) {
        Purchases.logLevel = .warn
        if let userId {
            Purchases.configure(withAPIKey: apiKey, appUserID: userId)
        } else {
            Purchases.configure(withAPIKey: apiKey)
        }
    }

    func setup(trpc: TRPCClient, appState: AppState? = nil) {
        self.trpc = trpc
        self.appState = appState
    }

    // MARK: - Load Offerings

    func loadOfferings() async {
        do {
            let fetched = try await Purchases.shared.offerings()
            offerings = fetched
            #if DEBUG
            let current = fetched.current
            print("[IAP] Current offering: \(current?.identifier ?? "nil")")
            print("[IAP] Packages: \(current?.availablePackages.map { $0.identifier } ?? [])")
            print("[IAP] Products: \(current?.availablePackages.map { $0.storeProduct.productIdentifier } ?? [])")
            if let first = current?.availablePackages.first {
                print("[IAP] First product price: \(first.storeProduct.localizedPriceString)")
            }
            #endif
        } catch {
            #if DEBUG
            print("[IAP] Failed to load offerings: \(error)")
            #endif
        }
    }

    // MARK: - Check Entitlements

    func checkEntitlements() async {
        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            let entitlement = customerInfo.entitlements["infinite"]
            let hasInfinite = entitlement?.isActive == true
            currentTier = hasInfinite ? .INFINITE : .FREE

            // Reconcile with the backend. RevenueCat restores entitlements on
            // every launch (not just on fresh purchase), and the DB can drift
            // from StoreKit on expiration, cancellation, refund, or a previous
            // sync that failed. If they disagree, push the truth to the server
            // so every tier-gated feature unlocks (or re-locks) immediately.
            let serverTier = appState?.currentConnectProfile?.connectTier ?? .FREE
            if (hasInfinite && serverTier != .INFINITE) || (!hasInfinite && serverTier == .INFINITE) {
                await syncTierWithBackend(hasInfinite ? .INFINITE : .FREE)
            }
        } catch {
            #if DEBUG
            print("[IAP] Failed to check entitlements: \(error)")
            #endif
        }
    }

    // MARK: - Purchase

    func purchaseInfinite() async -> Bool {
        guard let package = offerings?.current?.availablePackages.first else {
            errorMessage = "No packages available"
            return false
        }

        isPurchasing = true
        errorMessage = nil

        do {
            let result = try await Purchases.shared.purchase(package: package)

            if result.customerInfo.entitlements["infinite"]?.isActive == true {
                currentTier = .INFINITE
                // Sync with backend
                await syncTierWithBackend(.INFINITE)
                isPurchasing = false
                return true
            }
        } catch {
            if let rcError = error as? RevenueCat.ErrorCode, rcError == .purchaseCancelledError {
                // User cancelled — not an error
            } else {
                errorMessage = error.localizedDescription
            }
        }

        isPurchasing = false
        return false
    }

    // MARK: - Restore

    func restorePurchases() async {
        isPurchasing = true
        do {
            let customerInfo = try await Purchases.shared.restorePurchases()
            if customerInfo.entitlements["infinite"]?.isActive == true {
                currentTier = .INFINITE
                await syncTierWithBackend(.INFINITE)
            } else {
                currentTier = .FREE
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isPurchasing = false
    }

    // MARK: - Backend Sync

    private func syncTierWithBackend(_ tier: ConnectTier) async {
        guard let trpc else { return }
        do {
            // Server expects a bare enum string ("FREE" | "INFINITE"), not an object.
            let _: TierResponse = try await trpc.mutate(
                "connectProfile.upgradeTier",
                input: tier.rawValue
            )
            // Refresh the locally cached connect profile so every badge /
            // gate that reads `appState.currentConnectProfile?.connectTier`
            // flips to the new tier without requiring a relaunch.
            if let refreshed: ConnectProfile = try? await trpc.query("connectProfile.getCurrent") {
                await MainActor.run {
                    appState?.currentConnectProfile = refreshed
                }
            }
        } catch {
            #if DEBUG
            print("[IAP] Backend tier sync failed: \(error)")
            #endif
        }
    }
}

private struct TierResponse: Codable {
    let connectTier: String
}
