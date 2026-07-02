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
        HStack(spacing: 0) {
            ForEach(tabs, id: \.self) { tab in
                tabButton(tab).frame(width: slotWidth)
            }
            plusButton(mealCount: mealCount, size: plusSize)
                .frame(width: plusSize)
                .padding(.leading, 4)
        }
        .padding(.horizontal, innerH)
        .frame(height: 58)
    }

    /// Real Liquid Glass capsule used as the ACTIVE tab's background. Because it is a
    /// `.background` it always sits strictly behind the icon/label, so the label can
    /// never be blurred by the glass (the old separate pill inside a
    /// GlassEffectContainer was compositing over the label — the washed-out icon).
    @ViewBuilder
    private func activeGlassBackground() -> some View {
        if #available(iOS 26, *) {
            Capsule()
                .fill(.clear)
                .glassEffect(.regular.interactive(), in: .capsule)
                .overlay(
                    Capsule().strokeBorder(
                        LinearGradient(
                            colors: [Color.white.opacity(0.85), Color.white.opacity(0.15), Color.white.opacity(0.35)],
                            startPoint: .top, endPoint: .bottom
                        ),
                        lineWidth: 0.8
                    )
                )
                .shadow(color: .black.opacity(0.10), radius: 8, y: 3)
        } else {
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
            .foregroundColor(active ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
            .frame(maxWidth: .infinity)
            .frame(height: 46)
            // Glass lives in the BACKGROUND → strictly behind the label → crisp label.
            .background { if active { activeGlassBackground().padding(.horizontal, 3) } }
            .frame(height: 50)
            .contentShape(Rectangle())
            .animation(.spring(response: 0.35, dampingFraction: 0.78), value: active)
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
