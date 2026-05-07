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

    // MARK: - Invite gate

    /// Code captured from an `ekkoconnect://invite?code=...` deep link.
    /// InviteGateView reads this on appear to pre-fill the input, then clears it.
    var pendingInviteCode: String?

    /// True when an authenticated user has not yet passed the invite gate.
    /// Treats nil/missing `accessGranted` (older server response) as ungated
    /// rather than gated, so a transient auth.me failure can't lock a real
    /// member out of the app.
    var needsInviteGate: Bool {
        isAuthenticated && currentUser?.accessGranted == false
    }

    // MARK: - First-run onboarding flow
    //
    // Decoupled from the existing CompleteProfileView / ProfileSetupView gates.
    // Once the user has a Profile (name/role) but no ConnectProfile yet, they
    // walk through Theme picker → Avatar picker → ProfileSetupView. Each
    // intermediate flag is in-memory only — they're transient steps that just
    // bridge sign-up to the existing setup wizard. The final
    // `pendingFirstProfileEdit` flag, set after ProfileSetupView saves, hands
    // the user off to ProfileView in edit mode with TipKit coach marks.

    /// Set by ThemePickerView and consumed by ProfileSetupView when calling
    /// `connectProfile.create`. nil before pick, .default-or-other after.
    var pendingTemplate: ConnectProfileTemplate?

    /// Whether the user still needs to pick a profile theme. Only meaningful
    /// once they have a `currentProfile` (name/role done) but no
    /// `currentConnectProfile` yet.
    var needsThemePick: Bool = true

    /// Whether the user still needs to (optionally) pick an avatar. Goes
    /// false after they tap "Save" or "Skip" on AvatarPickerView. Defaults
    /// true so the screen shows once per first-run; if they skip, it stays
    /// false until the next time the gate sequence re-enters from a clean
    /// state (e.g. signing out and back in).
    var needsAvatar: Bool = true

    /// Set by ProfileSetupView right after first save. AppRouter reads it
    /// to land on the Profile tab, ProfileView reads it to flip into edit
    /// mode, then both clear it.
    var pendingFirstProfileEdit: Bool = false

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

    // MARK: - In-app Message Banner
    //
    // Shown when a push-delivered message arrives while the app is foregrounded
    // AND the user isn't already viewing that chat. Richer than a toast: carries
    // sender name, preview, and a tap route. Suppresses the iOS system banner
    // so the in-app version feels native to EKKO.

    struct MessageBanner: Identifiable, Equatable {
        let id = UUID()
        let title: String           // usually the sender's display name
        let preview: String         // message preview text
        let route: String?          // deep-link route to fire on tap
        let initials: String        // fallback avatar letters when we don't have a URL
    }

    var activeMessageBanner: MessageBanner?

    /// Match-id of the chat the user is currently viewing. ChatView sets this
    /// on appear and clears on disappear. Used by the banner dispatcher to
    /// avoid banner-spamming the user over the message they're already reading.
    var activeChatMatchId: String?

    func showMessageBanner(_ banner: MessageBanner) {
        activeMessageBanner = banner
    }

    // MARK: - Navigation (driven by deep links + push taps)

    /// Currently selected main tab (0=Discover, 1=Likes, 2=Matches, 3=Profile)
    var selectedTab: Int = 0

    /// When set, the Matches tab should push to ChatView for this match
    var pendingChatMatchId: String?

    // MARK: - Unread messages (for tab badge + per-match indicator)

    var totalUnreadCount: Int = 0
    var unreadByMatch: [String: Int] = [:]
    /// Drives the badge on the Likes → Requests segment.
    var inquiryUnreadCount: Int = 0

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
        await refreshInquiryUnreadCount()
    }

    func refreshInquiryUnreadCount() async {
        struct Count: Codable { let count: Int }
        if let result: Count = try? await trpc.query("connectInquiry.getUnreadCount") {
            inquiryUnreadCount = result.count
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
        currentConnectProfile = nil
        hasCheckedConnectProfile = false
        pendingInviteCode = nil
        // Reset onboarding state so a fresh login walks the picker flow again
        // if it lands on a fresh account that has no connect profile yet.
        pendingTemplate = nil
        needsThemePick = true
        needsAvatar = true
        pendingFirstProfileEdit = false
        trpc.setAccessToken(nil)
        await MainActor.run { MatchLiveActivityManager.endAll() }
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
