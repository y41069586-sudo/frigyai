import SwiftUI

@main
struct FrigyNativeApp: App {
    @UIApplicationDelegateAdaptor(FrigyAppDelegate.self) private var appDelegate
    @State private var router = AppRouter()

    private var hasWebBundle: Bool {
        Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "public") != nil
    }

    var body: some Scene {
        WindowGroup {
            if hasWebBundle {
                CapacitorHostView()
                    .ignoresSafeArea(.all)
            } else {
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
}
