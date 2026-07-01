import SwiftUI

/// Bottom navigation where the BAR ITSELF is nearly transparent (just a soft
/// floating shadow for legibility) and the Liquid Glass lives only on the
/// ACTIVE tab — a glass pill that slides/animates to whichever tab you switch
/// to, instead of the whole bar being one grey glass capsule.
/// The tracker (+) button sits inline to the right of Shopping.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var mealCount: Int = 0
    var onTrackerTap: (() -> Void)? = nil

    @Environment(LanguageManager.self) private var lang

    private let tabs: [AppTab] = [.home, .plans, .shopping]

    var body: some View {
        content
            .padding(.horizontal, 16)
            .padding(.bottom, 4)
            .frame(maxWidth: 460)
    }

    // MARK: - Bar layout

    private var content: some View {
        GeometryReader { geo in
            // Three equal tab slots share all but the trailing (+) button width.
            let plusSize: CGFloat = 50
            let innerH: CGFloat = 6
            let barWidth = geo.size.width
            let tabsWidth = barWidth - plusSize - innerH * 2 - 4
            let slotWidth = tabsWidth / 3
            let activeIndex = CGFloat(tabs.firstIndex(of: selection) ?? 0)

            bar(slotWidth: slotWidth, innerH: innerH, plusSize: plusSize, activeIndex: activeIndex)
        }
        .frame(height: 58)
    }

    @ViewBuilder
    private func bar(slotWidth: CGFloat, innerH: CGFloat, plusSize: CGFloat, activeIndex: CGFloat) -> some View {
        let stack = ZStack(alignment: .leading) {
            // The animated glass pill — sits behind only the active tab.
            activeGlassPill(width: slotWidth - 6)
                .offset(x: innerH + activeIndex * slotWidth + 3)
                .animation(.spring(response: 0.35, dampingFraction: 0.78), value: selection)

            HStack(spacing: 0) {
                ForEach(tabs, id: \.self) { tab in
                    tabButton(tab).frame(width: slotWidth)
                }
                plusButton(mealCount: mealCount, size: plusSize)
                    .frame(width: plusSize)
                    .padding(.leading, 4)
            }
            .padding(.horizontal, innerH)
        }
        .frame(height: 58)

        if #available(iOS 26, *) {
            // ONLY the active pill is Liquid Glass — the bar itself stays fully
            // transparent (no glass over the whole width, no colour). The
            // GlassEffectContainer just lets the single pill render/morph correctly.
            GlassEffectContainer(spacing: 8) {
                stack
            }
        } else {
            // Very subtle floating backing so buttons stay legible over scrolling
            // content, WITHOUT the prominent grey capsule look.
            stack.background(
                Capsule()
                    .fill(Color(UIColor.systemBackground).opacity(0.55))
                    .shadow(color: .black.opacity(0.10), radius: 16, y: 6)
            )
        }
    }

    @ViewBuilder
    private func activeGlassPill(width: CGFloat) -> some View {
        if #available(iOS 26, *) {
            // Sized FIRST, then glass. CLEAR Liquid Glass — no colour/tint, just the
            // pure refracting glass pill around the active tab. Over the app's
            // near-white background clear glass has almost nothing to refract, so we
            // add a neutral specular RIM (white → clear) — the same bright edge real
            // Liquid Glass shows — so the pill visibly reads as glass without adding
            // any colour tint.
            Color.clear
                .frame(width: width, height: 46)
                .glassEffect(.regular.interactive(), in: .capsule)
                .overlay(
                    Capsule()
                        .strokeBorder(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.85),
                                    Color.white.opacity(0.15),
                                    Color.white.opacity(0.35)
                                ],
                                startPoint: .top, endPoint: .bottom
                            ),
                            lineWidth: 0.8
                        )
                )
                .shadow(color: .black.opacity(0.10), radius: 8, y: 3)
        } else {
            // Pre-iOS-26 frosted-glass approximation: a translucent pill with a
            // top-down sheen and a mint-tinted rim + glow so it reads as glass,
            // not a flat white blob.
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay(
                    Capsule().fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.6), FrigyBrand.primary.opacity(0.14)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                )
                .overlay(
                    Capsule().stroke(
                        LinearGradient(
                            colors: [Color.white.opacity(0.9), FrigyBrand.primary.opacity(0.45)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
                )
                .shadow(color: FrigyBrand.primary.opacity(0.28), radius: 10, y: 4)
                .shadow(color: .black.opacity(0.06), radius: 3, y: 1)
                .frame(width: width, height: 46)
        }
    }

    private func tabButton(_ tab: AppTab) -> some View {
        let active = selection == tab
        return Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.78)) { selection = tab }
        } label: {
            VStack(spacing: 2) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 20, weight: active ? .bold : .semibold))
                Text(lang.t(tab.shortTitle))
                    .font(.system(size: 10, weight: active ? .heavy : .bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            // The glass pill sits BEHIND the label, so the icon/text are always
            // drawn crisp on top (never blurred by the glass). Selected label is
            // the dark brand green at full opacity so it stays clearly readable.
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
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundColor(.white)
                    .frame(width: size, height: size)
                    .background(
                        Circle().fill(LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.35), radius: 8, y: 3)
                    )
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
}
