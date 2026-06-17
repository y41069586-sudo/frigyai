import SwiftUI

struct ShoppingListView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Shopping list")
                        .font(.title2.bold())

                    Text("Shopping gap logic ports from `shoppingGap.ts` in Phase 6.")
                        .foregroundStyle(.secondary)
                }
                .padding()
                .padding(.bottom, 96)
            }
            .navigationTitle("Shopping")
        }
    }
}
