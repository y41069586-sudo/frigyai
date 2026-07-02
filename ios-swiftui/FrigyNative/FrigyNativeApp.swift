import SwiftUI
import GoogleSignIn

@main
struct FrigyNativeApp: App {
    @State private var router = AppRouter()
    @State private var theme = ThemeManager.shared
    @State private var language = LanguageManager.shared
    @Environment(\.scenePhase) private var scenePhase

    init() {
        RevenueCatBootstrap.configureIfNeeded()
        // Every pushed/presented screen hides the system nav bar via
        // `.toolbar(.hidden, for: .navigationBar)`, but that modifier only takes
        // effect once the destination view has appeared — during the push/sheet
        // transition itself, UIKit still paints the default *opaque white* nav bar
        // for a frame or two, which showed up as a blank white card flashing over
        // the top of screens like Profil/Ernährungsziele. Making the bar transparent
        // globally means there's nothing opaque to flash before our modifier kicks in.
        let transparentNavBar = UINavigationBarAppearance()
        transparentNavBar.configureWithTransparentBackground()
        UINavigationBar.appearance().standardAppearance = transparentNavBar
        UINavigationBar.appearance().scrollEdgeAppearance = transparentNavBar
        UINavigationBar.appearance().compactAppearance = transparentNavBar
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
                .environment(router.tabCoordinator)
                .environment(theme)
                .environment(language)
                .environment(\.locale, language.locale)
                .preferredColorScheme(theme.colorScheme)
                .task {
                    await router.bootstrap()
                }
                .onOpenURL { url in
                    // Let GoogleSignIn handle its own redirect first; fall through for all others.
                    if !GIDSignIn.sharedInstance.handle(url) {
                        router.handleIncomingURL(url)
                    }
                }
                .onChange(of: scenePhase) { _, phase in
                    guard phase == .active else { return }
                    // Refresh premium state every time the app comes to foreground so
                    // a cancelled or expired subscription is detected without a restart.
                    // (Respects the paywall bypass for tester/review accounts.)
                    Task { await router.refreshPremiumOnForeground() }
                }
                // Temporarily disabled: testing whether real iPadOS Compatibility
                // Mode now works with the ~ipad orientation key removed (see
                // project.yml). Re-add this line if it still doesn't trigger.
                // .phoneCanvasOnPad()
        }
    }
}
