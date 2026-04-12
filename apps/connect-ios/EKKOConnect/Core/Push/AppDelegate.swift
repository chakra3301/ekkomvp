import UIKit
import UserNotifications

/// UIKit AppDelegate for handling push notification registration and deep linking.
/// Bridged into SwiftUI via `@UIApplicationDelegateAdaptor`.
class AppDelegate: NSObject, UIApplicationDelegate {
    // Shared push manager — injected from EKKOConnectApp
    static var pushManager: PushManager?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Set notification delegate
        if let push = Self.pushManager {
            UNUserNotificationCenter.current().delegate = push
        }
        return true
    }

    // MARK: - Push Token

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Self.pushManager?.didRegisterForRemoteNotifications(deviceToken: deviceToken)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        Self.pushManager?.didFailToRegisterForRemoteNotifications(error: error)
    }

    // MARK: - Deep Linking (URL Scheme)

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        // Handle ekkoconnect:// URL scheme
        return DeepLinkHandler.handle(url: url)
    }

    // MARK: - Universal Links

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let url = userActivity.webpageURL else {
            return false
        }
        return DeepLinkHandler.handle(url: url)
    }
}
