import SwiftUI

#if DEBUG
/// Developer-only flow graph — answers "where am I in the flow?"
struct OnboardingFlowDebugView: View {
    let snapshot: OnboardingFlowDebugSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Flow Debugger")
                .font(.headline)

            LabeledContent("Layer", value: snapshot.flowLayer.rawValue)
            LabeledContent("Current", value: snapshot.currentStep.rawValue)

            if let proposed = snapshot.proposedNext {
                LabeledContent("Next", value: proposed.rawValue)
                if let source = snapshot.proposedSource {
                    Text(source).font(.caption2).foregroundStyle(.secondary)
                }
                LabeledContent("Allowed", value: snapshot.isTransitionAllowed ? "yes" : "no")
            }

            if let block = snapshot.blockReason {
                Text(block)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            Text("Macro graph").font(.subheadline.bold())
            edgeList(snapshot.macroEdges, highlights: snapshot.highlightedEdgeIDs)

            Text("Detail graph (subset)").font(.subheadline.bold())
            edgeList(Array(snapshot.detailedEdges.prefix(6)), highlights: snapshot.highlightedEdgeIDs)

            if !snapshot.completedSteps.isEmpty {
                Text("Completed: \(snapshot.completedSteps.map(\.rawValue).joined(separator: ", "))")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    private func edgeList(_ edges: [OnboardingFlowEdge], highlights: Set<String>) -> some View {
        Text(
            edges.map { edge in
                let marker = highlights.contains(edge.id) ? "▸ " : "  "
                return "\(marker)\(edge.from.rawValue) → \(edge.to.rawValue) [\(edge.label)]"
            }
            .joined(separator: "\n")
        )
        .font(.caption2.monospaced())
        .foregroundStyle(Color.secondary)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
#endif
