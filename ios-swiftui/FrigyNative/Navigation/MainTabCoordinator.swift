import SwiftUI

@MainActor
@Observable
final class MainTabCoordinator {
    var selectedTab: AppTab = .home
    var homePath = NavigationPath()
    var plansPath = NavigationPath()
    var shoppingPath = NavigationPath()
    var showTrackerSheet = false
    var trackerPreselectedCategory: MealCategory? = nil

    /// Tracks whether each tab root has been instantiated (TabView keeps views alive; this aids debugging).
    private(set) var tabActivationCounts: [AppTab: Int] = [:]

    func markTabActivated(_ tab: AppTab) {
        tabActivationCounts[tab, default: 0] += 1
    }

    func path(for tab: AppTab) -> NavigationPath {
        switch tab {
        case .home: homePath
        case .plans: plansPath
        case .shopping: shoppingPath
        }
    }

    func setPath(_ path: NavigationPath, for tab: AppTab) {
        switch tab {
        case .home: homePath = path
        case .plans: plansPath = path
        case .shopping: shoppingPath = path
        }
    }

    func bindingPath(for tab: AppTab) -> Binding<NavigationPath> {
        Binding(
            get: { self.path(for: tab) },
            set: { self.setPath($0, for: tab) }
        )
    }

    // MARK: - Typed navigation

    func selectTab(_ tab: AppTab) {
        selectedTab = tab
    }

    func pushHome(_ route: HomeRoute) {
        selectedTab = .home
        homePath.append(route)
    }

    func pushPlans(_ route: PlansRoute) {
        selectedTab = .plans
        plansPath.append(route)
    }

    func pushShopping(_ route: ShoppingRoute) {
        selectedTab = .shopping
        shoppingPath.append(route)
    }

    func openTracker(category: MealCategory? = nil) {
        trackerPreselectedCategory = category
        showTrackerSheet = true
    }

    /// Applies a parsed deep link across tabs and navigation paths.
    func open(_ deepLink: AppDeepLink) {
        switch deepLink {
        case .tab(let tab):
            selectedTab = tab

        case .home(let route):
            selectedTab = .home
            homePath.append(route)

        case .plans(let route):
            selectedTab = .plans
            plansPath.append(route)

        case .shopping(let route):
            selectedTab = .shopping
            shoppingPath.append(route)

        case .openTracker:
            openTracker()

        case .authCallback, .signup, .subscriptionSuccess, .onboardingReferral:
            break
        }
    }

    func popToRoot(for tab: AppTab) {
        setPath(NavigationPath(), for: tab)
    }

    func popToRootAllTabs() {
        homePath = NavigationPath()
        plansPath = NavigationPath()
        shoppingPath = NavigationPath()
    }
}
