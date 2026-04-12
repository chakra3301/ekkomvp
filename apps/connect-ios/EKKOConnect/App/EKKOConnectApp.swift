import SwiftUI

@main
struct EKKOConnectApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appState = AppState()
    @State private var pushManager = PushManager()
    @State private var purchaseManager = PurchaseManager()

    var body: some Scene {
        WindowGroup {
            AppRouter()
                .environment(appState)
                .environment(pushManager)
                .environment(purchaseManager)
                .preferredColorScheme(appState.colorSchemeOverride)
                .tint(EKKOTheme.primary)
                .onAppear {
                    // Wire managers
                    AppDelegate.pushManager = pushManager
                    pushManager.setup(trpc: appState.trpc)
                    purchaseManager.setup(trpc: appState.trpc)

                    // Configure RevenueCat (only if an API key is set)
                    if !Config.revenueCatAPIKey.isEmpty {
                        purchaseManager.configure(
                            apiKey: Config.revenueCatAPIKey,
                            userId: appState.session?.user.id.uuidString
                        )
                        Task {
                            await purchaseManager.loadOfferings()
                            await purchaseManager.checkEntitlements()
                        }
                    }
                }
                .task {
                    if appState.isAuthenticated {
                        await pushManager.requestPermissionAndRegister()
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: DeepLinkHandler.deepLinkNotification)) { notification in
                    if let route = notification.object as? String {
                        handleDeepLink(route)
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: .init("EKKOUserChanged"))) { note in
                    // Re-configure RevenueCat with the new user ID and refresh entitlements
                    guard !Config.revenueCatAPIKey.isEmpty else { return }
                    let userId = note.object as? String
                    purchaseManager.configure(apiKey: Config.revenueCatAPIKey, userId: userId)
                    Task {
                        await purchaseManager.loadOfferings()
                        await purchaseManager.checkEntitlements()
                    }
                }
        }
    }

    private func handleDeepLink(_ route: String) {
        // TODO: Navigate to the appropriate screen based on route
        // e.g. /matches/{matchId} → select matches tab + push to ChatView
        // e.g. /likes → select likes tab
        print("[DeepLink] Route: \(route)")
    }
}
