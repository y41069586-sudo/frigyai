import SwiftUI
import UserNotifications
import Charts

// MARK: - Route Views

struct HomeRouteView: View {
    let route: HomeRoute

    var body: some View {
        switch route {
        case .profile:            ProfileView()
        case .badges:             BadgesView()
        case .foodEntry(let id):  FoodEntryView(entryId: id)
        case .chatbot(let prompt): ChatbotView(initialPrompt: prompt)
        case .weightProgress:     WeightProgressView()
        }
    }
}

struct PlansRouteView: View {
    let route: PlansRoute

    var body: some View {
        switch route {
        case .mealDetail(let id): MealDetailView(id: id)
        case .reminders:          RemindersView()
        case .preferences:        MealPlanPreferencesView()
        }
    }
}

struct ShoppingRouteView: View {
    let route: ShoppingRoute

    var body: some View {
        switch route {
        case .category(let name): ShoppingCategoryView(name: name)
        case .item(let id):       ShoppingItemDetailView(id: id)
        }
    }
}

// MARK: - Tab Roots

struct HomeTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .home)) {
            HomeDashboardView()
                .navigationDestination(for: HomeRoute.self) {
                    HomeRouteView(route: $0).frigyDetailContainer()
                }
        }
        .onAppear { tabCoordinator.markTabActivated(.home) }
    }
}

struct PlansTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .plans)) {
            MealPlansView()
                .navigationDestination(for: PlansRoute.self) {
                    PlansRouteView(route: $0).frigyDetailContainer()
                }
        }
        .onAppear { tabCoordinator.markTabActivated(.plans) }
    }
}

struct ShoppingTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .shopping)) {
            ShoppingListView()
                .navigationDestination(for: ShoppingRoute.self) {
                    ShoppingRouteView(route: $0).frigyDetailContainer()
                }
        }
        .onAppear { tabCoordinator.markTabActivated(.shopping) }
    }
}

