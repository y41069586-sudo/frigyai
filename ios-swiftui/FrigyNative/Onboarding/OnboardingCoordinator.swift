import Foundation

@MainActor
@Observable
final class OnboardingCoordinator {
    private(set) var currentStep: OnboardingStep = .splash
    var userData = OnboardingUserData.default

    private let persistence: OnboardingPersistenceProtocol

    init(persistence: OnboardingPersistenceProtocol = UserDefaultsOnboardingPersistence()) {
        self.persistence = persistence
    }

    var isComplete: Bool {
        persistence.isMarkedComplete() || currentStep == .done
    }

    var stepIndex: Int {
        OnboardingFlow.index(of: currentStep) ?? 0
    }

    var stepCount: Int {
        OnboardingFlow.activeSteps.count
    }

    var progressFraction: Double {
        guard stepCount > 0 else { return 0 }
        return Double(stepIndex + 1) / Double(stepCount)
    }

    var canGoBack: Bool {
        OnboardingFlow.back(before: currentStep) != nil
    }

    var canGoNext: Bool {
        OnboardingFlow.next(after: currentStep) != nil
    }

    // MARK: - Lifecycle

    func resumeFromLastStep() {
        guard !persistence.isMarkedComplete() else {
            currentStep = .done
            return
        }

        if let saved = persistence.load() {
            currentStep = saved.currentStep
            userData = saved.userData
            return
        }

        if let pendingRef = UserDefaults.standard.string(forKey: "pendingReferralCode"), !pendingRef.isEmpty {
            userData.referralCode = pendingRef
            if OnboardingFlow.index(of: .referralCode) != nil {
                currentStep = .referralCode
            }
        } else {
            currentStep = OnboardingFlow.activeSteps.first ?? .splash
        }
    }

    func persistState() {
        let snapshot = OnboardingPersistedState(
            currentStep: currentStep,
            userData: userData,
            updatedAt: Date()
        )
        persistence.save(snapshot)
    }

    // MARK: - Navigation

    @discardableResult
    func next() -> OnboardingStep {
        if currentStep == .macroPreview {
            userData.recalculateMacrosIfPossible()
        }

        if let nextStep = OnboardingFlow.next(after: currentStep) {
            currentStep = nextStep
        } else if currentStep == .paywall {
            currentStep = .done
        }

        persistState()
        return currentStep
    }

    @discardableResult
    func back() -> OnboardingStep {
        if let previous = OnboardingFlow.back(before: currentStep) {
            currentStep = previous
            persistState()
        }
        return currentStep
    }

    func jump(to step: OnboardingStep) {
        guard OnboardingFlow.index(of: step) != nil || step == .done else { return }
        currentStep = step
        persistState()
    }

    func applyPendingReferralCode(_ code: String?) {
        guard let code, !code.isEmpty else { return }
        userData.referralCode = code
        UserDefaults.standard.set(code, forKey: "pendingReferralCode")
        if OnboardingFlow.index(of: .referralCode) != nil {
            currentStep = .referralCode
        }
        persistState()
    }

    func markComplete() {
        currentStep = .done
        persistence.markComplete()
        UserDefaults.standard.removeObject(forKey: "pendingReferralCode")
    }

    func resetForDevelopment() {
        persistence.clear()
        userData = .default
        currentStep = .splash
    }
}
