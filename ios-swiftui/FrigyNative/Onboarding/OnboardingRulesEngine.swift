import Foundation

protocol OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep?
    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool
}
