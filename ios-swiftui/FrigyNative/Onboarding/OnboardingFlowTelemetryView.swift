import SwiftUI

/// QA / TestFlight trace viewer — UI must not branch on flow layer; read-only observability.
struct OnboardingFlowTelemetryView: View {
    let traces: [OnboardingTransitionTrace]
    var onExport: (() -> String?)?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Flow Telemetry")
                    .font(.headline)
                Spacer()
                if let onExport, onExport() != nil {
                    Text("\(traces.count) events")
                        .font(.caption2.monospaced())
                        .foregroundStyle(.secondary)
                }
            }

            if traces.isEmpty {
                Text("No transitions recorded yet.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(Array(traces.suffix(5).reversed())) { trace in
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(trace.action.rawValue): \(trace.from.rawValue) → \(trace.to?.rawValue ?? "—")")
                            .font(.caption2.monospaced())
                        Text("layer=\(trace.flowLayer.rawValue) allowed=\(trace.allowed)")
                            .font(.caption2)
                            .foregroundStyle(trace.allowed ? .secondary : .red)

                        if let block = trace.blockReason {
                            Text(block).font(.caption2).foregroundStyle(.red)
                        }

                        ForEach(trace.decisions) { decision in
                            Text("  [\(decision.priority)] \(decision.module).\(decision.role.rawValue): \(decision.result)")
                                .font(.caption2.monospaced())
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

#if DEBUG
#Preview {
    OnboardingFlowTelemetryView(traces: [])
}
#endif
