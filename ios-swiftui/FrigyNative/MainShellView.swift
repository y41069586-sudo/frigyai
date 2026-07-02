import SwiftUI

/// Root shell for authenticated users. Uses the REAL system `TabView` (iOS 26
/// Liquid Glass tab bar) instead of a hand-built bar — the native selection
/// morph (icons visibly refracting through the glass as the indicator slides
/// between them) is baked into the system's own tab bar renderer and can't be
/// reproduced pixel-for-pixel with a custom `.glassEffect()` capsule, however
/// carefully it's tuned. Real `TabView` gets this for free on iOS 26.
///
/// On iPad, `TabView` shows its bar at the TOP by default (Apple's own
/// iPadOS 18+ convention for larger displays) — left as-is here, since an
/// unverified `.tabViewStyle(.tabBarOnly)` attempt to force it to the bottom
/// was reverted rather than risk another failed build. iPad runs its own
/// full-screen adapted layout, not a shrunk iPhone view (Apple's classic
/// Compatibility Mode was tried and abandoned — see project.yml's
/// TARGETED_DEVICE_FAMILY comment). On iPhone the bar is already at the
/// bottom by default, with full icon + label tab items (see `.tabItem`
/// below), unaffected by any of this.
///
/// The floating tracker (+) button is NOT a tab (it presents a sheet, it doesn't
/// navigate to a destination), so it lives outside the TabView as a custom
/// overlay positioned beside the system bar.
struct MainShellView: View {
    @Environment(AppRouter.self) private var router
    @Environment(MainTabCoordinator.self) private var tabCoordinator
    @Environment(LanguageManager.self) private var lang

    var body: some View {
        @Bindable var coordinator = tabCoordinator

        TabView(selection: $coordinator.selectedTab) {
            HomeTabRoot()
                .tabItem {
                    Label(lang.t(AppTab.home.shortTitle), systemImage: AppTab.home.systemImage)
                }
                .tag(AppTab.home)

            PlansTabRoot()
                .tabItem {
                    Label(lang.t(AppTab.plans.shortTitle), systemImage: AppTab.plans.systemImage)
                }
                .tag(AppTab.plans)

            ShoppingTabRoot()
                .tabItem {
                    Label(lang.t(AppTab.shopping.shortTitle), systemImage: AppTab.shopping.systemImage)
                }
                .tag(AppTab.shopping)
        }
        .tint(FrigyBrand.primaryDeep)
        .overlay(alignment: .bottomTrailing) {
            // Only alongside a tab's ROOT screen — hidden once a detail screen is
            // pushed, matching `frigyDetailContainer()` hiding the tab bar itself.
            if coordinator.path(for: coordinator.selectedTab).isEmpty {
                TrackerPlusButton(mealCount: coordinator.todayMealCount) {
                    coordinator.openTracker()
                }
                .padding(.trailing, 20)
                .padding(.bottom, 54)
                .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: coordinator.path(for: coordinator.selectedTab).isEmpty)
        .sheet(isPresented: $coordinator.showTrackerSheet) {
            TrackerLogMealView(preselectedCategory: coordinator.trackerPreselectedCategory)
                .presentationBackground(.clear)
        }
    }
}

/// Floating action button that opens the meal tracker sheet. Not a tab, so it
/// lives beside the system `TabView` rather than inside it.
private struct TrackerPlusButton: View {
    let mealCount: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(
                        Circle().fill(LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.35), radius: 8, y: 3)
                    )
                    .contentShape(Circle())
                if mealCount > 0 {
                    Text("\(mealCount)")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(Color(hex: "#EF4444")))
                        .offset(x: 3, y: -2)
                }
            }
        }
        .buttonStyle(.plain)
        .frame(width: 50, height: 50)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
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
