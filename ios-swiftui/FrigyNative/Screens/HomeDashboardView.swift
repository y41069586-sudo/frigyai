import SwiftUI

struct HomeDashboardView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Dashboard")
                        .font(.largeTitle.bold())

                    Text("Native SwiftUI rebuild — tracker, macros, and widgets land in Phase 5.")
                        .foregroundStyle(.secondary)

                    GlassCard {
                        Label("Today's calories", systemImage: "flame.fill")
                            .font(.headline)
                    }
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
    }

    @Namespace private var headerGlass

    private var headerActions: some View {
        GlassEffectContainer(spacing: 8) {
            HStack(spacing: 8) {
                headerIconButton("scalemass.fill", id: "weight")
                headerIconButton("bubble.left.and.bubble.right.fill", id: "chat")
                headerIconButton("gearshape.fill", id: "settings")
            }
        }
    }

    private func headerIconButton(_ systemImage: String, id: String) -> some View {
        Button {} label: {
            Image(systemName: systemImage)
                .font(.system(size: 16, weight: .semibold))
                .frame(width: 40, height: 40)
        }
        .buttonStyle(.plain)
        .glassEffect(.clear.interactive(), in: .circle)
        .glassEffectID(id, in: headerGlass)
    }
}
