import SwiftUI

/// Root shell for authenticated users. Uses `TabView` with a hidden system tab bar so each
/// tab root (and its `NavigationPath`) stays alive across tab switches.
struct MainShellView: View {
    @Environment(AppRouter.self) private var router
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        @Bindable var tabCoordinator = tabCoordinator

        TabView(selection: $tabCoordinator.selectedTab) {
            HomeTabRoot()
                .tag(AppTab.home)

            PlansTabRoot()
                .tag(AppTab.plans)

            ShoppingTabRoot()
                .tag(AppTab.shopping)
        }
        .toolbar(.hidden, for: .tabBar)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            GlassTabBar(selection: $tabCoordinator.selectedTab) {
                tabCoordinator.openTracker()
            }
        }
        .sheet(isPresented: $tabCoordinator.showTrackerSheet) {
            NavigationStack {
                TrackerLogMealView()
            }
        }
    }
}

#if DEBUG
#Preview {
    MainShellView()
        .environment(AppRouter())
        .environment(MainTabCoordinator())
}
#endif
