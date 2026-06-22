import Foundation

// MARK: - Traced rules evaluation

struct OnboardingRulesExplanation {
    var chosen: OnboardingStep?
    var alternatives: [OnboardingStep]
    var decisions: [OnboardingRuleDecision]
}

/// Execution order (documented):
/// 1. **Route** (`MacroRouteOnboardingRules`, priority 0) — proposes macro `nextStep`
/// 2. **Linear flow** (`OnboardingFlow`, priority 5) — proposes detail `nextStep` when inside profile collection
/// 3. **Gates** (priority 10+) — evaluated in array order; **all** must allow entry:
///    - `AuthOnboardingRules` (10)
///    - `MonetizationOnboardingRules` (20)
///    - `ReferralOnboardingRules` (30)
/// 4. **StepGuard** (priority 100) — protected-step completion check
struct CompositeOnboardingRulesEngine: OnboardingRulesEngine {
    private let routeModule: NamedOnboardingRules
    private let gateModules: [NamedOnboardingRules]

    init(
        route: OnboardingRulesEngine = MacroRouteOnboardingRules(),
        gates: [NamedOnboardingRules]? = nil
    ) {
        self.routeModule = NamedOnboardingRules(
            name: "MacroRoute",
            priority: OnboardingRulePriority.route,
            role: .route,
            engine: route
        )
        self.gateModules = OnboardingRulesPipeline.normalizeGates(gates ?? Self.makeDefaultGates())
    }

    static func makeDefaultGates() -> [NamedOnboardingRules] {
        [
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
            NamedOnboardingRules(
                name: "Referral",
                priority: OnboardingRulePriority.gateReferral,
                role: .gate,
                engine: ReferralOnboardingRules()
            ),
        ]
    }

    @available(*, deprecated, renamed: "makeDefaultGates()")
    static var defaultGates: [NamedOnboardingRules] { makeDefaultGates() }

    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? {
        explainNext(from: step, context: context).chosen
    }

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool {
        explainCanEnter(step: step, context: context).allowed
    }

    func explainNext(from step: OnboardingStep, context: OnboardingContext) -> OnboardingRulesExplanation {
        if step == .profileSetup {
            let chosen = OnboardingFlow.detailedProfileSteps.first
            return OnboardingRulesExplanation(
                chosen: chosen,
                alternatives: [],
                decisions: [
                    OnboardingRuleDecision(
                        module: "OnboardingFlow",
                        role: .linearFlow,
                        priority: 5,
                        result: "enter_detail",
                        detail: "profileSetup → \(chosen?.rawValue ?? "nil")"
                    ),
                ]
            )
        }

        if OnboardingFlow.isDetailedProfileStep(step), let linear = OnboardingFlow.next(after: step) {
            return OnboardingRulesExplanation(
                chosen: linear,
                alternatives: [],
                decisions: [
                    OnboardingRuleDecision(
                        module: "OnboardingFlow",
                        role: .linearFlow,
                        priority: 5,
                        result: "linear_next",
                        detail: "\(step.rawValue) → \(linear.rawValue)"
                    ),
                ]
            )
        }

        let chosen = routeModule.engine.nextStep(from: step, context: context)
        var alternatives: [OnboardingStep] = []
        var detail: String?

        if step == .splash {
            alternatives = OnboardingFlow.detailedProfileSteps.first.map { [$0] } ?? []
        } else if step == .welcome {
            alternatives = context.hasReferralCode ? [.accountCreation] : [.referralCode]
            detail = context.hasReferralCode ? "hasReferralCode=true" : "hasReferralCode=false"
        } else if step == .goalSelection {
            alternatives = context.isPremium ? [.paywall] : [.done]
            detail = context.isPremium ? "isPremium=true" : "isPremium=false"
        }

        if step == .paywall, chosen == nil {
            return OnboardingRulesExplanation(
                chosen: .done,
                alternatives: [],
                decisions: [
                    OnboardingRuleDecision(
                        module: "Coordinator",
                        role: .route,
                        priority: 1,
                        result: "paywall_fallback",
                        detail: "paywall → done"
                    ),
                ]
            )
        }

        return OnboardingRulesExplanation(
            chosen: chosen,
            alternatives: alternatives,
            decisions: [
                OnboardingRuleDecision(
                    module: routeModule.name,
                    role: .route,
                    priority: routeModule.priority,
                    result: chosen.map { "route_to:\($0.rawValue)" } ?? "no_route",
                    detail: detail
                ),
            ]
        )
    }

    func explainCanEnter(step: OnboardingStep, context: OnboardingContext) -> (allowed: Bool, decisions: [OnboardingRuleDecision]) {
        var decisions: [OnboardingRuleDecision] = []

        for module in gateModules {
            let allowed = module.engine.canEnter(step: step, context: context)
            decisions.append(
                OnboardingRuleDecision(
                    module: module.name,
                    role: .gate,
                    priority: module.priority,
                    result: allowed ? "allow" : "deny",
                    detail: allowed ? nil : "blocked entry to \(step.rawValue)"
                )
            )
            if !allowed {
                return (false, decisions)
            }
        }

        return (true, decisions)
    }

    func explainTransition(
        from: OnboardingStep,
        to proposed: OnboardingStep?,
        context: OnboardingContext
    ) -> [OnboardingRuleDecision] {
        var decisions = explainNext(from: from, context: context).decisions

        if let proposed {
            let gateEval = explainCanEnter(step: proposed, context: context)
            decisions.append(contentsOf: gateEval.decisions)

            let guardAllowed = StepGuard.validateTransition(
                from: from,
                to: proposed,
                context: context,
                rules: self
            )
            decisions.append(
                OnboardingRuleDecision(
                    module: "StepGuard",
                    role: .stepGuard,
                    priority: 100,
                    result: guardAllowed ? "allow" : "deny",
                    detail: guardAllowed ? nil : "protected transition \(from.rawValue) → \(proposed.rawValue)"
                )
            )
        }

        return decisions
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

// MARK: - Macro / domain rule modules

/// Macro routing between high-level onboarding milestones.
struct MacroRouteOnboardingRules: OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? {
        switch step {
        case .splash:
            return OnboardingFlow.detailedProfileSteps.first
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

struct ReferralOnboardingRules: OnboardingRulesEngine {
    func nextStep(from step: OnboardingStep, context: OnboardingContext) -> OnboardingStep? { nil }

    func canEnter(step: OnboardingStep, context: OnboardingContext) -> Bool { true }
}
