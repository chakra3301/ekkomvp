import Foundation

enum Config {
    /// Flip this to `.production` before archiving for TestFlight / App Store.
    /// `.development` uses your local Next.js server so you can iterate quickly.
    static let environment: Environment = .production

    enum Environment { case development, production }

    // MARK: - Supabase (same project for dev + prod)

    static let supabaseURL = "https://tfpxqdiqapnhivvvylml.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcHhxZGlxYXBuaGl2dnZ5bG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjkwODMsImV4cCI6MjA4NTg0NTA4M30.Mn6EkP96mGb_lS1Xpc7ngeNR-SnT_quV_mGuKOtdcGA"

    // MARK: - API base URL

    static var trpcBaseURL: String {
        switch environment {
        case .development:
            // Your Mac's IP on the local network — check with `ipconfig getifaddr en0`
            return "http://192.168.0.10:3001/api/trpc"
        case .production:
            // Use www. because Vercel redirects non-www → www and URLSession
            // drops the Authorization header when following cross-host redirects.
            return "https://www.ekkoconnect.app/api/trpc"
        }
    }

    // MARK: - RevenueCat

    /// Public iOS API key from RevenueCat → Project Settings → API Keys.
    /// If empty, the app still works — the Upgrade modal just shows "No packages available".
    static let revenueCatAPIKey = ""
}
