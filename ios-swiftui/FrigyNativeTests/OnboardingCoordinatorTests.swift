import Foundation
import Testing
@testable import FrigyNative

struct OnboardingRulesEngineTests {
    @Test func welcomeRoutesToReferralWhenCodePresent() {
        let engine = DefaultOnboardingRulesEngine()
        var context = OnboardingContext.initial
        context.hasReferralCode = true

        let next = engine.nextStep(from: .welcome, context: context)
        #expect(next == .referralCode)
    }

    @Test func welcomeRoutesToAccountCreationWithoutReferral() {
        let engine = DefaultOnboardingRulesEngine()
        let next = engine.nextStep(from: .welcome, context: .initial)
        #expect(next == .accountCreation)
    }

    @Test func paywallRequiresAuthentication() {
        let engine = DefaultOnboardingRulesEngine()
        var guest = OnboardingContext.initial
        guest.isAuthenticated = false
        #expect(engine.canEnter(step: .paywall, context: guest) == false)

        var authed = OnboardingContext.initial
        authed.isAuthenticated = true
        #expect(engine.canEnter(step: .paywall, context: authed) == true)
    }

    @Test func stepGuardBlocksProtectedWithoutCompletion() {
        var context = OnboardingContext.initial
        context.isAuthenticated = true
        let engine = DefaultOnboardingRulesEngine()

        let allowed = StepGuard.validateTransition(
            from: .welcome,
            to: .accountCreation,
            context: context,
            rules: engine
        )
        #expect(allowed == false)
    }

    @Test func premiumSkipsPaywall() {
        let engine = DefaultOnboardingRulesEngine()
        var context = OnboardingContext.initial
        context.isPremium = true
        let next = engine.nextStep(from: .goalSelection, context: context)
        #expect(next == .done)
    }
}

struct OnboardingCoordinatorTests {
    @Test @MainActor func resumeFromPersistedStep() async throws {
        let persistence = InMemoryOnboardingPersistence()
        var context = OnboardingContext.initial
        context.isAuthenticated = true
        persistence.seed(
            OnboardingPersistedState(
                currentStep: .weight,
                context: context,
                updatedAt: Date()
            )
        )

        let coordinator = OnboardingCoordinator(persistence: persistence)
        coordinator.resumeFromLastStep()

        #expect(coordinator.currentStep == .weight)
    }

    @Test @MainActor func rulesWelcomeToAccountCreation() async throws {
        let coordinator = OnboardingCoordinator(persistence: InMemoryOnboardingPersistence())
        coordinator.resumeFromLastStep()
        #expect(coordinator.currentStep == .welcome)

        let next = coordinator.next()
        #expect(next == .accountCreation)
    }

    @Test @MainActor func referralDeepLinkSetsWelcomeWithCode() async throws {
        let coordinator = OnboardingCoordinator(persistence: InMemoryOnboardingPersistence())
        coordinator.resumeFromLastStep()
        coordinator.applyPendingReferralCode("INVITE42")

        #expect(coordinator.currentStep == .welcome)
        #expect(coordinator.userProfile.referralCode == "INVITE42")
        #expect(coordinator.context.hasReferralCode)
    }

    @Test @MainActor func persistAndResumeAfterCrash() async throws {
        let persistence = InMemoryOnboardingPersistence()
        let coordinator = OnboardingCoordinator(persistence: persistence)
        coordinator.resumeFromLastStep()
        coordinator.context.isAuthenticated = true
        _ = coordinator.next()
        coordinator.persistState()

        let restored = OnboardingCoordinator(persistence: persistence)
        restored.resumeFromLastStep()
        #expect(restored.currentStep == coordinator.currentStep)
        #expect(restored.context.isAuthenticated)
    }

    @Test @MainActor func profileSetupEntersDetailedFlow() async throws {
        let coordinator = OnboardingCoordinator(persistence: InMemoryOnboardingPersistence())
        coordinator.resumeFromLastStep()
        coordinator.context.isAuthenticated = true
        coordinator.jump(to: .profileSetup)

        let next = coordinator.next()
        #expect(next == .gender)
    }

    @Test @MainActor func markCompleteClearsPersistedState() async throws {
        let persistence = InMemoryOnboardingPersistence()
        let coordinator = OnboardingCoordinator(persistence: persistence)
        coordinator.resumeFromLastStep()
        coordinator.markComplete()

        #expect(persistence.isMarkedComplete())
        #expect(persistence.load() == nil)
    }
}

/// Test double — in-memory persistence for coordinator tests.
final class InMemoryOnboardingPersistence: OnboardingPersistenceProtocol {
    private var snapshot: OnboardingPersistedState?
    private var complete = false

    func seed(_ state: OnboardingPersistedState) {
        snapshot = state
    }

    func load() -> OnboardingPersistedState? { snapshot }

    func save(_ state: OnboardingPersistedState) {
        snapshot = state
        complete = false
    }

    func clear() {
        snapshot = nil
        complete = false
    }

    func isMarkedComplete() -> Bool { complete }

    func markComplete() {
        complete = true
        snapshot = nil
    }
}
