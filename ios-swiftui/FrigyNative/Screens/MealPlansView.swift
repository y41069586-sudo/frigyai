import SwiftUI

struct MealPlansView: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator
    @State private var draftNote = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Weekly meal plan")
                    .font(.title2.bold())

                Text("Tab activation count: \(tabCoordinator.tabActivationCounts[.plans, default: 0])")
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)

                TextField("Plans tab state test", text: $draftNote)
                    .textFieldStyle(.roundedBorder)

                Button("Push Reminders") {
                    tabCoordinator.pushPlans(.reminders)
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .padding(.bottom, 96)
        }
        .navigationTitle("Plans")
    }
}
