import Foundation

@MainActor
@Observable
final class OnboardingCoordinator {
    private(set) var currentStep: OnboardingStep
    private(set) var context: OnboardingContext

    enum TransitionDirection { case forward, back }
    private(set) var transitionDirection: TransitionDirection = .forward

    private let persistence: OnboardingPersistenceProtocol
    private let rules: CompositeOnboardingRulesEngine
    private let telemetry: OnboardingFlowTelemetry

    // `persistence` / `telemetry` default to nil and are resolved inside this
    // (main-actor) init body — their @MainActor initializer / static can't be
    // referenced from a nonisolated default-argument context (Xcode 26 MainActor
    // default isolation).
    init(
        context: OnboardingContext = .initial,
        rules: CompositeOnboardingRulesEngine = DefaultOnboardingRulesEngine(),
        persistence: OnboardingPersistenceProtocol? = nil,
        telemetry: OnboardingFlowTelemetry? = nil,
        startStep: OnboardingStep = OnboardingFlow.macroEntryStep
    ) {
        self.context = context
        self.rules = rules
        self.persistence = persistence ?? UserDefaultsOnboardingPersistence()
        self.telemetry = telemetry ?? .shared
        self.currentStep = startStep
    }

    var userProfile: UserProfileDraft {
        get { context.userProfile ?? .empty }
        set { context.userProfile = newValue }
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

    var recentTraces: [OnboardingTransitionTrace] {
        telemetry.traces
    }

    // MARK: - External gate

    func refreshContext(using gate: OnboardingExternalGate) async {
        context.auth.isAuthenticated = await gate.isAuthenticated()
        context.auth.hasAccount = context.auth.isAuthenticated
        context.monetization.isPremium = await gate.isPremium()

        if let referral = gate.fetchReferral() {
            context.setReferralInput(referral, for: .localPending)
        }

        persistState()
    }

    // MARK: - Lifecycle

    func resumeFromLastStep() {
        let previous = currentStep

        guard !persistence.isMarkedComplete() else {
            currentStep = .done
            recordTrace(
                action: .resume,
                from: previous,
                to: .done,
                allowed: true,
                blockReason: nil,
                proposedSource: "marked_complete"
            )
            return
        }

        if let saved = persistence.load() {
            // Migrate the legacy ".welcome" feature-list entry screen (not part of the
            // web flow) to the mascot splash, so resumed users see the correct first screen.
            let restored = saved.currentStep == .welcome ? .splash : saved.currentStep
            // The flow gets reordered between builds (e.g. weeklyPlanPreview was
            // removed when the feature showcases moved to the front). A persisted
            // step that no longer exists in the flow would leave next() with no
            // successor — the user would be stuck on it forever. Restart such
            // users at the flow entry instead; their collected answers survive
            // in `context`, only the screen position resets.
            let knownSteps = Set(OnboardingFlow.detailedProfileSteps).union(
                [.splash, .accountCreation, .profileSetup, .goalSelection,
                 .paywall, .premiumHint, .themeChoice, .done]
            )
            currentStep = knownSteps.contains(restored) ? restored : OnboardingFlow.macroEntryStep
            context = saved.context
            recordTrace(
                action: .resume,
                from: previous,
                to: currentStep,
                allowed: true,
                blockReason: nil,
                proposedSource: "persisted_state"
            )
            return
        }

        context = .initial
        // Always enter at the mascot splash (matches the web onboarding). A pending
        // referral code is kept in context but no longer diverts to a separate screen.
        if let pendingRef = UserDefaults.standard.string(forKey: "pendingReferralCode"), !pendingRef.isEmpty {
            context.setReferralInput(pendingRef, for: .localPending)
        }
        currentStep = OnboardingFlow.macroEntryStep

        recordTrace(
            action: .resume,
            from: previous,
            to: currentStep,
            allowed: true,
            blockReason: nil,
            proposedSource: "cold_start"
        )
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
        transitionDirection = .forward
        let from = currentStep

        if currentStep == .macroPreview {
            // Keep user-adjusted macros; only auto-recalculate when untouched.
            if !userProfile.macrosManuallyEdited {
                userProfile.recalculateMacrosIfPossible()
            }
            context.userProfile = userProfile
        }

        guard let proposed = resolveProposedNextStep() else {
            complete()
            recordTrace(
                action: .next,
                from: from,
                to: .done,
                allowed: true,
                blockReason: nil,
                proposedSource: "complete()"
            )
            return currentStep
        }

        // Mark the current step complete BEFORE validating the transition.
        // Protected steps (accountCreation/paywall) require their `from` step to
        // be completed; inserting afterwards would deadlock the linear flow
        // (e.g. macroPreview → accountCreation could never proceed).
        context.completedSteps.insert(from)

        let explanation = rules.explainNext(from: from, context: context)
        let allowed = StepGuard.validateTransition(
            from: from,
            to: proposed,
            context: context,
            rules: rules
        )

        guard allowed else {
            recordTrace(
                action: .next,
                from: from,
                to: proposed,
                allowed: false,
                blockReason: flowDebugSnapshot().blockReason ?? "transition_blocked",
                proposedSource: explanation.decisions.first?.detail
            )
            return currentStep
        }

        currentStep = proposed
        persistState()

        recordTrace(
            action: .next,
            from: from,
            to: proposed,
            allowed: true,
            blockReason: nil,
            proposedSource: explanation.decisions.first?.result
        )
        return currentStep
    }

    @discardableResult
    func back() -> OnboardingStep {
        transitionDirection = .back
        let from = currentStep
        guard let previous = OnboardingFlow.back(before: currentStep) else {
            recordTrace(
                action: .back,
                from: from,
                to: nil,
                allowed: false,
                blockReason: "no_previous_step",
                proposedSource: nil
            )
            return currentStep
        }

        currentStep = previous
        persistState()
        recordTrace(
            action: .back,
            from: from,
            to: previous,
            allowed: true,
            blockReason: nil,
            proposedSource: "OnboardingFlow.back"
        )
        return currentStep
    }

    func jump(to step: OnboardingStep) {
        let from = currentStep
        let allowed = rules.canEnter(step: step, context: context)
        guard allowed else {
            recordTrace(
                action: .jump,
                from: from,
                to: step,
                allowed: false,
                blockReason: "canEnter denied",
                proposedSource: "jump"
            )
            return
        }

        currentStep = step
        persistState()
        recordTrace(
            action: .jump,
            from: from,
            to: step,
            allowed: true,
            blockReason: nil,
            proposedSource: "jump"
        )
    }

    func applyPendingReferralCode(_ code: String?) {
        guard let code, !code.isEmpty else { return }
        let from = currentStep
        context.setReferralInput(code, for: .deepLink)
        UserDefaults.standard.set(code, forKey: "pendingReferralCode")
        currentStep = .splash
        persistState()

        let suppressed = ReferralCodeResolver.suppressedAlternatives(context.referral.inputs)
            .map { "\($0.source.rawValue):\($0.code)" }
            .joined(separator: ",")
        let sourceDetail = context.referral.resolved.map { "source:\($0.source.rawValue)" }
        let proposedSource = [
            "referral_code:\(code)",
            sourceDetail,
            suppressed.isEmpty ? nil : "suppressed:\(suppressed)",
        ]
            .compactMap { $0 }
            .joined(separator: " ")

        recordTrace(
            action: .deepLink,
            from: from,
            to: .splash,
            allowed: true,
            blockReason: nil,
            proposedSource: proposedSource
        )
    }

    /// Called after the user successfully signs in during AccountCreation so the
    /// context reflects the new auth state before `next()` routes to paywall.
    func didAuthenticate() {
        context.auth.isAuthenticated = true
        context.auth.hasAccount = true
        persistState()
    }

    /// Called from the email-confirmation deep-link callback to bypass
    /// whatever step was persisted and land directly on the paywall.
    func skipToPaywall() {
        context.auth.isAuthenticated = true
        context.auth.hasAccount = true
        context.completedSteps.insert(.accountCreation)
        currentStep = .paywall
        persistState()
    }

    /// Clears all persisted onboarding state and restarts from the first step.
    /// Used when a returning user has no active session — they go through onboarding
    /// again and can sign in via the AccountCreation step.
    func resetForFreshOnboarding() {
        persistence.clear()
        context = .initial
        currentStep = OnboardingFlow.macroEntryStep
    }

    func markComplete() {
        let from = currentStep
        currentStep = .done
        context.completedSteps.insert(.paywall)
        persistence.markComplete()
        UserDefaults.standard.removeObject(forKey: "pendingReferralCode")
        recordTrace(
            action: .next,
            from: from,
            to: .done,
            allowed: true,
            blockReason: nil,
            proposedSource: "markComplete"
        )
    }

    #if DEBUG
    func resetForDevelopment() {
        persistence.clear()
        telemetry.clear()
        context = .initial
        currentStep = OnboardingFlow.macroEntryStep
    }

    func setAuthenticatedForDevelopment(_ value: Bool) {
        context.auth.isAuthenticated = value
        context.auth.hasAccount = value
        persistState()
    }
    #endif

    func flowDebugSnapshot() -> OnboardingFlowDebugSnapshot {
        OnboardingFlowDebugger.snapshot(
            currentStep: currentStep,
            context: context,
            rules: rules
        )
    }

    func exportTelemetryJSON() -> String? {
        telemetry.exportJSON()
    }

    // MARK: - Private

    private func resolveProposedNextStep() -> OnboardingStep? {
        rules.explainNext(from: currentStep, context: context).chosen
    }

    private func complete() {
        currentStep = .done
        persistState()
    }

    private func recordTrace(
        action: OnboardingTransitionAction,
        from: OnboardingStep,
        to: OnboardingStep?,
        allowed: Bool,
        blockReason: String?,
        proposedSource: String?
    ) {
        let decisions = rules.explainTransition(from: from, to: to, context: context)
        telemetry.record(
            OnboardingTransitionTrace(
                id: UUID(),
                timestamp: Date(),
                action: action,
                from: from,
                to: to,
                flowLayer: OnboardingFlowDebugger.snapshot(
                    currentStep: from,
                    context: context,
                    rules: rules
                ).flowLayer,
                allowed: allowed,
                blockReason: blockReason,
                proposedSource: proposedSource,
                decisions: decisions,
                contextSnapshot: OnboardingTelemetryContextSnapshot(context: context)
            )
        )
    }
}
