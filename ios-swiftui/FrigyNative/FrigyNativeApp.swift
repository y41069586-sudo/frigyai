import SwiftUI

@main
struct FrigyNativeApp: App {
    @State private var router = AppRouter()
    @State private var theme = ThemeManager.shared
    @Environment(\.scenePhase) private var scenePhase

    init() {
        RevenueCatBootstrap.configureIfNeeded()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
                .environment(router.tabCoordinator)
                .environment(theme)
                .preferredColorScheme(theme.colorScheme)
                .task {
                    await router.bootstrap()
                }
                .onOpenURL { url in
                    router.handleIncomingURL(url)
                }
                .onChange(of: scenePhase) { _, phase in
                    guard phase == .active else { return }
                    // Refresh premium state every time the app comes to foreground so
                    // a cancelled or expired subscription is detected without a restart.
                    Task {
                        if case .main = router.rootRoute {
                            let current = (try? await router.subscriptionService.refreshPremiumState()) ?? router.isPremium
                            router.isPremium = current
                        }
                    }
                }
        }
    }
}
