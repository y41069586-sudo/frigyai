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

            // Link the store identity to this Supabase user as early as possible so a
            // purchase made later in this session attaches to the right account.
            if let session {
                await subscriptionService.identify(userId: session.userId)
            }

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

    /// Re-reads premium state when the app returns to the foreground so a
    /// cancelled/expired subscription is detected without a restart. Respects the
    /// paywall bypass: a dev/tester (or App Review demo) account keeps premium
    /// even though it has no real RevenueCat entitlement — otherwise it would be
    /// silently revoked on every foregrounding.
    func refreshPremiumOnForeground() async {
        guard case .main = rootRoute else { return }
        if let session = try? await authService.currentSession(),
           isPaywallBypassed(for: session.email) {
            isPremium = true
            return
        }
        if let current = try? await subscriptionService.refreshPremiumState() {
            isPremium = current
        }
    }

    func navigateToAuth() {
        rootRoute = .auth
    }

    func navigateToOnboardingStart() {
        onboardingCoordinator.resetForFreshOnboarding()
        rootRoute = .onboarding(step: .splash)
    }

    func signOut() async {
        try? await authService.signOut()
        await subscriptionService.clearIdentity()
        isPremium = false
        UserDefaults.standard.removeObject(forKey: "pendingReferralCode")
        UserDefaults.standard.removeObject(forKey: "frigy.cachedTargets.v1")
        tabCoordinator.popToRootAllTabs()
        onboardingCoordinator.resetForFreshOnboarding()
        rootRoute = .onboarding(step: .splash)
    }

    // MARK: - Private

    func isPaywallBypassed(for email: String) -> Bool {
        SupabaseConfig.paywallBypassEmails.contains(email.lowercased())
    }

    private func routeAfterOnboarding() async throws {
        guard let session = try await authService.currentSession() else {
            rootRoute = .auth
            return
        }

        // Ensure the store identity is linked before we read premium state.
        await subscriptionService.identify(userId: session.userId)

        if isPaywallBypassed(for: session.email) {
            isPremium = true
        } else {
            // Never downgrade a freshly-completed purchase: if the entitlement is
            // already active in this session, keep it even if the server lookup
            // hasn't caught up yet (avoids bouncing a user who just paid).
            let refreshed = try await subscriptionService.refreshPremiumState()
            isPremium = refreshed || isPremium
        }

        // Hard gate — Frigy has no free tier. Without an active entitlement the
        // user cannot enter the main app; route them to the paywall instead.
        guard isPremium else {
            onboardingCoordinator.skipToPaywall()
            rootRoute = .onboarding(step: .paywall)
            return
        }

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
            guard let session = try await authService.currentSession() else {
                authStatusMessage = "Session not available after OAuth callback."
                rootRoute = .auth
                return
            }

            // Link the store identity right after authentication so the upcoming
            // paywall purchase attaches to this Supabase user.
            await subscriptionService.identify(userId: session.userId)

            if onboardingCoordinator.isComplete {
                if isPaywallBypassed(for: session.email) {
                    isPremium = true
                } else {
                    let refreshed = try await subscriptionService.refreshPremiumState()
                    isPremium = refreshed || isPremium
                }

                // Hard gate — no free tier. Send non-entitled users to the paywall.
                guard isPremium else {
                    onboardingCoordinator.skipToPaywall()
                    rootRoute = .onboarding(step: .paywall)
                    return
                }

                rootRoute = .main
                flushPendingDeepLinkIfNeeded()
            } else {
                // Auth callback arrived during onboarding (email confirmation or OAuth).
                // Always jump straight to paywall regardless of the persisted step,
                // so the user never lands back on the Apple/Google/Email auth screen.
                onboardingCoordinator.resumeFromLastStep()
                onboardingCoordinator.skipToPaywall()
                rootRoute = .onboarding(step: .paywall)
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
