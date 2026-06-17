import SwiftUI

struct HomeRouteView: View {
    let route: HomeRoute

    var body: some View {
        switch route {
        case .profile:
            PlaceholderDetailView(title: "Profile", subtitle: "Deep link: /profile")
        case .badges:
            PlaceholderDetailView(title: "Badges", subtitle: "Deep link: /badges")
        case .foodEntry(let id):
            PlaceholderDetailView(title: "Food Entry", subtitle: id.uuidString)
        case .chatbot:
            PlaceholderDetailView(title: "Chatbot", subtitle: "AI chat lands in Phase 5")
        case .weightProgress:
            PlaceholderDetailView(title: "Weight", subtitle: "Weight progress dialog")
        }
    }
}

struct PlansRouteView: View {
    let route: PlansRoute

    var body: some View {
        switch route {
        case .mealDetail(let id):
            PlaceholderDetailView(title: "Meal", subtitle: id)
        case .reminders:
            PlaceholderDetailView(title: "Reminders", subtitle: "Deep link: /meal-plans?tab=reminders")
        case .preferences:
            PlaceholderDetailView(title: "Preferences", subtitle: "Meal plan wizard")
        }
    }
}

struct ShoppingRouteView: View {
    let route: ShoppingRoute

    var body: some View {
        switch route {
        case .category(let name):
            PlaceholderDetailView(title: "Category", subtitle: name)
        case .item(let id):
            PlaceholderDetailView(title: "Item", subtitle: id)
        }
    }
}

struct PlaceholderDetailView: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.title2.bold())
            Text(subtitle).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct HomeTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .home)) {
            HomeDashboardView()
                .navigationDestination(for: HomeRoute.self) { route in
                    HomeRouteView(route: route)
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
                .navigationDestination(for: PlansRoute.self) { route in
                    PlansRouteView(route: route)
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
                .navigationDestination(for: ShoppingRoute.self) { route in
                    ShoppingRouteView(route: route)
                }
        }
        .onAppear { tabCoordinator.markTabActivated(.shopping) }
    }
}
