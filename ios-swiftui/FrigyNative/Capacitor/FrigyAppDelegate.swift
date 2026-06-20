import Capacitor
import UIKit
import UserNotifications

final class FrigyAppDelegate: NSObject, UIApplicationDelegate {
    nonisolated func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        if Thread.isMainThread {
            MainActor.assumeIsolated {
                UNUserNotificationCenter.current().delegate = self
            }
        } else {
            DispatchQueue.main.sync {
                MainActor.assumeIsolated {
                    UNUserNotificationCenter.current().delegate = self
                }
            }
        }
        return true
    }

    nonisolated func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    nonisolated func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }

    nonisolated func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        onMainActor {
            ApplicationDelegateProxy.shared.application(app, open: url, options: options)
        }
    }

    nonisolated func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let url = userActivity.webpageURL else {
            return false
        }
        return onMainActor {
            ApplicationDelegateProxy.shared.application(application, open: url, options: [:])
        }
    }

    private nonisolated func onMainActor<T>(_ work: @MainActor () -> T) -> T {
        if Thread.isMainThread {
            return MainActor.assumeIsolated(work)
        }
        return DispatchQueue.main.sync {
            MainActor.assumeIsolated(work)
        }
    }
}

@MainActor
extension FrigyAppDelegate: UNUserNotificationCenterDelegate {
    @MainActor
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }
}
