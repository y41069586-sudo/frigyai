import SwiftUI

/// Root shell for authenticated users. Keeps all three tab roots (and their
/// `NavigationPath`s) alive in a `ZStack` and toggles visibility by selected tab,
/// so there is NO system `TabView` chrome — on iPad the system `TabView` renders a
/// floating top tab bar that cannot be fully suppressed, which is the "slidebar"
/// that appeared above every screen. The only navigation UI is the custom
/// web-style floating glass bottom bar (`GlassTabBar`), which now also contains
/// the tracker (+) button inline to the right of the Shopping tab.
struct MainShellView: View {
    @Environment(AppRouter.self) private var router
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        @Bindable var coordinator = tabCoordinator

        // .top alignment is critical: a plain ZStack centres its children, so any
        // pushed detail screen whose content doesn't fill the full height would be
        // floated to the vertical centre (big gap at the top, everything pushed
        // down). Top-anchoring keeps the nav bar at the very top.
        ZStack(alignment: .top) {
            tabRoot(HomeTabRoot(), tab: .home, selected: coordinator.selectedTab)
            tabRoot(PlansTabRoot(), tab: .plans, selected: coordinator.selectedTab)
            tabRoot(ShoppingTabRoot(), tab: .shopping, selected: coordinator.selectedTab)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        // OVERLAY (not safeAreaInset): the bar FLOATS over the content so the
        // dashboard scrolls BEHIND it — that's what makes the Liquid Glass refract
        // real content and read as glass instead of flat white. The tab roots add a
        // matching bottom scroll margin so the last row still clears the bar.
        .overlay(alignment: .bottom) {
            // The bar lives only on the three tab roots. As soon as a detail
            // screen is pushed (the active tab's nav path is non-empty), it is
            // hidden so it never floats over meal details, settings, scanner, etc.
            if coordinator.path(for: coordinator.selectedTab).isEmpty {
                GlassTabBar(
                    selection: $coordinator.selectedTab,
                    mealCount: coordinator.todayMealCount,
                    onTrackerTap: { coordinator.openTracker() }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: coordinator.path(for: coordinator.selectedTab).isEmpty)
        .sheet(isPresented: $coordinator.showTrackerSheet) {
            TrackerLogMealView(preselectedCategory: coordinator.trackerPreselectedCategory)
                .presentationBackground(.clear)
        }
    }

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
        .environment(LanguageManager.shared)
}
#endif
