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

    // Namespace for the Liquid Glass morph: the single active pill keeps a stable
    // glassEffectID, so iOS fluidly animates the glass to the newly-selected tab.
    @Namespace private var glassNS

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
        let pillX = innerH + activeIndex * slotWidth + 3
        ZStack(alignment: .leading) {
            // Glass layer: ONE Liquid Glass pill that slides/morphs to the active tab.
            // It lives in its OWN layer so it can never blur the labels, which are
            // drawn on top in a separate layer below.
            glassLayer(width: slotWidth - 6, pillX: pillX)

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
    }

    /// A single real Liquid Glass pill that slides to the active tab. The
    /// GlassEffectContainer is STATIONARY (fills the bar); the pill moves INSIDE it
    /// with a stable `glassEffectID`, so iOS renders the native fluid glass
    /// transition when you switch tabs. Kept in its own layer (labels drawn on top)
    /// so the glass never blurs the icon/text.
    @ViewBuilder
    private func glassLayer(width: CGFloat, pillX: CGFloat) -> some View {
        if #available(iOS 26, *) {
            GlassEffectContainer(spacing: 12) {
                Capsule()
                    .fill(.clear)
                    .frame(width: width, height: 46)
                    .glassEffect(.regular.interactive(), in: .capsule)
                    .glassEffectID("activeTabPill", in: glassNS)
                    .overlay(
                        Capsule().strokeBorder(
                            LinearGradient(
                                colors: [Color.white.opacity(0.85), Color.white.opacity(0.15), Color.white.opacity(0.35)],
                                startPoint: .top, endPoint: .bottom
                            ),
                            lineWidth: 0.8
                        )
                        .frame(width: width, height: 46)
                    )
                    .offset(x: pillX)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .animation(.spring(response: 0.42, dampingFraction: 0.72), value: selection)
        } else {
            fallbackPill(width: width)
                .offset(x: pillX)
                .animation(.spring(response: 0.42, dampingFraction: 0.72), value: selection)
        }
    }

    /// Pre-iOS-26 frosted-glass approximation of the active pill.
    private func fallbackPill(width: CGFloat) -> some View {
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

    private func tabButton(_ tab: AppTab) -> some View {
        let active = selection == tab
        return Button {
            withAnimation(.spring(response: 0.42, dampingFraction: 0.72)) { selection = tab }
        } label: {
            VStack(spacing: 2) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 20, weight: active ? .bold : .semibold))
                Text(lang.t(tab.shortTitle))
                    .font(.system(size: 10, weight: active ? .heavy : .bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            // Labels are drawn ON TOP of the glass layer (never inside it), so they
            // always stay crisp — never blurred by the glass.
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
