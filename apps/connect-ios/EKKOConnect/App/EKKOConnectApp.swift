import SwiftUI

@main
struct EKKOConnectApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appState = AppState()
    @State private var pushManager = PushManager()
    @State private var purchaseManager = PurchaseManager()

    init() {
        // Arches is used only for profile names (and specific accents);
        // keep SF Pro elsewhere for legibility.
        let loaded = UIFont.fontNames(forFamilyName: "ARCHES")
        if loaded.isEmpty {
            print("[Font] ⚠️ Arches font NOT loaded.")
        }
    }

    var body: some Scene {
        WindowGroup {
            AppRouter()
                .environment(appState)
                .environment(pushManager)
                .environment(purchaseManager)
                .preferredColorScheme(appState.colorSchemeOverride)
                // Reads @AppStorage("connectAccentHex") and applies .tint
                // app-wide so every Color.accentColor downstream picks up
                // the user's chosen accent.
                .ekkoAccentTint()
                .onAppear {
                    // Wire managers
                    AppDelegate.pushManager = pushManager
                    pushManager.setup(trpc: appState.trpc)
                    purchaseManager.setup(trpc: appState.trpc, appState: appState)

                    // Bridge foreground pushes → in-app banner. Skip when the
                    // user is already looking at the thread the push references
                    // (no point banner-spamming what they're reading).
                    pushManager.onForegroundPush = { [appState] info in
                        if let route = info.route,
                           route.hasPrefix("/matches/"),
                           let active = appState.activeChatMatchId,
                           route == "/matches/\(active)" {
                            return false  // let it fall through to the system; it'll also get suppressed by iOS since they're in-app
                        }
                        let initials = Self.deriveInitials(info.title)
                        appState.showMessageBanner(.init(
                            title: info.title.isEmpty ? "EKKO" : info.title,
                            preview: info.body,
                            route: info.route,
                            initials: initials
                        ))
                        return true
                    }

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
                .onChange(of: pushManager.pendingNotificationRoute) { _, route in
                    // Push notification tap: forward its route through the same pipeline
                    if let route, !route.isEmpty {
                        handleDeepLink(route)
                        _ = pushManager.consumePendingRoute()
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

    /// Grab up to two initials from a name — "Mika Ito" → "MI". Falls back to
    /// a generic glyph when the push title is something like "New message".
    private static func deriveInitials(_ name: String) -> String {
        let words = name
            .split(whereSeparator: { $0.isWhitespace || $0.isPunctuation })
            .prefix(2)
        let letters = words.compactMap { $0.first.map(String.init) }.joined()
        return letters.isEmpty ? "✦" : letters.uppercased()
    }

    private func handleDeepLink(_ route: String) {
        print("[DeepLink] Route: \(route)")

        // Strip query params for simple path matching
        let path = route.components(separatedBy: "?").first ?? route

        if path.hasPrefix("/matches/") {
            let matchId = String(path.dropFirst("/matches/".count))
            appState.selectedTab = 2
            appState.pendingChatMatchId = matchId
        } else if path == "/matches" {
            appState.selectedTab = 2
        } else if path == "/likes" {
            appState.selectedTab = 1
        } else if path.hasPrefix("/discover") {
            appState.selectedTab = 0
        } else if path == "/profile" {
            appState.selectedTab = 3
        }
        // /auth-callback?... is handled by Supabase Swift's session restore
    }
}
