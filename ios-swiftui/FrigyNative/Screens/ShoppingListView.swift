import SwiftUI

struct ShoppingListView: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator
    @State private var draftNote = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Shopping list")
                    .font(.title2.bold())

                Text("Tab activation count: \(tabCoordinator.tabActivationCounts[.shopping, default: 0])")
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)

                TextField("Shopping tab state test", text: $draftNote)
                    .textFieldStyle(.roundedBorder)

                Button("Push category") {
                    tabCoordinator.pushShopping(.category("produce"))
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .padding(.bottom, 96)
        }
        .navigationTitle("Shopping")
    }
}
