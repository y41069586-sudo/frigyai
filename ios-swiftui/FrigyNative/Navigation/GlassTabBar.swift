import SwiftUI

/// Bottom navigation pill with the tracker (+) button inline to the right of Shopping.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var mealCount: Int = 0
    var onTrackerTap: (() -> Void)? = nil

    var body: some View {
        if #available(iOS 26, *) {
            glassBody
        } else {
            legacyBody
        }
    }

    // MARK: - iOS 26 — individual glass capsules + glass circle for +

    @available(iOS 26, *)
    private var glassBody: some View {
        HStack(spacing: 8) {
            // Three tab buttons share remaining space equally
            GlassEffectContainer { glassTabButton(.home) }
            GlassEffectContainer { glassTabButton(.plans) }
            GlassEffectContainer { glassTabButton(.shopping) }

            // Plus button — fixed width, right of Shopping
            if let action = onTrackerTap {
                GlassEffectContainer {
                    glassPlusButton(mealCount: mealCount, action: action)
                }
                .shadow(color: FrigyBrand.primaryDeep.opacity(0.35), radius: 10, y: 5)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
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
                    .foregroundColor(active ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                Text(tab.shortTitle)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(active ? FrigyBrand.text : FrigyBrand.textMuted)
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
    private func glassPlusButton(mealCount: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: 52, height: 52)
                    .contentShape(Circle())
                if mealCount > 0 {
                    Text("\(mealCount)")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(Color(hex: "#EF4444")))
                        .offset(x: 3, y: -2)
                }
            }
        }
        .buttonStyle(.plain)
        .frame(width: 52, height: 52)
        .glassEffect(.regular.tint(FrigyBrand.primaryDeep).interactive(), in: .circle)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
    }

    // MARK: - Pre-iOS 26 fallback

    private var legacyBody: some View {
        HStack(spacing: 4) {
            legacyTabButton(.home)
            legacyTabButton(.plans)
            legacyTabButton(.shopping)

            if let action = onTrackerTap {
                legacyPlusButton(mealCount: mealCount, action: action)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .frame(maxWidth: 460)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay(Capsule().stroke(Color.white.opacity(0.4), lineWidth: 1))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 6)
        )
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
                    .foregroundColor(active ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                Text(tab.shortTitle)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(active ? FrigyBrand.text : FrigyBrand.textMuted)
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

    private func legacyPlusButton(mealCount: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(LinearGradient(
                        colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )))
                if mealCount > 0 {
                    Text("\(mealCount)")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(Color(hex: "#EF4444")))
                        .offset(x: 3, y: -2)
                }
            }
        }
        .buttonStyle(.plain)
        .frame(width: 52, height: 48)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
    }
}
