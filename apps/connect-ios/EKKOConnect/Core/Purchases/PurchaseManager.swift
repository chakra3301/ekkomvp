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

    // MARK: - Setup

    func configure(apiKey: String, userId: String?) {
        Purchases.logLevel = .warn
        if let userId {
            Purchases.configure(withAPIKey: apiKey, appUserID: userId)
        } else {
            Purchases.configure(withAPIKey: apiKey)
        }
    }

    func setup(trpc: TRPCClient) {
        self.trpc = trpc
    }

    // MARK: - Load Offerings

    func loadOfferings() async {
        do {
            offerings = try await Purchases.shared.offerings()
        } catch {
            print("[IAP] Failed to load offerings: \(error)")
        }
    }

    // MARK: - Check Entitlements

    func checkEntitlements() async {
        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            if customerInfo.entitlements["infinite"]?.isActive == true {
                currentTier = .INFINITE
            } else {
                currentTier = .FREE
            }
        } catch {
            print("[IAP] Failed to check entitlements: \(error)")
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
            struct TierInput: Codable { let tier: String }
            let _: ConnectProfile = try await trpc.mutate(
                "connectProfile.upgradeTier",
                input: TierInput(tier: tier.rawValue)
            )
        } catch {
            print("[IAP] Backend tier sync failed: \(error)")
        }
    }
}
