import Foundation

@MainActor
final class AppState: ObservableObject {
    enum Route {
        case loading
        case onboarding
        case auth
        case main
    }

    @Published var route: Route = .loading
    @Published var isPremium: Bool = false

    let authService: AuthServiceProtocol
    let subscriptionService: SubscriptionServiceProtocol

    init(
        authService: AuthServiceProtocol = MockAuthService(),
        subscriptionService: SubscriptionServiceProtocol = MockSubscriptionService()
    ) {
        self.authService = authService
        self.subscriptionService = subscriptionService
    }

    func bootstrap() async {
        do {
            let hasOnboarding = UserDefaults.standard.bool(forKey: "onboardingComplete")
            let session = try await authService.currentSession()

            guard hasOnboarding else {
                route = .onboarding
                return
            }

            guard session != nil else {
                route = .auth
                return
            }

            isPremium = try await subscriptionService.refreshPremiumState()
            route = .main
        } catch {
            route = .auth
        }
    }
}
