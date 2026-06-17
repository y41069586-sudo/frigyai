import Foundation

// MARK: - Flow debug model (mitigates dual-flow confusion)

enum OnboardingFlowLayer: String, Equatable {
    case macro
    case detailedProfile
    case terminal
}

struct OnboardingFlowEdge: Identifiable, Equatable {
    let id: String
    let from: OnboardingStep
    let to: OnboardingStep
    let label: String

    init(from: OnboardingStep, to: OnboardingStep, label: String) {
        self.id = "\(from.rawValue)→\(to.rawValue)"
        self.from = from
        self.to = to
        self.label = label
    }
}

struct OnboardingFlowDebugSnapshot: Equatable {
    var currentStep: OnboardingStep
    var flowLayer: OnboardingFlowLayer
    var proposedNext: OnboardingStep?
    var proposedSource: String?
    var isTransitionAllowed: Bool
    var blockReason: String?
    var completedSteps: [OnboardingStep]
    var macroEdges: [OnboardingFlowEdge]
    var detailedEdges: [OnboardingFlowEdge]
    var highlightedEdgeIDs: Set<String>
}

enum OnboardingFlowGraph {
    static let macroEdges: [OnboardingFlowEdge] = [
        OnboardingFlowEdge(from: .welcome, to: .referralCode, label: "has referral"),
        OnboardingFlowEdge(from: .welcome, to: .accountCreation, label: "no referral"),
        OnboardingFlowEdge(from: .referralCode, to: .accountCreation, label: "continue"),
        OnboardingFlowEdge(from: .accountCreation, to: .profileSetup, label: "authenticated"),
        OnboardingFlowEdge(from: .profileSetup, to: .goalSelection, label: "macro"),
        OnboardingFlowEdge(from: .profileSetup, to: .gender, label: "enter detail"),
        OnboardingFlowEdge(from: .macroPreview, to: .accountCreation, label: "detail exit"),
        OnboardingFlowEdge(from: .goalSelection, to: .paywall, label: "!premium"),
        OnboardingFlowEdge(from: .goalSelection, to: .done, label: "premium"),
        OnboardingFlowEdge(from: .paywall, to: .done, label: "complete"),
    ]

    static var detailedEdges: [OnboardingFlowEdge] {
        zip(OnboardingFlow.detailedProfileSteps, OnboardingFlow.detailedProfileSteps.dropFirst()).map { from, to in
            OnboardingFlowEdge(from: from, to: to, label: "detail")
        }
    }
}

enum OnboardingFlowDebugger {
    static func snapshot(
        currentStep: OnboardingStep,
        context: OnboardingContext,
        rules: OnboardingRulesEngine
    ) -> OnboardingFlowDebugSnapshot {
        let layer = layer(for: currentStep)
        let (proposed, source) = resolveProposedNext(from: currentStep, context: context, rules: rules)

        var blockReason: String?
        var allowed = true

        if let proposed {
            allowed = StepGuard.validateTransition(
                from: currentStep,
                to: proposed,
                context: context,
                rules: rules
            )
            if !rules.canEnter(step: proposed, context: context) {
                blockReason = "Rules engine blocked entry to \(proposed.rawValue)"
            } else if StepGuard.validateTransition(from: currentStep, to: proposed, context: context, rules: rules) == false {
                blockReason = "StepGuard blocked \(currentStep.rawValue) → \(proposed.rawValue)"
            }
        } else if currentStep != .done && currentStep != .paywall {
            blockReason = "No proposed next step"
            allowed = false
        }

        let highlights = highlightEdges(current: currentStep, proposed: proposed)

        return OnboardingFlowDebugSnapshot(
            currentStep: currentStep,
            flowLayer: layer,
            proposedNext: proposed,
            proposedSource: source,
            isTransitionAllowed: allowed,
            blockReason: blockReason,
            completedSteps: context.completedSteps.sorted { $0.rawValue < $1.rawValue },
            macroEdges: OnboardingFlowGraph.macroEdges,
            detailedEdges: OnboardingFlowGraph.detailedEdges,
            highlightedEdgeIDs: highlights
        )
    }

    private static func layer(for step: OnboardingStep) -> OnboardingFlowLayer {
        if step == .done { return .terminal }
        if OnboardingFlow.isDetailedProfileStep(step) { return .detailedProfile }
        return .macro
    }

    private static func resolveProposedNext(
        from step: OnboardingStep,
        context: OnboardingContext,
        rules: OnboardingRulesEngine
    ) -> (OnboardingStep?, String?) {
        if step == .profileSetup {
            return (OnboardingFlow.detailedProfileSteps.first, "profileSetup → detail entry")
        }

        if OnboardingFlow.isDetailedProfileStep(step),
           let linear = OnboardingFlow.next(after: step) {
            return (linear, "OnboardingFlow linear")
        }

        if let rulesNext = rules.nextStep(from: step, context: context) {
            return (rulesNext, "Rules engine macro")
        }

        if step == .paywall { return (.done, "paywall fallback") }

        return (nil, nil)
    }

    private static func highlightEdges(
        current: OnboardingStep,
        proposed: OnboardingStep?
    ) -> Set<String> {
        guard let proposed else { return [] }
        let id = "\(current.rawValue)→\(proposed.rawValue)"
        if OnboardingFlowGraph.macroEdges.contains(where: { $0.id == id }) {
            return [id]
        }
        if OnboardingFlowGraph.detailedEdges.contains(where: { $0.id == id }) {
            return [id]
        }
        return []
    }
}
