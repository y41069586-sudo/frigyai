import SwiftUI

struct MealPlansView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Weekly meal plan")
                        .font(.title2.bold())

                    Text("Meal plan generation UI connects to `generate-meal-plan` in Phase 6.")
                        .foregroundStyle(.secondary)
                }
                .padding()
                .padding(.bottom, 96)
            }
            .navigationTitle("Plans")
        }
    }
}
