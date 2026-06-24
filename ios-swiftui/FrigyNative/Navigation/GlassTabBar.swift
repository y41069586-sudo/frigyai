import SwiftUI

/// Bottom navigation pill. On iOS 26+ uses real Liquid Glass via GlassEffectContainer:
/// each tab button has its own glass element (they merge when adjacent), and the
/// tracker (+) circle is a separate tinted glass element positioned via .overlay
/// so it can never be clipped or have its hit area blocked.
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

    // MARK: - iOS 26 — individual glass per button + overlay tracker

    @available(iOS 26, *)
    private var glassBody: some View {
        HStack(spacing: 0) {
            GlassEffectContainer {
                HStack(spacing: 2) {
                    glassTabButton(.home)
                    glassTabButton(.plans)
                    glassTabButton(.shopping)
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 4)
            }
            // Reserve space so the pill never slides under the tracker button.
            Color.clear.frame(width: trackerSize + 12, height: 1)
        }
        .overlay(alignment: .trailing) {
            // Tracker button sits above and to the right of the pill — it is NOT
            // inside the HStack layout so it can never be clipped or Z-blocked.
            glassTrackerButton
                .offset(y: -14)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 4)
        .frame(maxWidth: 460)
    }

    @available(iOS 26, *)
    private func glassTabButton(_ tab: AppTab) -> some View {
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
            .frame(minWidth: 72, maxWidth: .infinity)
            .frame(height: 52)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .glassEffect(
            active
                ? .regular.tint(FrigyBrand.primary).interactive()
                : .regular.interactive(),
            in: .capsule
        )
        .accessibilityLabel(tab.shortTitle)
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    @available(iOS 26, *)
    private var glassTrackerButton: some View {
        Button(action: onTrackerTap) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: trackerSize, height: trackerSize)
                    .contentShape(Circle())
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
        .frame(width: trackerSize, height: trackerSize)
        .glassEffect(.regular.tint(FrigyBrand.primaryDeep).interactive(), in: .circle)
        .shadow(color: FrigyBrand.primaryDeep.opacity(0.38), radius: 12, y: 6)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
    }

    // MARK: - Pre-iOS 26 fallback

    private var legacyBody: some View {
        HStack(spacing: 4) {
            legacyTabButton(.home)
            legacyTabButton(.plans)
            legacyTabButton(.shopping)
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

    private func legacyTabButton(_ tab: AppTab) -> some View {
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
                if active { Capsule().fill(FrigyBrand.primary.opacity(0.18)) }
            }
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.shortTitle)
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    private var legacyTrackerButton: some View {
        Button(action: onTrackerTap) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: trackerSize, height: trackerSize)
                    .background(Circle().fill(LinearGradient(
                        colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )))
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
