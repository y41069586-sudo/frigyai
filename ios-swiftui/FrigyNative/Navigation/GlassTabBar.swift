import SwiftUI

/// Native Liquid Glass bottom navigation matching the Capacitor app's structure:
/// Home · Plans · Shopping + elevated tracker action.
/// Active tab uses a morphing glass capsule via shared `glassEffectID`.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var onTrackerTap: () -> Void

    @Namespace private var tabGlassNamespace

    var body: some View {
        HStack(alignment: .bottom, spacing: 10) {
            GlassEffectContainer(spacing: 4) {
                HStack(spacing: 4) {
                    ForEach(AppTab.allCases) { tab in
                        tabButton(tab)
                    }
                }
            }

            trackerButton
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 8)
        .safeAreaPadding(.bottom, 4)
    }

    @ViewBuilder
    private func tabButton(_ tab: AppTab) -> some View {
        Button {
            withAnimation(.bouncy) {
                selection = tab
            }
        } label: {
            ZStack {
                if selection == tab {
                    Capsule()
                        .fill(.clear)
                        .glassEffect(.regular.interactive(), in: .capsule)
                        .glassEffectID("activeTabCapsule", in: tabGlassNamespace)
                }

                VStack(spacing: 2) {
                    Image(systemName: tab.systemImage)
                        .font(.system(size: 22, weight: .semibold))
                    Text(tab.title)
                        .font(.caption2.weight(.bold))
                }
                .padding(.vertical, 10)
                .padding(.horizontal, 4)
                .frame(maxWidth: .infinity)
            }
            .foregroundStyle(selection == tab ? Color.primary : Color.secondary)
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.title)
        .accessibilityAddTraits(selection == tab ? .isSelected : [])
    }

    private var trackerButton: some View {
        Button(action: onTrackerTap) {
            Image(systemName: "plus")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 62, height: 62)
        }
        .accessibilityLabel("Log meal")
        .glassEffect(.regular.tint(.green).interactive(), in: .circle)
    }
}
