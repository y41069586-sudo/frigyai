import Foundation

protocol OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep?
    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool
}

final class DefaultOnboardingRulesEngine: OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? {
        switch step {
        case .welcome:
            return context.hasReferralCode ? .referralCode : .accountCreation

        case .accountCreation:
            return context.isAuthenticated ? .profileSetup : nil

        case .referralCode:
            return .accountCreation

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

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool {
        switch step {
        case .paywall:
            return context.isAuthenticated

        case .profileSetup:
            return context.isAuthenticated

        case .referralCode:
            return true

        default:
            return true
        }
    }
}

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
