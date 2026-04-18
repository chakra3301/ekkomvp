import SwiftUI
import Supabase

/// Global app state holding auth session, tRPC client, and Supabase client.
/// Injected into the SwiftUI environment via `.environment(appState)`.
@Observable
final class AppState {
    // MARK: - Supabase

    let supabase: SupabaseClient

    // MARK: - Networking

    let trpc: TRPCClient

    // MARK: - Auth State

    var session: Session?
    var currentUser: User?
    var currentProfile: Profile?
    var currentConnectProfile: ConnectProfile?
    var isLoading = true
    var isAuthenticated: Bool { session != nil }

    /// Admins ("GM"s) always have full platform access regardless of purchase state.
    var isAdmin: Bool { currentUser?.role == .ADMIN }

    /// True if the user has Infinite-tier access via purchase OR admin status.
    /// Use this for any feature gate (global search, see-who-likes-you, etc.).
    var hasInfiniteAccess: Bool {
        isAdmin || currentConnectProfile?.connectTier == .INFINITE
    }

    /// True once we've attempted to load the ConnectProfile at least once.
    /// Used to avoid flashing the setup wizard before the first fetch completes.
    var hasCheckedConnectProfile = false

    // MARK: - Toast (global user-facing messages)

    struct Toast: Identifiable, Equatable {
        let id = UUID()
        let message: String
        let kind: Kind
        enum Kind { case info, success, error }
    }

    var activeToast: Toast?

    func showToast(_ message: String, kind: Toast.Kind = .info) {
        activeToast = Toast(message: message, kind: kind)
    }

    func showError(_ message: String) { showToast(message, kind: .error) }
    func showSuccess(_ message: String) { showToast(message, kind: .success) }

    // MARK: - Navigation (driven by deep links + push taps)

    /// Currently selected main tab (0=Discover, 1=Likes, 2=Matches, 3=Profile)
    var selectedTab: Int = 0

    /// When set, the Matches tab should push to ChatView for this match
    var pendingChatMatchId: String?

    // MARK: - Unread messages (for tab badge + per-match indicator)

    var totalUnreadCount: Int = 0
    var unreadByMatch: [String: Int] = [:]

    // MARK: - Discovery filters (shared between Settings + Discover)

    struct DiscoveryFilters: Codable, Equatable {
        var city: String = ""
        var maxDistanceMiles: Int = 50
        var globalSearch: Bool = false
        var role: String = "ALL" // ALL | CREATIVE | CLIENT

        /// Optional radius-based origin that takes priority over the user's
        /// device coords when set. Populated when the user expands a pin on
        /// the globe view at a wide zoom — we filter to "people near this
        /// region" instead of "people near me". Cleared by setting `city`
        /// or `globalSearch`, or by explicit reset.
        var overrideLatitude: Double?
        var overrideLongitude: Double?
        var overrideMaxDistanceMiles: Int?
    }

    private static let filtersKey = "ekko-connect-filters"
    var discoveryFilters: DiscoveryFilters = {
        if let data = UserDefaults.standard.data(forKey: "ekko-connect-filters"),
           let decoded = try? JSONDecoder().decode(DiscoveryFilters.self, from: data) {
            return decoded
        }
        return DiscoveryFilters()
    }() {
        didSet {
            if let data = try? JSONEncoder().encode(discoveryFilters) {
                UserDefaults.standard.set(data, forKey: Self.filtersKey)
            }
        }
    }

    func refreshUnreadCounts() async {
        struct Count: Codable { let count: Int }
        struct PerMatch: Codable { let matchId: String; let count: Int }

        if let total: Count = try? await trpc.query("connectChat.getUnreadCount") {
            totalUnreadCount = total.count
        }
        if let perMatch: [PerMatch] = try? await trpc.query("connectChat.getUnreadCountsByMatch") {
            unreadByMatch = Dictionary(uniqueKeysWithValues: perMatch.map { ($0.matchId, $0.count) })
        }
    }

    // MARK: - Preferences

    var colorSchemeOverride: ColorScheme? {
        switch themePreference {
        case "light": return .light
        case "dark": return .dark
        default: return nil
        }
    }

    /// Stored property so @Observable notifies on changes. Persisted to UserDefaults via didSet.
    var themePreference: String = UserDefaults.standard.string(forKey: "theme") ?? "system" {
        didSet {
            UserDefaults.standard.set(themePreference, forKey: "theme")
        }
    }

    // MARK: - Init

    init() {
        guard let supabaseURL = URL(string: Config.supabaseURL) else {
            fatalError("Config.supabaseURL is not a valid URL: \(Config.supabaseURL)")
        }
        let supabaseClient = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: Config.supabaseAnonKey)
        self.supabase = supabaseClient

        guard let trpcBaseURL = URL(string: Config.trpcBaseURL) else {
            fatalError("Config.trpcBaseURL is not a valid URL: \(Config.trpcBaseURL)")
        }
        self.trpc = TRPCClient(baseURL: trpcBaseURL)

        // Always get a fresh token from Supabase for each tRPC request
        self.trpc.tokenProvider = {
            try? await supabaseClient.auth.session.accessToken
        }

        Task { await restoreSession() }
    }

    // MARK: - Session Management

    func restoreSession() async {
        defer { isLoading = false }
        do {
            let session = try await supabase.auth.session
            self.session = session
            trpc.setAccessToken(session.accessToken)
            #if DEBUG
            print("[Auth] Session restored.")
            #endif
            await fetchCurrentUser()
        } catch {
            #if DEBUG
            print("[Auth] No session: \(error)")
            #endif
            self.session = nil
        }
    }

    func updateSession(_ session: Session) async {
        self.session = session
        trpc.setAccessToken(session.accessToken)
        await fetchCurrentUser()
        // Notify listeners that the user changed (for IAP / push sync)
        NotificationCenter.default.post(name: .init("EKKOUserChanged"), object: session.user.id.uuidString)
    }

    func signOut() async {
        try? await supabase.auth.signOut()
        session = nil
        currentUser = nil
        currentProfile = nil
        trpc.setAccessToken(nil)
    }

    func fetchCurrentUser() async {
        // Fetch the full User record (includes role, which we need for admin/GM).
        do {
            let user: User = try await trpc.query("auth.me")
            self.currentUser = user
        } catch {
            #if DEBUG
            print("[Auth] auth.me failed: \(error)")
            #endif
            self.currentUser = nil
        }

        do {
            let profile: Profile = try await trpc.query("profile.getCurrent")
            self.currentProfile = profile
        } catch {
            #if DEBUG
            print("[Auth] profile.getCurrent failed: \(error)")
            #endif
            self.currentProfile = nil
        }

        // Also check for a ConnectProfile so the router knows whether to push setup.
        do {
            let connect: ConnectProfile = try await trpc.query("connectProfile.getCurrent")
            self.currentConnectProfile = connect
        } catch {
            self.currentConnectProfile = nil
        }
        hasCheckedConnectProfile = true
    }

    /// Call after the user finishes Profile Setup so the router advances.
    func refreshConnectProfile() async {
        if let connect: ConnectProfile = try? await trpc.query("connectProfile.getCurrent") {
            currentConnectProfile = connect
        }
    }
}
