import Foundation

enum AppTab: String, CaseIterable, Identifiable, Hashable {
    case home
    case plans
    case shopping

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: "Home"
        case .plans: "Plans"
        case .shopping: "Shopping"
        }
    }

    var systemImage: String {
        switch self {
        case .home: "house.fill"
        case .plans: "calendar"
        case .shopping: "cart.fill"
        }
    }
}

/// Top-level app destinations outside tab stacks.
enum AppRoute: Hashable {
    case loading
    case onboarding
    case auth
    case main
}

/// Cross-tab deep link targets with typed push payloads.
enum AppDeepLink: Equatable {
    case tab(AppTab)
    case home(HomeRoute)
    case plans(PlansRoute)
    case shopping(ShoppingRoute)
    case openTracker
    case authCallback(URL)
    case signup(referralCode: String?)
    case subscriptionSuccess
    case onboardingReferral(code: String?)
}

enum HomeRoute: Hashable {
    case profile
    case badges
    case foodEntry(UUID)
    case chatbot
    case weightProgress
}

enum PlansRoute: Hashable {
    case mealDetail(String)
    case reminders
    case preferences
}

enum ShoppingRoute: Hashable {
    case category(String)
    case item(String)
}

/// Legacy string paths from web deep links (`/profile`, `/meal-plans?tab=shopping`, …).
enum LegacyWebPath: Equatable {
    case root(query: [URLQueryItem])
    case profile
    case badges
    case mealPlans(tab: String?)
    case scan
    case premiumPricing
    case signup(ref: String?)
    case auth
    case unknown(String)
}

extension AppDeepLink {
    var debugLabel: String {
        switch self {
        case .tab(let tab): "tab:\(tab.rawValue)"
        case .home(let route): "home:\(route)"
        case .plans(let route): "plans:\(route)"
        case .shopping(let route): "shopping:\(route)"
        case .openTracker: "openTracker"
        case .authCallback(let url): "authCallback:\(url.absoluteString)"
        case .signup(let ref): "signup:\(ref ?? "nil")"
        case .subscriptionSuccess: "subscriptionSuccess"
        case .onboardingReferral(let code): "onboardingReferral:\(code ?? "nil")"
        }
    }
}

extension HomeRoute: CustomStringConvertible {
    var description: String {
        switch self {
        case .profile: "profile"
        case .badges: "badges"
        case .foodEntry(let id): "foodEntry(\(id.uuidString))"
        case .chatbot: "chatbot"
        case .weightProgress: "weightProgress"
        }
    }
}

extension PlansRoute: CustomStringConvertible {
    var description: String {
        switch self {
        case .mealDetail(let id): "mealDetail(\(id))"
        case .reminders: "reminders"
        case .preferences: "preferences"
        }
    }
}

extension ShoppingRoute: CustomStringConvertible {
    var description: String {
        switch self {
        case .category(let name): "category(\(name))"
        case .item(let id): "item(\(id))"
        }
    }
}
