import Foundation
import SwiftUI

@MainActor
@Observable
final class AppRouter {
    var rootRoute: AppRoute = .loading
    var isPremium = false
    var pendingDeepLink: AppDeepLink?
    var lastHandledDeepLink: AppDeepLink?
    var authStatusMessage: String?

    let tabCoordinator = MainTabCoordinator()
    let authService: AuthServiceProtocol
    let subscriptionService: SubscriptionServiceProtocol

    init(
        authService: AuthServiceProtocol? = nil,
        subscriptionService: SubscriptionServiceProtocol = MockSubscriptionService()
    ) {
        #if canImport(Supabase)
        self.authService = authService ?? (SupabaseConfig.isConfigured ? SupabaseAuthService.shared : MockAuthService())
        #else
        self.authService = authService ?? MockAuthService()
        #endif
        self.subscriptionService = subscriptionService
    }

    func bootstrap() async {
        rootRoute = .loading
        authStatusMessage = nil

        do {
            _ = try await authService.restoreSession()
            let hasOnboarding = UserDefaults.standard.bool(forKey: "onboardingComplete")

            guard hasOnboarding else {
                rootRoute = .onboarding
                flushPendingDeepLinkIfNeeded()
                return
            }

            guard try await authService.currentSession() != nil else {
                rootRoute = .auth
                return
            }

            isPremium = try await subscriptionService.refreshPremiumState()
            rootRoute = .main
            flushPendingDeepLinkIfNeeded()
        } catch {
            authStatusMessage = error.localizedDescription
            rootRoute = .auth
        }
    }

    func handleIncomingURL(_ url: URL) {
        Task { await handleIncomingURLAsync(url) }
    }

    func handleIncomingURLAsync(_ url: URL) async {
        if let authResult = await authService.handleOAuthCallback(url: url) {
            authStatusMessage = authResult.message
            if authResult.success {
                await completeAuthFlowAfterCallback()
            }
            return
        }

        guard let deepLink = DeepLinkParser.parse(url: url) else { return }
        handle(deepLink: deepLink)
    }

    func handle(deepLink: AppDeepLink) {
        lastHandledDeepLink = deepLink

        switch deepLink {
        case .authCallback(let url):
            Task {
                if let authResult = await authService.handleOAuthCallback(url: url) {
                    authStatusMessage = authResult.message
                    if authResult.success {
                        await completeAuthFlowAfterCallback()
                    }
                }
            }

        case .signup(let ref), .onboardingReferral(let ref):
            if let ref, !ref.isEmpty {
                UserDefaults.standard.set(ref, forKey: "pendingReferralCode")
            }
            if rootRoute == .main {
                tabCoordinator.open(deepLink)
            } else {
                pendingDeepLink = deepLink
                rootRoute = .onboarding
            }

        case .subscriptionSuccess:
            if rootRoute == .main {
                tabCoordinator.selectTab(.home)
            } else {
                pendingDeepLink = deepLink
            }

        default:
            guard rootRoute == .main else {
                pendingDeepLink = deepLink
                return
            }
            tabCoordinator.open(deepLink)
        }
    }

    func completeOnboarding() {
        UserDefaults.standard.set(true, forKey: "onboardingComplete")
        Task { await bootstrap() }
    }

    func signOut() async {
        try? await authService.signOut()
        tabCoordinator.popToRootAllTabs()
        rootRoute = .auth
    }

    private func completeAuthFlowAfterCallback() async {
        do {
            guard try await authService.currentSession() != nil else {
                authStatusMessage = "Session not available after OAuth callback."
                rootRoute = .auth
                return
            }
            isPremium = try await subscriptionService.refreshPremiumState()
            rootRoute = .main
            flushPendingDeepLinkIfNeeded()
        } catch {
            authStatusMessage = error.localizedDescription
            rootRoute = .auth
        }
    }

    private func flushPendingDeepLinkIfNeeded() {
        guard rootRoute == .main, let pendingDeepLink else { return }
        self.pendingDeepLink = nil
        tabCoordinator.open(pendingDeepLink)

        switch pendingDeepLink {
        case .subscriptionSuccess:
            tabCoordinator.selectTab(.home)
        default:
            break
        }
    }
}
