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
    let onboardingCoordinator: OnboardingCoordinator
    let authService: AuthServiceProtocol
    let subscriptionService: SubscriptionServiceProtocol

    // Defaults are nil and the concrete instances are built inside the (main-actor)
    // init body. Default-argument expressions are evaluated in a nonisolated context,
    // so calling these @MainActor initializers there is a hard error under Xcode 26's
    // MainActor-by-default isolation.
    init(
        authService: AuthServiceProtocol? = nil,
        subscriptionService: SubscriptionServiceProtocol? = nil,
        onboardingCoordinator: OnboardingCoordinator? = nil
    ) {
        #if canImport(Supabase)
        self.authService = authService ?? (SupabaseConfig.isConfigured ? SupabaseAuthService.shared : MockAuthService())
        #else
        self.authService = authService ?? MockAuthService()
        #endif
        #if canImport(RevenueCat)
        self.subscriptionService = subscriptionService
            ?? (RevenueCatConfig.isConfigured ? RevenueCatSubscriptionService.shared : MockSubscriptionService())
        #else
        self.subscriptionService = subscriptionService ?? MockSubscriptionService()
        #endif
        self.onboardingCoordinator = onboardingCoordinator ?? OnboardingCoordinator()
    }

    func bootstrap() async {
        rootRoute = .loading
        authStatusMessage = nil

        do {
            let session = try await authService.restoreSession()

            // Returning user with active session who already completed onboarding → main app
            if session != nil, onboardingCoordinator.isComplete {
                try await routeAfterOnboarding()
                return
            }

            // All other cases: show onboarding.
            // If previously marked complete but no active session (expired, signed out,
            // or reinstalled), reset so the user can sign back in at AccountCreation.
            if onboardingCoordinator.isComplete {
                onboardingCoordinator.resetForFreshOnboarding()
            }

            onboardingCoordinator.resumeFromLastStep()
            await onboardingCoordinator.refreshContext(using: makeOnboardingGate())
            applyQueuedReferralIfNeeded()
            rootRoute = .onboarding(step: onboardingCoordinator.currentStep)
            flushPendingDeepLinkWhileOnboarding()
        } catch {
            // Supabase unavailable — show onboarding (splash with mascot) instead of auth screen
            onboardingCoordinator.resumeFromLastStep()
            rootRoute = .onboarding(step: onboardingCoordinator.currentStep)
        }
    }

    // MARK: - Onboarding navigation

    func onboardingNext() {
        let step = onboardingCoordinator.next()
        rootRoute = .onboarding(step: step)

        if step == .done {
            Task { await finishOnboardingFlow() }
        }
    }

    func onboardingBack() {
        let step = onboardingCoordinator.back()
        rootRoute = .onboarding(step: step)
    }

    func finishOnboardingFlow() async {
        onboardingCoordinator.markComplete()
        do {
            try await routeAfterOnboarding()
        } catch {
            authStatusMessage = error.localizedDescription
            rootRoute = .auth
        }
    }

    func completeOnboarding() {
        onboardingCoordinator.markComplete()
        Task { await bootstrap() }
    }

    // MARK: - Deep links

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
            onboardingCoordinator.applyPendingReferralCode(ref)
            if case .main = rootRoute {
                tabCoordinator.open(deepLink)
            } else {
                pendingDeepLink = deepLink
                rootRoute = .onboarding(step: onboardingCoordinator.currentStep)
            }

        case .subscriptionSuccess:
            if case .main = rootRoute {
                tabCoordinator.selectTab(.home)
            } else {
                pendingDeepLink = deepLink
            }

        default:
            if case .main = rootRoute {
                tabCoordinator.open(deepLink)
            } else {
                pendingDeepLink = deepLink
            }
        }
    }

    func navigateToAuth() {
        rootRoute = .auth
    }

    func signOut() async {
        try? await authService.signOut()
        tabCoordinator.popToRootAllTabs()
        rootRoute = .auth
    }

    // MARK: - Private

    private func routeAfterOnboarding() async throws {
        guard try await authService.currentSession() != nil else {
            rootRoute = .auth
            return
        }

        isPremium = try await subscriptionService.refreshPremiumState()
        rootRoute = .main
        flushPendingDeepLinkIfNeeded()
    }

    private func applyQueuedReferralIfNeeded() {
        if let ref = UserDefaults.standard.string(forKey: "pendingReferralCode") {
            onboardingCoordinator.applyPendingReferralCode(ref)
        }
    }

    private func flushPendingDeepLinkWhileOnboarding() {
        guard case .signup = pendingDeepLink else { return }
        pendingDeepLink = nil
    }

    private func completeAuthFlowAfterCallback() async {
        do {
            guard try await authService.currentSession() != nil else {
                authStatusMessage = "Session not available after OAuth callback."
                rootRoute = .auth
                return
            }

            if onboardingCoordinator.isComplete {
                isPremium = try await subscriptionService.refreshPremiumState()
                rootRoute = .main
                flushPendingDeepLinkIfNeeded()
            } else {
                onboardingCoordinator.resumeFromLastStep()
                rootRoute = .onboarding(step: onboardingCoordinator.currentStep)
            }
        } catch {
            authStatusMessage = error.localizedDescription
            rootRoute = .auth
        }
    }

    private func flushPendingDeepLinkIfNeeded() {
        guard case .main = rootRoute, let pendingDeepLink else { return }
        self.pendingDeepLink = nil
        tabCoordinator.open(pendingDeepLink)

        switch pendingDeepLink {
        case .subscriptionSuccess:
            tabCoordinator.selectTab(.home)
        default:
            break
        }
    }

    private func makeOnboardingGate() -> OnboardingExternalGate {
        LiveOnboardingExternalGate(
            authService: authService,
            subscriptionService: subscriptionService
        )
    }
}
