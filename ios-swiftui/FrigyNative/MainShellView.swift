import SwiftUI

/// Root shell for authenticated users.
/// Uses the native system TabView (automatic Liquid Glass on iOS 26+) with a
/// floating FAB tracker button overlaid above the tab bar.
struct MainShellView: View {
    @Environment(AppRouter.self) private var router
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        @Bindable var coordinator = tabCoordinator

        TabView(selection: $coordinator.selectedTab) {
            HomeTabRoot()
                .tabItem { Label(AppTab.home.title, systemImage: AppTab.home.systemImage) }
                .tag(AppTab.home)

            PlansTabRoot()
                .tabItem { Label(AppTab.plans.title, systemImage: AppTab.plans.systemImage) }
                .tag(AppTab.plans)

            ShoppingTabRoot()
                .tabItem { Label(AppTab.shopping.title, systemImage: AppTab.shopping.systemImage) }
                .tag(AppTab.shopping)
        }
        .tint(FrigyBrand.primaryDark)
        // FAB tracker button floats above the native tab bar
        .overlay(alignment: .bottomTrailing) {
            Button {
                coordinator.openTracker()
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .modifier(TrackerFABStyle())
            }
            .accessibilityLabel("Mahlzeit tracken")
            .padding(.trailing, 20)
            .padding(.bottom, 90)
        }
        .sheet(isPresented: $coordinator.showTrackerSheet) {
            NavigationStack {
                TrackerLogMealView()
            }
        }
    }
}

private struct TrackerFABStyle: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            content
                .glassEffect(.regular.tint(FrigyBrand.primaryDeep).interactive(), in: .circle)
        } else {
            content
                .background(
                    Circle()
                        .fill(LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                )
                .shadow(color: FrigyBrand.primaryDark.opacity(0.35), radius: 12, y: 6)
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
