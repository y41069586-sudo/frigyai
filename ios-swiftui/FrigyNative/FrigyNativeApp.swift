import SwiftUI

@main
struct FrigyNativeApp: App {
    @State private var router = AppRouter()

    init() {
        // Configure the RevenueCat SDK before any paywall/purchase access.
        RevenueCatBootstrap.configureIfNeeded()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
                .environment(router.tabCoordinator)
                .preferredColorScheme(.light)
                .task {
                    await router.bootstrap()
                }
                .onOpenURL { url in
                    router.handleIncomingURL(url)
                }
        }
    }
}
