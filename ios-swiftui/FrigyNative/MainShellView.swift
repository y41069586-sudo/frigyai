import SwiftUI

/// Root shell for authenticated users. Uses `TabView` with the system tab bar hidden so each
/// tab root (and its `NavigationPath`) stays alive across switches, and overlays the custom
/// web-style floating glass bottom navigation (`GlassTabBar`).
struct MainShellView: View {
    @Environment(AppRouter.self) private var router
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        @Bindable var coordinator = tabCoordinator

        TabView(selection: $coordinator.selectedTab) {
            HomeTabRoot()
                .tag(AppTab.home)

            PlansTabRoot()
                .tag(AppTab.plans)

            ShoppingTabRoot()
                .tag(AppTab.shopping)
        }
        .toolbar(.hidden, for: .tabBar)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            GlassTabBar(selection: $coordinator.selectedTab) {
                coordinator.openTracker()
            }
        }
        .sheet(isPresented: $coordinator.showTrackerSheet) {
            TrackerLogMealView()
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
