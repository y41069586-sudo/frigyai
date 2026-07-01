import SwiftUI

/// Bottom navigation as a SINGLE unified liquid-glass bar (not separate
/// capsules per button). The bar itself is only Liquid Glass — active state is
/// conveyed purely by the green text + icon, never by a colored button fill.
/// The tracker (+) button sits inline to the right of Shopping inside the same bar.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var mealCount: Int = 0
    var onTrackerTap: (() -> Void)? = nil

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        if #available(iOS 26, *) {
            glassBody
        } else {
            legacyBody
        }
    }

    // MARK: - Shared bar contents

    private func barContent(plusSize: CGFloat) -> some View {
        ZStack(alignment: .leading) {
            activeTabIndicator()

            HStack(spacing: 2) {
                tabButton(.home)
                tabButton(.plans)
                tabButton(.shopping)
                plusButton(mealCount: mealCount, size: plusSize)
            }
        }
    }

    private func activeTabIndicator() -> some View {
        let containerWidth = UIScreen.main.bounds.width - 64 - 20
        let tabCount: CGFloat = 3
        let tabWidth = (containerWidth - 4) / tabCount
        let baseIndex: CGFloat = selection == .home ? 0 : selection == .plans ? 1 : 2
        let offset = (tabWidth + 2) * baseIndex

        return Capsule()
            .fill(.ultraThinMaterial)
            .overlay(Capsule().stroke(Color.white.opacity(0.3), lineWidth: 1))
            .frame(width: tabWidth, height: 42)
            .offset(x: offset + 10, y: 4)
            .animation(.easeOut(duration: 0.2), value: selection)
    }

    private func tabButton(_ tab: AppTab) -> some View {
        let active = selection == tab
        return Button {
            withAnimation(.easeOut(duration: 0.2)) { selection = tab }
        } label: {
            VStack(spacing: 2) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 21, weight: .semibold))
                Text(lang.t(tab.shortTitle))
                    .font(.system(size: 10, weight: .bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundColor(active ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.shortTitle)
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    private func plusButton(mealCount: Int, size: CGFloat) -> some View {
        Button(action: { onTrackerTap?() }) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "plus")
                    .font(.system(size: 23, weight: .heavy))
                    // Green icon on plain glass — no filled circle.
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .frame(width: size, height: size)
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
        .frame(width: size, height: size)
        .disabled(onTrackerTap == nil)
        .opacity(onTrackerTap == nil ? 0 : 1)
        .accessibilityLabel("Mahlzeit tracken – \(mealCount) heute")
    }

    // MARK: - iOS 26 — one glass capsule for the whole bar

    @available(iOS 26, *)
    private var glassBody: some View {
        GlassEffectContainer {
            barContent(plusSize: 50)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .glassEffect(.regular.interactive(), in: .capsule)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 4)
        .frame(maxWidth: 460)
    }

    // MARK: - Pre-iOS 26 fallback

    private var legacyBody: some View {
        barContent(plusSize: 48)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(.ultraThinMaterial)
                    .overlay(Capsule().stroke(Color.white.opacity(0.4), lineWidth: 1))
                    .shadow(color: .black.opacity(0.08), radius: 16, y: 6)
            )
            .padding(.horizontal, 16)
            .padding(.bottom, 4)
            .frame(maxWidth: 460)
    }
}
