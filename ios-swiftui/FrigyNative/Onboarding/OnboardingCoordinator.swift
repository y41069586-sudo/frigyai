import Foundation

@MainActor
@Observable
final class OnboardingCoordinator {
    private(set) var currentStep: OnboardingStep
    private(set) var context: OnboardingContext

    private let persistence: OnboardingPersistenceProtocol
    private let rules: OnboardingRulesEngine

    init(
        context: OnboardingContext = .initial,
        rules: OnboardingRulesEngine = DefaultOnboardingRulesEngine(),
        persistence: OnboardingPersistenceProtocol = UserDefaultsOnboardingPersistence(),
        startStep: OnboardingStep = OnboardingFlow.macroEntryStep
    ) {
        self.context = context
        self.rules = rules
        self.persistence = persistence
        self.currentStep = startStep
    }

    var userProfile: UserProfileDraft {
        get { context.userProfile ?? .empty }
        set {
            context.userProfile = newValue
            context.syncReferralFlag()
        }
    }

    var isComplete: Bool {
        persistence.isMarkedComplete() || currentStep == .done
    }

    var stepIndex: Int {
        OnboardingFlow.index(of: currentStep) ?? 0
    }

    var stepCount: Int {
        OnboardingFlow.detailedProfileSteps.count + 4
    }

    var progressFraction: Double {
        guard stepCount > 0 else { return 0 }
        return Double(min(stepIndex + 1, stepCount)) / Double(stepCount)
    }

    var canGoBack: Bool {
        OnboardingFlow.back(before: currentStep) != nil
    }

    var canGoNext: Bool {
        resolveProposedNextStep() != nil || currentStep == .paywall
    }

    // MARK: - External gate

    func refreshContext(using gate: OnboardingExternalGate) async {
        context.isAuthenticated = await gate.isAuthenticated()
        context.hasAccount = context.isAuthenticated
        context.isPremium = await gate.isPremium()

        if let referral = gate.fetchReferral() {
            var profile = userProfile
            profile.referralCode = referral
            userProfile = profile
        }

        context.syncReferralFlag()
        persistState()
    }

    // MARK: - Lifecycle

    func resumeFromLastStep() {
        guard !persistence.isMarkedComplete() else {
            currentStep = .done
            return
        }

        if let saved = persistence.load() {
            currentStep = saved.currentStep
            context = saved.context
            context.syncReferralFlag()
            return
        }

        context = .initial
        if let pendingRef = UserDefaults.standard.string(forKey: "pendingReferralCode"), !pendingRef.isEmpty {
            var profile = userProfile
            profile.referralCode = pendingRef
            userProfile = profile
            currentStep = .welcome
        } else {
            currentStep = OnboardingFlow.macroEntryStep
        }
    }

    func persistState() {
        let snapshot = OnboardingPersistedState(
            currentStep: currentStep,
            context: context,
            updatedAt: Date()
        )
        persistence.save(snapshot)
    }

    // MARK: - Navigation

    @discardableResult
    func next() -> OnboardingStep {
        if currentStep == .macroPreview {
            userProfile.recalculateMacrosIfPossible()
            context.userProfile = userProfile
        }

        if currentStep == .profileSetup {
            currentStep = OnboardingFlow.detailedProfileSteps.first ?? .gender
            persistState()
            return currentStep
        }

        guard let proposed = resolveProposedNextStep() else {
            complete()
            return currentStep
        }

        guard StepGuard.validateTransition(
            from: currentStep,
            to: proposed,
            context: context,
            rules: rules
        ) else {
            return currentStep
        }

        context.completedSteps.insert(currentStep)
        currentStep = proposed
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
        guard rules.canEnter(step: step, context: context) else { return }
        currentStep = step
        persistState()
    }

    func applyPendingReferralCode(_ code: String?) {
        guard let code, !code.isEmpty else { return }
        var profile = userProfile
        profile.referralCode = code
        userProfile = profile
        UserDefaults.standard.set(code, forKey: "pendingReferralCode")
        currentStep = .welcome
        persistState()
    }

    func markComplete() {
        currentStep = .done
        context.completedSteps.insert(.paywall)
        persistence.markComplete()
        UserDefaults.standard.removeObject(forKey: "pendingReferralCode")
    }

    func resetForDevelopment() {
        persistence.clear()
        context = .initial
        currentStep = OnboardingFlow.macroEntryStep
    }

    func setAuthenticatedForDevelopment(_ value: Bool) {
        context.isAuthenticated = value
        context.hasAccount = value
        persistState()
    }

    // MARK: - Private

    private func resolveProposedNextStep() -> OnboardingStep? {
        if OnboardingFlow.isDetailedProfileStep(currentStep),
           let linear = OnboardingFlow.next(after: currentStep) {
            return linear
        }

        if let rulesNext = rules.nextStep(from: currentStep, context: context) {
            return rulesNext
        }

        if currentStep == .paywall {
            return .done
        }

        return nil
    }

    private func complete() {
        currentStep = .done
        persistState()
    }
}
