import Foundation
import Testing
@testable import FrigyNative

struct OnboardingRulesEngineTests {
    @Test func welcomeRoutesToReferralWhenCodePresent() {
        let engine = CompositeOnboardingRulesEngine()
        var context = OnboardingContext.initial
        context.setReferralInput("REF", for: .localPending)

        let next = engine.nextStep(from: .welcome, context: context)
        #expect(next == .referralCode)
    }

    @Test func welcomeRoutesToAccountCreationWithoutReferral() {
        let engine = CompositeOnboardingRulesEngine()
        let next = engine.nextStep(from: .welcome, context: .initial)
        #expect(next == .accountCreation)
    }

    @Test func paywallRequiresAuthentication() {
        let engine = CompositeOnboardingRulesEngine()
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
        let engine = CompositeOnboardingRulesEngine()

        let allowed = StepGuard.validateTransition(
            from: .welcome,
            to: .accountCreation,
            context: context,
            rules: engine
        )
        #expect(allowed == false)
    }

    @Test func premiumSkipsPaywall() {
        let engine = CompositeOnboardingRulesEngine()
        var context = OnboardingContext.initial
        context.monetization.isPremium = true
        let next = engine.nextStep(from: .goalSelection, context: context)
        #expect(next == .done)
    }

    @Test func flowDebuggerIdentifiesDetailLayer() {
        var context = OnboardingContext.initial
        context.auth.isAuthenticated = true
        let snapshot = OnboardingFlowDebugger.snapshot(
            currentStep: .weight,
            context: context,
            rules: CompositeOnboardingRulesEngine()
        )
        #expect(snapshot.flowLayer == .detailedProfile)
        #expect(snapshot.proposedNext == .height)
        #expect(snapshot.proposedSource == "OnboardingFlow linear")
    }

    @Test func normalizeGatesSortsRegardlessOfInjectionOrder() {
        let shuffled: [NamedOnboardingRules] = [
            NamedOnboardingRules(
                name: "Referral",
                priority: OnboardingRulePriority.gateReferral,
                role: .gate,
                engine: ReferralOnboardingRules()
            ),
            NamedOnboardingRules(
                name: "Auth",
                priority: OnboardingRulePriority.gateAuth,
                role: .gate,
                engine: AuthOnboardingRules()
            ),
            NamedOnboardingRules(
                name: "Monetization",
                priority: OnboardingRulePriority.gateMonetization,
                role: .gate,
                engine: MonetizationOnboardingRules()
            ),
        ]

        let sorted = OnboardingRulesPipeline.normalizeGates(shuffled)
        #expect(sorted.map(\.name) == ["Auth", "Monetization", "Referral"])
    }

    @Test func compositeEngineAcceptsUnsortedGateInjection() {
        let shuffled: [NamedOnboardingRules] = [
            NamedOnboardingRules(
                name: "Referral",
                priority: OnboardingRulePriority.gateReferral,
                role: .gate,
                engine: ReferralOnboardingRules()
            ),
            NamedOnboardingRules(
                name: "Auth",
                priority: OnboardingRulePriority.gateAuth,
                role: .gate,
                engine: AuthOnboardingRules()
            ),
            NamedOnboardingRules(
                name: "Monetization",
                priority: OnboardingRulePriority.gateMonetization,
                role: .gate,
                engine: MonetizationOnboardingRules()
            ),
        ]

        let engine = CompositeOnboardingRulesEngine(gates: shuffled)
        var guest = OnboardingContext.initial
        guest.isAuthenticated = false
        #expect(engine.canEnter(step: .paywall, context: guest) == false)
    }

    @Test func referralResolverPrefersDeepLinkOverLocalPending() {
        var context = OnboardingContext.initial
        context.setReferralInput("LOCAL", for: .localPending)
        context.setReferralInput("DEEP", for: .deepLink)

        #expect(context.referral.resolved?.code == "DEEP")
        #expect(context.referral.resolved?.source == .deepLink)
        #expect(context.userProfile?.referralCode == "DEEP")
    }

    @Test func referralResolverPrefersBackendOverDeepLink() {
        var context = OnboardingContext.initial
        context.setReferralInput("DEEP", for: .deepLink)
        context.setReferralInput("BACKEND", for: .backendAttribution)

        #expect(context.referral.resolved?.code == "BACKEND")
        #expect(context.referral.resolved?.source == .backendAttribution)
    }

    @Test func referralResolverReportsSuppressedAlternatives() {
        var context = OnboardingContext.initial
        context.setReferralInput("LOCAL", for: .localPending)
        context.setReferralInput("DEEP", for: .deepLink)

        let suppressed = ReferralCodeResolver.suppressedAlternatives(context.referral.inputs)
        #expect(suppressed.count == 1)
        #expect(suppressed.first?.code == "LOCAL")
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
        #expect(coordinator.context.referral.resolved?.source == .deepLink)
    }

    @Test @MainActor func referralDeepLinkTelemetryIncludesSuppressedSources() async throws {
        let telemetry = OnboardingFlowTelemetry()
        let coordinator = OnboardingCoordinator(telemetry: telemetry)
        coordinator.resumeFromLastStep()
        coordinator.context.setReferralInput("OLDLOCAL", for: .localPending)
        coordinator.applyPendingReferralCode("INVITE42")

        let trace = telemetry.traces.last
        #expect(trace?.proposedSource?.contains("suppressed:") == true)
        #expect(trace?.contextSnapshot.referralSource == ReferralSource.deepLink.rawValue)
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
        let telemetry = OnboardingFlowTelemetry()
        let coordinator = OnboardingCoordinator(
            persistence: persistence,
            telemetry: telemetry
        )
        coordinator.resumeFromLastStep()
        coordinator.markComplete()

        #expect(persistence.isMarkedComplete())
        #expect(persistence.load() == nil)
        #expect(telemetry.traces.isEmpty == false)
    }

    @Test @MainActor func telemetryRecordsRuleProvenanceOnNext() async throws {
        let telemetry = OnboardingFlowTelemetry()
        let coordinator = OnboardingCoordinator(telemetry: telemetry)
        coordinator.resumeFromLastStep()
        _ = coordinator.next()

        let trace = telemetry.traces.last
        #expect(trace?.action == .next)
        #expect(trace?.from == .welcome)
        #expect(trace?.to == .accountCreation)
        #expect(trace?.decisions.contains { $0.module == "MacroRoute" } == true)
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
