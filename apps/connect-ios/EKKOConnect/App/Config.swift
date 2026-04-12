import Foundation

enum Config {
    static let supabaseURL = "https://tfpxqdiqapnhivvvylml.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcHhxZGlxYXBuaGl2dnZ5bG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjkwODMsImV4cCI6MjA4NTg0NTA4M30.Mn6EkP96mGb_lS1Xpc7ngeNR-SnT_quV_mGuKOtdcGA"

    // tRPC base URL — your Connect web app API
    // Local dev: "http://YOUR_MAC_IP:3001/api/trpc"
    // Production: "https://ekkoconnect.app/api/trpc"
    static let trpcBaseURL = "http://192.168.0.10:3001/api/trpc"

    // RevenueCat iOS public API key (from RevenueCat dashboard)
    static let revenueCatAPIKey = ""
}
