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
    var isLoading = true
    var isAuthenticated: Bool { session != nil }

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
        let supabaseURL = URL(string: Config.supabaseURL)!
        let supabaseClient = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: Config.supabaseAnonKey)
        self.supabase = supabaseClient

        let trpcBaseURL = URL(string: Config.trpcBaseURL)!
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
            print("[Auth] Session restored. User ID: \(session.user.id)")
            print("[Auth] Token prefix: \(String(session.accessToken.prefix(20)))...")
            await fetchCurrentUser()
        } catch {
            print("[Auth] No session: \(error)")
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
        print("[Auth] fetchCurrentUser starting...")
        do {
            let profile: Profile = try await trpc.query("profile.getCurrent")
            self.currentProfile = profile
            print("[Auth] Profile loaded: \(profile.displayName ?? "unknown")")
        } catch {
            print("[Auth] fetchCurrentUser failed: \(error)")
            self.currentProfile = nil
        }
        print("[Auth] fetchCurrentUser done. hasProfile: \(currentProfile != nil)")
    }
}
