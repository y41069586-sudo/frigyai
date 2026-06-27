import Foundation
import Testing
@testable import FrigyNative

struct DeepLinkParserTests {
    @Test func frigyCallbackAuth() async throws {
        let url = URL(string: "frigy://callback?code=abc")!
        let link = DeepLinkParser.parse(url: url)
        #expect(link == .authCallback(url))
    }

    @Test func universalProfileLink() async throws {
        let url = URL(string: "https://app.frigy.app/profile")!
        let link = DeepLinkParser.parse(url: url)
        #expect(link == .home(.profile))
    }

    @Test func mealPlansShoppingTab() async throws {
        let url = URL(string: "https://app.frigy.app/meal-plans?tab=shopping")!
        let link = DeepLinkParser.parse(url: url)
        #expect(link == .tab(.shopping))
    }

    @Test func logMealQueryOpensTracker() async throws {
        let url = URL(string: "https://app.frigy.app/?logMeal=1")!
        let link = DeepLinkParser.parse(url: url)
        #expect(link == .openTracker)
    }

    @Test func signupReferral() async throws {
        let url = URL(string: "frigy://signup?ref=ABC123")!
        let link = DeepLinkParser.parse(url: url)
        #expect(link == .signup(referralCode: "ABC123"))
    }
}

struct MainTabCoordinatorTests {
    @Test @MainActor func deepLinkPushAcrossTabs() async throws {
        let coordinator = MainTabCoordinator()
        coordinator.open(.home(.profile))
        #expect(coordinator.selectedTab == .home)
        #expect(coordinator.homePath.count == 1)

        coordinator.open(.tab(.shopping))
        #expect(coordinator.selectedTab == .shopping)

        coordinator.open(.plans(.reminders))
        #expect(coordinator.selectedTab == .plans)
        #expect(coordinator.plansPath.count == 1)
    }

    @Test @MainActor func pathsAreIndependent() async throws {
        let coordinator = MainTabCoordinator()
        coordinator.pushHome(.badges)
        coordinator.pushPlans(.mealDetail("lunch"))
        #expect(coordinator.homePath.count == 1)
        #expect(coordinator.plansPath.count == 1)
        coordinator.selectTab(.home)
        #expect(coordinator.plansPath.count == 1)
    }
}
