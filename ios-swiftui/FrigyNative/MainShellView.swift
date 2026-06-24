import SwiftUI

/// Root shell for authenticated users. Keeps all three tab roots (and their
/// `NavigationPath`s) alive in a `ZStack` and toggles visibility by selected tab,
/// so there is NO system `TabView` chrome — on iPad the system `TabView` renders a
/// floating top tab bar that cannot be fully suppressed, which is the "slidebar"
/// that appeared above every screen. The only navigation UI is the custom
/// web-style floating glass bottom bar (`GlassTabBar`).
struct MainShellView: View {
    @Environment(AppRouter.self) private var router
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        @Bindable var coordinator = tabCoordinator

        ZStack {
            tabRoot(HomeTabRoot(), tab: .home, selected: coordinator.selectedTab)
            tabRoot(PlansTabRoot(), tab: .plans, selected: coordinator.selectedTab)
            tabRoot(ShoppingTabRoot(), tab: .shopping, selected: coordinator.selectedTab)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            GlassTabBar(selection: $coordinator.selectedTab, mealCount: coordinator.todayMealCount) {
                coordinator.openTracker()
            }
        }
        .sheet(isPresented: $coordinator.showTrackerSheet) {
            TrackerLogMealView(preselectedCategory: coordinator.trackerPreselectedCategory)
        }
    }

    /// Keep every root mounted (state preserved) but only show/hit-test the active one.
    private func tabRoot<Content: View>(_ content: Content, tab: AppTab, selected: AppTab) -> some View {
        let active = tab == selected
        return content
            .opacity(active ? 1 : 0)
            .allowsHitTesting(active)
            .zIndex(active ? 1 : 0)
    }
}

#if DEBUG
#Preview {
    MainShellView()
        .environment(AppRouter())
        .environment(MainTabCoordinator())
}
#endif
