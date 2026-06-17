import SwiftUI

@main
struct FrigyNativeApp: App {
    @State private var router = AppRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
                .environment(router.tabCoordinator)
                .task {
                    await router.bootstrap()
                }
                .onOpenURL { url in
                    router.handleIncomingURL(url)
                }
        }
    }
}
