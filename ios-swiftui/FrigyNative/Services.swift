import Foundation

struct UserSession {
    let userId: String
    let email: String
}

protocol AuthServiceProtocol {
    func currentSession() async throws -> UserSession?
}

protocol SubscriptionServiceProtocol {
    func refreshPremiumState() async throws -> Bool
    func restorePurchases() async throws -> Bool
}

final class MockAuthService: AuthServiceProtocol {
    func currentSession() async throws -> UserSession? {
        nil
    }
}

final class MockSubscriptionService: SubscriptionServiceProtocol {
    func refreshPremiumState() async throws -> Bool {
        false
    }

    func restorePurchases() async throws -> Bool {
        false
    }
}
