import SwiftUI

struct TrackerLogMealView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Text("Log Meal")
                .font(.title.bold())

            Text("Tracker sheet replaces the Capacitor center + button flow in Phase 5.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            GlassActionButton(title: "Scan food", systemImage: "camera.fill") {}

            Button("Close") { dismiss() }
                .buttonStyle(.bordered)
        }
        .padding()
        .navigationBarTitleDisplayMode(.inline)
    }
}
