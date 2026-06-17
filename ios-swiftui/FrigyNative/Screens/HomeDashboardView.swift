import SwiftUI

struct HomeDashboardView: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    /// State-preservation canary — survives tab switches when architecture is correct.
    @State private var draftNote = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Dashboard")
                    .font(.largeTitle.bold())

                Text("Tab activation count: \(tabCoordinator.tabActivationCounts[.home, default: 0])")
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)

                TextField("State preservation test", text: $draftNote)
                    .textFieldStyle(.roundedBorder)

                GlassCard {
                    Label("Today's calories", systemImage: "flame.fill")
                        .font(.headline)
                }

                Button("Push Profile (typed route)") {
                    tabCoordinator.pushHome(.profile)
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .padding(.bottom, 96)
        }
        .navigationTitle("Frigy")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                headerActions
            }
        }
    }

    @Namespace private var headerGlass

    private var headerActions: some View {
        GlassEffectContainer(spacing: 8) {
            HStack(spacing: 8) {
                headerIconButton("scalemass.fill", id: "weight") {
                    tabCoordinator.pushHome(.weightProgress)
                }
                headerIconButton("bubble.left.and.bubble.right.fill", id: "chat") {
                    tabCoordinator.pushHome(.chatbot)
                }
                headerIconButton("gearshape.fill", id: "settings") {
                    tabCoordinator.pushHome(.profile)
                }
            }
        }
    }

    private func headerIconButton(_ systemImage: String, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 16, weight: .semibold))
                .frame(width: 40, height: 40)
        }
        .buttonStyle(.plain)
        .glassEffect(.clear.interactive(), in: .circle)
        .glassEffectID(id, in: headerGlass)
    }
}
