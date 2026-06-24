import SwiftUI

/// Bottom navigation pill — three separate glass capsules on iOS 26+.
/// The floating tracker (+) button lives in MainShellView so it always has
/// the highest z-order and its hit area is never blocked by the tab bar.
struct GlassTabBar: View {
    @Binding var selection: AppTab

    var body: some View {
        if #available(iOS 26, *) {
            glassBody
        } else {
            legacyBody
        }
    }

    // MARK: - iOS 26 — individual glass per button

    @available(iOS 26, *)
    private var glassBody: some View {
        HStack(spacing: 8) {
            GlassEffectContainer { glassTabButton(.home) }
            GlassEffectContainer { glassTabButton(.plans) }
            GlassEffectContainer { glassTabButton(.shopping) }
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
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

    // MARK: - Pre-iOS 26 fallback

    private var legacyBody: some View {
        HStack(spacing: 4) {
            legacyTabButton(.home)
            legacyTabButton(.plans)
            legacyTabButton(.shopping)
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

}

