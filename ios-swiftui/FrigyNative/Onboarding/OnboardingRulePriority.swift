import Foundation

// MARK: - Enforced rule priorities (not documentation-only)

enum OnboardingRulePriority {
    static let route = 0
    static let linearFlow = 5
    static let gateMinimum = 10
    static let gateAuth = 10
    static let gateMonetization = 20
    static let gateReferral = 30
    static let gateMaximum = 89
    static let stepGuard = 100

    static func validateGatePriority(_ priority: Int, moduleName: String) {
        precondition(
            (gateMinimum ... gateMaximum).contains(priority),
            "Gate module '\(moduleName)' priority \(priority) must be in \(gateMinimum)...\(gateMaximum)"
        )
    }
}

struct NamedOnboardingRules {
    let name: String
    let priority: Int
    let role: OnboardingRuleRole
    let engine: OnboardingRulesEngine

    init(name: String, priority: Int, role: OnboardingRuleRole, engine: OnboardingRulesEngine) {
        switch role {
        case .gate:
            OnboardingRulePriority.validateGatePriority(priority, moduleName: name)
        case .route:
            precondition(priority == OnboardingRulePriority.route, "Route module must use priority \(OnboardingRulePriority.route)")
        case .linearFlow:
            precondition(priority == OnboardingRulePriority.linearFlow, "Linear flow must use priority \(OnboardingRulePriority.linearFlow)")
        case .stepGuard:
            precondition(priority == OnboardingRulePriority.stepGuard, "StepGuard must use priority \(OnboardingRulePriority.stepGuard)")
        }

        self.name = name
        self.priority = priority
        self.role = role
        self.engine = engine
    }
}

enum OnboardingRulesPipeline {
    /// Sorts gates by ascending priority and rejects duplicates or non-gate modules.
    static func normalizeGates(_ gates: [NamedOnboardingRules]) -> [NamedOnboardingRules] {
        let onlyGates = gates.filter { module in
            guard module.role == .gate else {
                preconditionFailure("OnboardingRulesPipeline accepts gate modules only, found \(module.name) role=\(module.role)")
            }
            return true
        }

        let sorted = onlyGates.sorted {
            if $0.priority == $1.priority {
                preconditionFailure("Duplicate gate priority \($0.priority) for \($0.name) and \($1.name)")
            }
            return $0.priority < $1.priority
        }

        return sorted
    }
}
