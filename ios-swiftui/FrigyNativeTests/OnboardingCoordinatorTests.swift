import Foundation
import Testing
@testable import FrigyNative

struct OnboardingCoordinatorTests {
    @Test @MainActor func resumeFromPersistedStep() async throws {
        let persistence = InMemoryOnboardingPersistence()
        persistence.seed(
            OnboardingPersistedState(
                currentStep: .weight,
                userData: .default,
                updatedAt: Date()
            )
        )

        let coordinator = OnboardingCoordinator(persistence: persistence)
        coordinator.resumeFromLastStep()

        #expect(coordinator.currentStep == .weight)
        #expect(coordinator.stepIndex == OnboardingFlow.index(of: .weight))
    }

    @Test @MainActor func nextAndBackWithinActiveFlow() async throws {
        let coordinator = OnboardingCoordinator(persistence: InMemoryOnboardingPersistence())
        coordinator.resumeFromLastStep()
        #expect(coordinator.currentStep == .splash)

        let next = coordinator.next()
        #expect(next == .gender)

        let back = coordinator.back()
        #expect(back == .splash)
    }

    @Test @MainActor func referralDeepLinkJumpsToReferralStep() async throws {
        let coordinator = OnboardingCoordinator(persistence: InMemoryOnboardingPersistence())
        coordinator.resumeFromLastStep()
        coordinator.applyPendingReferralCode("INVITE42")

        #expect(coordinator.currentStep == .referralCode)
        #expect(coordinator.userData.referralCode == "INVITE42")
    }

    @Test @MainActor func persistAndResumeAfterCrash() async throws {
        let persistence = InMemoryOnboardingPersistence()
        let coordinator = OnboardingCoordinator(persistence: persistence)
        coordinator.resumeFromLastStep()
        _ = coordinator.next()
        _ = coordinator.next()
        coordinator.persistState()

        let restored = OnboardingCoordinator(persistence: persistence)
        restored.resumeFromLastStep()
        #expect(restored.currentStep == coordinator.currentStep)
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
