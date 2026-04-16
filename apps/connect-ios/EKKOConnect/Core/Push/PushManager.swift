import SwiftUI
import UserNotifications

/// Manages APNs registration, permission requests, and push token syncing with the backend.
@Observable
final class PushManager: NSObject {
    var isRegistered = false
    var deviceToken: String?
    var pendingNotificationRoute: String?

    private var trpc: TRPCClient?

    func setup(trpc: TRPCClient) {
        self.trpc = trpc
    }

    // MARK: - Permission & Registration

    func requestPermissionAndRegister() async {
        let center = UNUserNotificationCenter.current()

        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            guard granted else { return }

            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        } catch {
            print("[Push] Permission error: \(error)")
        }
    }

    /// Called from AppDelegate when APNs returns a device token.
    func didRegisterForRemoteNotifications(deviceToken data: Data) {
        let token = data.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = token
        self.isRegistered = true
        Task { await syncTokenWithBackend(token) }
    }

    func didFailToRegisterForRemoteNotifications(error: Error) {
        print("[Push] Registration failed: \(error.localizedDescription)")
    }

    // MARK: - Token Sync

    private func syncTokenWithBackend(_ token: String) async {
        guard let trpc else { return }
        do {
            struct TokenInput: Codable {
                let pushToken: String
                let pushPlatform: String
            }
            try await trpc.mutate(
                "auth.completeUserInfo",
                input: TokenInput(pushToken: token, pushPlatform: "ios")
            )
        } catch {
            print("[Push] Token sync failed: \(error)")
        }
    }

    // MARK: - Notification Handling

    /// Parse a push notification payload and return a deep link route.
    func routeFromNotification(_ userInfo: [AnyHashable: Any]) -> String? {
        // The backend sends { url: "/matches/{matchId}" } or { url: "/likes" }
        if let url = userInfo["url"] as? String {
            return url
        }
        return nil
    }

    /// Handle a notification tap — store the route for the app to navigate to.
    func handleNotificationTap(_ userInfo: [AnyHashable: Any]) {
        pendingNotificationRoute = routeFromNotification(userInfo)
    }

    /// Consume and clear the pending route.
    func consumePendingRoute() -> String? {
        let route = pendingNotificationRoute
        pendingNotificationRoute = nil
        return route
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension PushManager: UNUserNotificationCenterDelegate {
    /// Called when a notification is received while the app is in the foreground.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .sound, .badge]
    }

    /// Called when the user taps a notification.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let route = routeFromNotification(response.notification.request.content.userInfo)
        await MainActor.run {
            self.pendingNotificationRoute = route
        }
    }
}
