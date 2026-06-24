import SwiftUI

/// Bottom navigation — faithful port of the web `BottomNavigation.tsx`:
/// a floating, centered, rounded glass "pill" containing Home / Plan / Einkauf
/// plus a raised green circular "+" tracker button on the right edge.
///
/// On iOS 26+ uses real Liquid Glass via `GlassEffectContainer` so the pill
/// and the tracker circle share one composited glass layer.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var onTrackerTap: () -> Void
    var mealCount: Int = 0

    private let trackerSize: CGFloat = 60

    var body: some View {
        if #available(iOS 26, *) {
            glassBody
        } else {
            legacyBody
        }
    }

    // MARK: - iOS 26 Liquid Glass layout

    @available(iOS 26, *)
    private var glassBody: some View {
        GlassEffectContainer {
            HStack(alignment: .center, spacing: 0) {
                // Pill — tabs + spacer for the tracker button
                HStack(spacing: 4) {
                    tabButton(.home)
                    tabButton(.plans)
                    tabButton(.shopping)
                    // Reserve room for the raised "+" so Shopping tab isn't squeezed.
                    Color.clear.frame(width: trackerSize + 6, height: 48)
                }
                .padding(.leading, 10)
                .padding(.trailing, 8)
                .padding(.vertical, 6)
                .glassEffect(.regular.interactive(), in: .capsule)

                // Tracker button — tinted green glass circle, raised above the pill
                trackerGlassButton
                    .glassEffect(
                        .regular
                            .tint(FrigyBrand.primaryDeep)
                            .interactive(),
                        in: .circle
                    )
                    .frame(width: trackerSize, height: trackerSize)
                    .offset(x: -(trackerSize / 2 + 4), y: -14)
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 4)
        .frame(maxWidth: 480)
    }

    // MARK: - Pre-iOS 26 fallback

    private var legacyBody: some View {
        HStack(spacing: 4) {
            tabButton(.home)
            tabButton(.plans)
            tabButton(.shopping)
            Color.clear.frame(width: trackerSize + 6, height: 48)
        }
        .padding(.leading, 10)
        .padding(.trailing, 8)
        .padding(.vertical, 6)
        .frame(maxWidth: 460)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay(Capsule().stroke(Color.white.opacity(0.4), lineWidth: 1))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 6)
        )
        .overlay(alignment: .trailing) {
            legacyTrackerButton.offset(x: 0, y: -14)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 4)
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

    // MARK: - Tracker (+) button — iOS 26 version (glass applied by parent)

    @available(iOS 26, *)
    private var trackerGlassButton: some View {
        Button(action: onTrackerTap) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: trackerSize, height: trackerSize)

                if mealCount > 0 {
                    Text("\(mealCount)")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(Color(hex: "#EF4444")))
                        .offset(x: 4, y: -2)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
    }

    // MARK: - Tracker (+) button — legacy (pre-iOS 26)

    private var legacyTrackerButton: some View {
        Button(action: onTrackerTap) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: trackerSize, height: trackerSize)
                    .background(
                        Circle().fill(LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                    )
                    .padding(5)
                    .background(Circle().fill(.white))
                    .shadow(color: FrigyBrand.primaryDeep.opacity(0.38), radius: 12, y: 6)

                if mealCount > 0 {
                    Text("\(mealCount)")
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(Color(hex: "#EF4444")))
                        .offset(x: 4, y: -2)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
    }
}
