import SwiftUI

/// QA / TestFlight trace viewer — UI must not branch on flow layer; read-only observability.
struct OnboardingFlowTelemetryView: View {
    let traces: [OnboardingTransitionTrace]
    var onExport: (() -> String?)?

    private var recentTraces: [OnboardingTransitionTrace] {
        Array(traces.suffix(5).reversed())
    }

    private var displayText: String {
        if traces.isEmpty {
            return "No transitions recorded yet."
        }

        return recentTraces.map(formatTrace).joined(separator: "\n\n")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Flow Telemetry")
                    .font(.headline)
                Spacer()
                if let onExport, onExport() != nil {
                    Text("\(traces.count) events")
                        .font(.caption2.monospaced())
                        .foregroundStyle(Color.secondary)
                }
            }

            Text(displayText)
                .font(.caption2.monospaced())
                .foregroundStyle(Color.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    private func formatTrace(_ trace: OnboardingTransitionTrace) -> String {
        var lines = [
            "\(trace.action.rawValue): \(trace.from.rawValue) → \(trace.to?.rawValue ?? "—")",
            "layer=\(trace.flowLayer.rawValue) allowed=\(trace.allowed)",
        ]

        if let block = trace.blockReason {
            lines.append(block)
        }

        lines += trace.decisions.map { decision in
            "  [\(decision.priority)] \(decision.module).\(decision.role.rawValue): \(decision.result)"
        }

        return lines.joined(separator: "\n")
    }
}

#if DEBUG
#Preview {
    OnboardingFlowTelemetryView(traces: [])
}
#endif
