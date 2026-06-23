import SwiftUI

/// Bottom navigation — faithful port of the web `BottomNavigation.tsx`:
/// a floating, centered, rounded glass "pill" containing Home / Plan / Einkauf
/// plus a raised green circular "+" tracker button on the right edge.
/// Uses real iOS 26 Liquid Glass as the material, NOT the native iOS tab bar.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var onTrackerTap: () -> Void

    private let trackerSize: CGFloat = 54

    var body: some View {
        HStack(spacing: 4) {
            tabButton(.home)
            tabButton(.plans)
            tabButton(.shopping)
            // Reserve horizontal room for the raised "+" button so tabs don't
            // slide underneath it. The button itself is an overlay (below) so it
            // can pop above the pill without stretching the pill's height.
            Color.clear.frame(width: trackerSize - 6, height: 48)
        }
        .padding(.leading, 8)
        .padding(.trailing, 6)
        .padding(.vertical, 6)
        .frame(maxWidth: 440)
        .background(pillBackground)
        .overlay(alignment: .trailing) {
            trackerButton.offset(x: -2, y: -12)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 4)
    }

    // MARK: - Pill background (real Liquid Glass)

    @ViewBuilder
    private var pillBackground: some View {
        if #available(iOS 26, *) {
            Capsule()
                .fill(.clear)
                .glassEffect(.regular.interactive(), in: .capsule)
        } else {
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay(Capsule().stroke(Color.white.opacity(0.4), lineWidth: 1))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 6)
        }
    }

    // MARK: - Tab button

    private func tabButton(_ tab: AppTab) -> some View {
        let active = selection == tab
        return Button {
            withAnimation(.easeOut(duration: 0.16)) { selection = tab }
        } label: {
            VStack(spacing: 2) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(active ? FrigyBrand.primaryDark : Color(hex: "#9CA3AF"))
                Text(tab.shortTitle)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(active ? FrigyBrand.text : Color(hex: "#9CA3AF"))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background {
                if active {
                    Capsule().fill(FrigyBrand.primary.opacity(0.18))
                }
            }
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.shortTitle)
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    // MARK: - Tracker (+) button — raised green circle with white ring

    private var trackerButton: some View {
        Button(action: onTrackerTap) {
            Image(systemName: "plus")
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(.white)
                .frame(width: trackerSize, height: trackerSize)
                .modifier(TrackerButtonStyle())
                .padding(4)
                .background(Circle().fill(.white))
                .shadow(color: FrigyBrand.primaryDeep.opacity(0.35), radius: 10, y: 5)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Mahlzeit tracken")
    }
}

private struct TrackerButtonStyle: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            content
                .glassEffect(.regular.tint(FrigyBrand.primaryDeep).interactive(), in: .circle)
        } else {
            content
                .background(
                    Circle().fill(LinearGradient(
                        colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                )
        }
    }
}
