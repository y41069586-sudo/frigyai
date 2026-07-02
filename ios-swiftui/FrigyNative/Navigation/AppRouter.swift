import Foundation
import SwiftUI

@MainActor
@Observable
final class AppRouter {
    private static let isPremiumCacheKey = "frigy.isPremium.cached.v1"

    var rootRoute: AppRoute = .loading
    // Seeded from the last known entitlement state so a cold relaunch right after
    // a successful purchase (before the network refresh completes) doesn't briefly
    // show the paywall to a user who already paid.
    var isPremium = UserDefaults.standard.bool(forKey: AppRouter.isPremiumCacheKey) {
        didSet {
            UserDefaults.standard.set(isPremium, forKey: Self.isPremiumCacheKey)
        }
    }
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

        #if canImport(RevenueCat)
        // RevenueCat's own recommended integration pattern: react to entitlement
        // changes as the SDK learns about them (purchase, restore, renewal,
        // cancellation, a delayed server-side sync, family sharing, ...) instead
        // of only checking at specific moments we remember to poll. This is the
        // authoritative source of truth for `isPremium` from here on.
        (self.subscriptionService as? RevenueCatSubscriptionService)?.onPremiumStatusChanged = { [weak self] isPremium in
            self?.isPremium = isPremium
        }
        #endif
    }

    func bootstrap() async {
        rootRoute = .loading
        authStatusMessage = nil

        do {
            let session = try await authService.restoreSession()

            // An active session means the user ALREADY created their account, which
            // is one of the LAST onboarding steps (…→ macroPreview → accountCreation
            // → paywall → done). So a signed-in user is by definition a returning
            // user and must never be dropped back into onboarding — even if the local
            // `onboardingComplete` flag is missing (older builds could clear it via
            // resetForFreshOnboarding, which is exactly the "logged in but back on
            // onboarding" bug). Heal the flag and route via the normal path (main
            // app, or the paywall if not premium).
            if let session {
                await subscriptionService.identify(userId: session.userId)
                if !onboardingCoordinator.isComplete {
                    onboardingCoordinator.markComplete()
                }
                try await routeAfterOnboarding()
                return
            }

            // No active session. If they finished onboarding before, send them to
            // sign-in (keeps all data); after re-login routeAfterOnboarding restores
            // premium via RevenueCat. Previously we wiped everything and forced a
            // brand-new onboarding.
            if onboardingCoordinator.isComplete {
                rootRoute = .auth
                return
            }

            onboardingCoordinator.resumeFromLastStep()
            await onboardingCoordinator.refreshContext(using: makeOnboardingGate())
            applyQueuedReferralIfNeeded()
            rootRoute = .onboarding(step: onboardingCoordinator.currentStep)
            flushPendingDeepLinkWhileOnboarding()
        } catch {
            // A user who already finished onboarding should re-authenticate, not be
            // dropped back into onboarding.
            if onboardingCoordinator.isComplete {
                rootRoute = .auth
                return
            }
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
        // Re-assert the RevenueCat ↔ Supabase user link on every foreground. This
        // is what makes a purchase visible to the SERVER-side premium check
        // (check-subscription queries RevenueCat by the Supabase user id). If the
        // purchase originally landed on an anonymous RevenueCat user, logIn here
        // transfers it to the Supabase user, so server-gated features like the
        // weekly meal plan start working even though the on-device SDK already
        // reported premium.
        if let session = try? await authService.currentSession() {
            await subscriptionService.identify(userId: session.userId)
            if isPaywallBypassed(for: session.email) {
                isPremium = true
                return
            }
        }
        guard let current = try? await subscriptionService.refreshPremiumState() else { return }
        if current {
            isPremium = true
            return
        }
        // Don't downgrade immediately: RevenueCat's entitlement can lag receipt
        // validation for a few seconds right after a fresh purchase, and a
        // foreground refresh landing in that exact window (e.g. the user briefly
        // switches apps right after paying) would otherwise wrongly revoke access
        // they just bought — they'd suddenly find Premium features like the
        // weekly plan locked again. Give it one short confirmation window before
        // accepting the downgrade; a genuinely cancelled/expired subscription
        // still reliably shows inactive after it.
        guard isPremium else {
            isPremium = current
            return
        }
        try? await Task.sleep(nanoseconds: 4_000_000_000)
        isPremium = (try? await subscriptionService.refreshPremiumState()) ?? current
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
            // hasn't caught up yet (avoids bouncing a user who just paid). Using
            // `try?` here is deliberate — a transient network error on this refresh
            // must NOT throw out of routeAfterOnboarding() and bounce a user who
            // just paid back to the auth screen instead of the dashboard.
            let refreshed = (try? await subscriptionService.refreshPremiumState()) ?? false
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
                    // Same rationale as routeAfterOnboarding(): don't let a transient
                    // network error on this refresh bounce an already-premium user.
                    let refreshed = (try? await subscriptionService.refreshPremiumState()) ?? false
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
