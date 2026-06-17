import Foundation

// MARK: - Modular rules (mitigates DefaultOnboardingRulesEngine drift)

/// Macro routing between high-level onboarding milestones.
struct MacroRouteOnboardingRules: OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? {
        switch step {
        case .welcome:
            return context.hasReferralCode ? .referralCode : .accountCreation
        case .referralCode:
            return .accountCreation
        case .accountCreation:
            return context.isAuthenticated ? .profileSetup : nil
        case .profileSetup:
            return .goalSelection
        case .goalSelection:
            return context.isPremium ? .done : .paywall
        case .paywall:
            return .done
        case .done:
            return nil
        default:
            return nil
        }
    }

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool { true }
}

/// Auth gates for protected steps.
struct AuthOnboardingRules: OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? { nil }

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool {
        switch step {
        case .profileSetup, .paywall:
            return context.isAuthenticated
        default:
            return true
        }
    }
}

/// Monetization gates — extension point for paywall variants / A/B.
struct MonetizationOnboardingRules: OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? { nil }

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool {
        switch step {
        case .paywall:
            return !context.isPremium || context.isAuthenticated
        default:
            return true
        }
    }
}

/// Referral entry rules — extension point for region-specific invite flows.
struct ReferralOnboardingRules: OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? { nil }

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool {
        switch step {
        case .referralCode:
            return true
        default:
            return true
        }
    }
}

/// Composes route + gate modules. Add new rule modules here instead of growing one switch.
struct CompositeOnboardingRulesEngine: OnboardingRulesEngine {
    private let route: OnboardingRulesEngine
    private let gates: [OnboardingRulesEngine]

    init(
        route: OnboardingRulesEngine = MacroRouteOnboardingRules(),
        gates: [OnboardingRulesEngine] = [
            AuthOnboardingRules(),
            MonetizationOnboardingRules(),
            ReferralOnboardingRules(),
        ]
    ) {
        self.route = route
        self.gates = gates
    }

    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? {
        route.nextStep(from: step, context: context)
    }

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool {
        gates.allSatisfy { $0.canEnter(step: step, context: context) }
    }
}

/// Default engine used by the coordinator — composite under the hood.
typealias DefaultOnboardingRulesEngine = CompositeOnboardingRulesEngine

enum StepGuard {
    static func validateTransition(
        from: OnboardingStep,
        to: OnboardingStep,
        context: OnboardingContext,
        rules: OnboardingRulesEngine
    ) -> Bool {
        guard rules.canEnter(step: to, context: context) else {
            return false
        }

        if isProtected(step: to) {
            return context.completedSteps.contains(from)
        }

        return true
    }

    private static func isProtected(step: OnboardingStep) -> Bool {
        switch step {
        case .accountCreation, .paywall:
            return true
        default:
            return false
        }
    }
}
