import SwiftUI

/// Root shell for authenticated users. Keeps all three tab roots (and their
/// `NavigationPath`s) alive in a `ZStack` and toggles visibility by selected tab,
/// so there is NO system `TabView` chrome — on iPad the system `TabView` renders a
/// floating top tab bar that cannot be fully suppressed, which is the "slidebar"
/// that appeared above every screen. The only navigation UI is the custom
/// web-style floating glass bottom bar (`GlassTabBar`) plus the tracker (+) button
/// which lives here at the highest possible z-order so it can never be occluded.
struct MainShellView: View {
    @Environment(AppRouter.self) private var router
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    private let trackerSize: CGFloat = 60

    var body: some View {
        @Bindable var coordinator = tabCoordinator

        GeometryReader { geo in
            ZStack {
                tabRoot(HomeTabRoot(), tab: .home, selected: coordinator.selectedTab)
                tabRoot(PlansTabRoot(), tab: .plans, selected: coordinator.selectedTab)
                tabRoot(ShoppingTabRoot(), tab: .shopping, selected: coordinator.selectedTab)
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                GlassTabBar(selection: $coordinator.selectedTab)
            }
            // Tracker button rendered AFTER safeAreaInset so it's always on top.
            // Bottom padding positions it floating above the tab bar.
            .overlay(alignment: .bottom) {
                HStack {
                    Spacer()
                    trackerButton(
                        mealCount: coordinator.todayMealCount,
                        action: { coordinator.openTracker() }
                    )
                    .padding(.trailing, 16)
                }
                .frame(maxWidth: 460)
                .padding(.bottom, geo.safeAreaInsets.bottom + 18)
            }
        }
        .sheet(isPresented: $coordinator.showTrackerSheet) {
            TrackerLogMealView(preselectedCategory: coordinator.trackerPreselectedCategory)
        }
    }

    @ViewBuilder
    private func trackerButton(mealCount: Int, action: @escaping () -> Void) -> some View {
        if #available(iOS 26, *) {
            GlassEffectContainer {
                glassTrackerButton(mealCount: mealCount, action: action)
            }
            .shadow(color: FrigyBrand.primaryDeep.opacity(0.38), radius: 12, y: 6)
        } else {
            legacyTrackerButton(mealCount: mealCount, action: action)
        }
    }

    @available(iOS 26, *)
    private func glassTrackerButton(mealCount: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: trackerSize, height: trackerSize)
                    .contentShape(Circle())
                if mealCount > 0 {
                    Text("\(mealCount)")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(Color(hex: "#EF4444")))
                        .offset(x: 4, y: -2)
                }
            }
        }
        .buttonStyle(.plain)
        .frame(width: trackerSize, height: trackerSize)
        .glassEffect(.regular.tint(FrigyBrand.primaryDeep).interactive(), in: .circle)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
    }

    private func legacyTrackerButton(mealCount: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: trackerSize, height: trackerSize)
                    .background(Circle().fill(LinearGradient(
                        colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )))
                    .padding(5)
                    .background(Circle().fill(.white))
                    .shadow(color: FrigyBrand.primaryDeep.opacity(0.38), radius: 12, y: 6)
                if mealCount > 0 {
                    Text("\(mealCount)")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(Color(hex: "#EF4444")))
                        .offset(x: 4, y: -2)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
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
}
#endif
