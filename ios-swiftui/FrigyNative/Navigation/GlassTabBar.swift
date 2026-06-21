import SwiftUI

/// Native bottom navigation bar — uses Liquid Glass on iOS 26+,
/// falls back to a translucent material bar on iOS 17–25.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var onTrackerTap: () -> Void

    var body: some View {
        if #available(iOS 26, *) {
            GlassTabBariOS26(selection: $selection, onTrackerTap: onTrackerTap)
        } else {
            GlassTabBarFallback(selection: $selection, onTrackerTap: onTrackerTap)
        }
    }
}

// MARK: - iOS 26+ Liquid Glass variant

@available(iOS 26, *)
private struct GlassTabBariOS26: View {
    @Binding var selection: AppTab
    var onTrackerTap: () -> Void

    @Namespace private var tabGlassNamespace

    var body: some View {
        HStack(alignment: .bottom, spacing: 10) {
            GlassEffectContainer(spacing: 4) {
                HStack(spacing: 4) {
                    tabButton(.home)
                    tabButton(.plans)
                    tabButton(.shopping)
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
            withAnimation(.bouncy) { selection = tab }
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
        .accessibilityLabel("Mahlzeit tracken")
        .glassEffect(.regular.tint(.green).interactive(), in: .circle)
    }
}

// MARK: - iOS 17–25 fallback

private struct GlassTabBarFallback: View {
    @Binding var selection: AppTab
    var onTrackerTap: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppTab.allCases) { tab in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { selection = tab }
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: tab.systemImage)
                            .font(.system(size: 22, weight: .semibold))
                        Text(tab.title)
                            .font(.caption2.weight(.bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .foregroundStyle(selection == tab ? Color.primary : Color.secondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
                .accessibilityAddTraits(selection == tab ? .isSelected : [])
            }

            Button(action: onTrackerTap) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(Color.green)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Mahlzeit tracken")
            .frame(width: 72)
            .padding(.bottom, 4)
        }
        .padding(.horizontal, 8)
        .padding(.top, 8)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .overlay(Divider(), alignment: .top)
    }
}
