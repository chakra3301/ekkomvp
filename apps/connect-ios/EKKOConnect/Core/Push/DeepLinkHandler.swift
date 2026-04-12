import Foundation

/// Handles deep links from URL schemes (`ekkoconnect://`) and Universal Links (`ekkoconnect.app`).
enum DeepLinkHandler {
    /// Notification posted when a deep link is received. Object is the route path string.
    static let deepLinkNotification = Notification.Name("EKKODeepLink")

    /// Parse and handle a URL, posting a notification with the route path.
    @discardableResult
    static func handle(url: URL) -> Bool {
        let route = extractRoute(from: url)
        guard let route, !route.isEmpty else { return false }

        NotificationCenter.default.post(
            name: deepLinkNotification,
            object: route
        )
        return true
    }

    /// Extract the app route from various URL formats.
    private static func extractRoute(from url: URL) -> String? {
        // ekkoconnect://auth-callback?code=...
        if url.scheme == "ekkoconnect" {
            if url.host == "auth-callback" {
                // OAuth callback — the auth flow will handle the code exchange
                return "/auth-callback?\(url.query ?? "")"
            }
            // Generic deep link: ekkoconnect://matches/abc → /matches/abc
            return "/\(url.host ?? "")\(url.path)"
        }

        // Universal Links: https://ekkoconnect.app/matches/abc → /matches/abc
        if url.host?.contains("ekkoconnect.app") == true {
            return url.path
        }

        return nil
    }
}
