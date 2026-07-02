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
        HStack(spacing: 0) {
            tabGroup(slotWidth: slotWidth)
                .frame(width: slotWidth * 3, height: 50)
                .padding(.horizontal, innerH)
                .background {
                    // Frosted glass bar base — translucent over the light app so the
                    // whole bar reads as glass, like Cal AI's.
                    Capsule().fill(.ultraThinMaterial)
                        .overlay(Capsule().strokeBorder(Color.white.opacity(0.45), lineWidth: 0.8))
                        .shadow(color: .black.opacity(0.08), radius: 12, y: 5)
                }

            plusButton(mealCount: mealCount, size: plusSize)
                .frame(width: plusSize)
                .padding(.leading, 4)
        }
        .frame(height: 58)
    }

    @ViewBuilder
    private func tabGroup(slotWidth: CGFloat) -> some View {
        if #available(iOS 26, *) {
            // REAL Liquid Glass, Apple's way: the glass is applied to the ACTIVE
            // button's CONTENT (icon+label). A separate empty clear capsule barely
            // renders — THAT was why it looked like a flat white pill. A stable
            // glassEffectID inside the container makes iOS morph the glass from the
            // old tab to the new one — the native bubble animation.
            GlassEffectContainer(spacing: 28) {
                HStack(spacing: 0) {
                    ForEach(tabs, id: \.self) { tab in
                        Button {
                            withAnimation(.spring(response: 0.45, dampingFraction: 0.72)) { selection = tab }
                        } label: {
                            tabLabel(tab, active: selection == tab)
                                .frame(width: slotWidth, height: 46)
                        }
                        .buttonStyle(.plain)
                        .activeTabGlass(selection == tab, in: glassNS)
                    }
                }
            }
            .animation(.spring(response: 0.45, dampingFraction: 0.72), value: selection)
        } else {
            HStack(spacing: 0) {
                ForEach(tabs, id: \.self) { tab in
                    Button {
                        withAnimation(.spring(response: 0.45, dampingFraction: 0.72)) { selection = tab }
                    } label: {
                        tabLabel(tab, active: selection == tab)
                            .frame(width: slotWidth, height: 46)
                            .background {
                                if selection == tab {
                                    Capsule().fill(Color.white)
                                        .overlay(Capsule().strokeBorder(FrigyBrand.primary.opacity(0.3), lineWidth: 1))
                                        .shadow(color: .black.opacity(0.10), radius: 6, y: 2)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func tabLabel(_ tab: AppTab, active: Bool) -> some View {
        VStack(spacing: 2) {
            Image(systemName: tab.systemImage)
                .font(.system(size: 20, weight: active ? .bold : .semibold))
            Text(lang.t(tab.shortTitle))
                .font(.system(size: 10, weight: active ? .heavy : .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        // Icon/label are the glass's CONTENT → drawn crisp on top of the glass.
        .foregroundColor(active ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
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

private extension View {
    /// Applies REAL Liquid Glass to the active tab button (iOS 26 only). The stable
    /// `glassEffectID` lets the enclosing GlassEffectContainer fluidly morph the
    /// glass from the previously-selected tab to the new one (the native bubble
    /// animation). Non-active tabs get no glass.
    @ViewBuilder
    func activeTabGlass(_ active: Bool, in ns: Namespace.ID) -> some View {
        if #available(iOS 26, *), active {
            self
                .glassEffect(.regular.interactive(), in: .capsule)
                .glassEffectID("activeTabPill", in: ns)
        } else {
            self
        }
    }
}
