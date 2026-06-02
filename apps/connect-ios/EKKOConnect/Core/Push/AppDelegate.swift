import UIKit
import UserNotifications
import Kingfisher

/// UIKit AppDelegate for handling push notification registration and deep linking.
/// Bridged into SwiftUI via `@UIApplicationDelegateAdaptor`.
class AppDelegate: NSObject, UIApplicationDelegate {
    // Shared push manager — injected from EKKOConnectApp
    static var pushManager: PushManager?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        configureImageCache()
        // Set notification delegate
        if let push = Self.pushManager {
            UNUserNotificationCenter.current().delegate = push
        }
        return true
    }

    /// One-time Kingfisher cache tuning. Kingfisher's default memory cost limit
    /// is ~physicalMemory/4 (gigabytes of decoded bitmaps) which lets full-res
    /// uploads blow up RAM. Cap it hard; downsampling (see KFImage+Downsample)
    /// shrinks each decoded bitmap to its on-screen size.
    private func configureImageCache() {
        let cache = ImageCache.default
        cache.memoryStorage.config.totalCostLimit = 150 * 1024 * 1024  // 150 MB decoded
        cache.memoryStorage.config.expiration = .seconds(300)          // evict idle decodes after 5 min
        cache.diskStorage.config.sizeLimit = 300 * 1024 * 1024         // 300 MB on disk
        cache.diskStorage.config.expiration = .days(7)                 // explicit (also the default)
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
