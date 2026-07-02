import SwiftUI

/// Bottom navigation with an Apple-"Liquid Glass"-style motion system.
///
/// The selection indicator is a single translucent bubble that FLOWS between tabs
/// via `matchedGeometryEffect` (SwiftUI owns the geometry, so there is no manual
/// frame math, no layout jitter and no state desync on rapid tapping). On top of
/// the flow, a volume-preserving squash-&-stretch layer gives the elastic "liquid"
/// deformation, and the stretch intensity scales with the travel distance — a
/// velocity proxy, so a far jump reads more energetic than an adjacent one.
///
/// The bubble surface is adaptive translucency: real `glassEffect` on iOS 26,
/// `.ultraThinMaterial` (which also bends/blurs the content behind it and adapts to
/// light/dark) as the iOS 18 stand-in — so migrating to full iOS 26 Liquid Glass is
/// a one-line surface swap, the motion architecture stays identical.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var mealCount: Int = 0
    var onTrackerTap: (() -> Void)? = nil

    @Environment(LanguageManager.self) private var lang
    @Environment(\.colorScheme) private var colorScheme

    private let tabs: [AppTab] = [.home, .plans, .shopping]

    /// Namespace the bubble morphs within. Migrates 1:1 to iOS 26 `glassEffectID`.
    @Namespace private var bubbleNS

    // Squash-&-stretch state, driven independently of the position spring so the two
    // compose without fighting. `stretchX` > 1 elongates along travel; `y` compresses
    // to preserve volume (the classic liquid deform). `anchor` points at the travel
    // direction so the leading edge reaches ahead before the body catches up.
    @State private var stretchX: CGFloat = 1
    @State private var stretchAnchor: UnitPoint = .center

    var body: some View {
        content
            .padding(.horizontal, 16)
            .padding(.bottom, 4)
            .frame(maxWidth: 460)
    }

    // MARK: - Layout

    private var content: some View {
        GeometryReader { geo in
            let plusSize: CGFloat = 50
            let innerH: CGFloat = 6
            let tabsWidth = geo.size.width - plusSize - innerH * 2 - 4
            let slotWidth = tabsWidth / 3
            bar(slotWidth: slotWidth, innerH: innerH, plusSize: plusSize)
        }
        .frame(height: 58)
    }

    private func bar(slotWidth: CGFloat, innerH: CGFloat, plusSize: CGFloat) -> some View {
        HStack(spacing: 0) {
            tabGroup(slotWidth: slotWidth)
                .frame(width: slotWidth * 3, height: 50)
                .padding(.horizontal, innerH)
                .background { barBackground }

            plusButton(mealCount: mealCount, size: plusSize)
                .frame(width: plusSize)
                .padding(.leading, 4)
        }
        .frame(height: 58)
    }

    private func tabGroup(slotWidth: CGFloat) -> some View {
        HStack(spacing: 0) {
            ForEach(tabs, id: \.self) { tab in
                let active = selection == tab
                tabLabel(tab, active: active)
                    .frame(width: slotWidth, height: 46)
                    // The bubble lives in the ACTIVE tab's background. When selection
                    // changes inside `withAnimation`, matchedGeometryEffect
                    // interpolates the bubble's frame from the old tab to the new one
                    // — the fluid flow — with SwiftUI owning the geometry.
                    .background {
                        if active {
                            liquidBubble
                                .matchedGeometryEffect(id: "liquidBubble", in: bubbleNS)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { switchTo(tab) }
                    .accessibilityElement()
                    .accessibilityLabel(lang.t(tab.shortTitle))
                    .accessibilityAddTraits(active ? [.isButton, .isSelected] : .isButton)
            }
        }
    }

    private func tabLabel(_ tab: AppTab, active: Bool) -> some View {
        VStack(spacing: 2) {
            Image(systemName: tab.systemImage)
                .font(.system(size: 20, weight: active ? .bold : .semibold))
                // Subtle lift on the active icon adds to the "responsive to touch"
                // feel without a separate animation call.
                .scaleEffect(active ? 1.06 : 1.0)
            Text(lang.t(tab.shortTitle))
                .font(.system(size: 10, weight: active ? .heavy : .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .foregroundStyle(active ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
        .frame(maxWidth: .infinity)
        .animation(.spring(response: 0.34, dampingFraction: 0.7), value: active)
    }

    // MARK: - Motion

    /// One place owns the transition, so rapid taps can only ever re-target a single
    /// spring — no competing animations, no desync.
    private func switchTo(_ tab: AppTab) {
        guard tab != selection,
              let from = tabs.firstIndex(of: selection),
              let to = tabs.firstIndex(of: tab) else { return }

        let distance = CGFloat(abs(to - from))
        // Velocity proxy: farther jump → more stretch (capped so it stays tasteful).
        let peak = 1.0 + min(0.34, 0.17 * distance)
        // Lead with the travel direction so the bubble's front edge reaches ahead.
        stretchAnchor = to > from ? .leading : .trailing

        // 1) Position + size FLOW — a responsive spring with a touch of overshoot so
        //    it settles with life, not a dead ease.
        withAnimation(.spring(response: 0.44, dampingFraction: 0.74)) {
            selection = tab
        }

        // 2) Elastic squash-&-stretch, decoupled: a fast snappy stretch OUT …
        withAnimation(.spring(response: 0.17, dampingFraction: 0.58)) {
            stretchX = peak
        }
        // … then a softer settle back to rest, slightly delayed so the deform trails
        //    the motion (the liquid "catch up").
        withAnimation(.spring(response: 0.46, dampingFraction: 0.7).delay(0.07)) {
            stretchX = 1
        }
    }

    // MARK: - Surfaces

    private var liquidBubble: some View {
        Capsule()
            .fill(colorScheme == .dark ? Color.white.opacity(0.10) : Color.white.opacity(0.55))
            .liquidSurface()
            // Dynamic specular highlight — a bright top edge that reads as light
            // bending across the glass.
            .overlay(
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.white.opacity(colorScheme == .dark ? 0.22 : 0.55), .clear],
                            startPoint: .top, endPoint: .center
                        )
                    )
                    .blendMode(.plusLighter)
                    .allowsHitTesting(false)
            )
            // Neutral rim so the glass edge is visible over any background.
            .overlay(
                Capsule().strokeBorder(
                    LinearGradient(
                        colors: [.white.opacity(0.9), .white.opacity(0.15), .white.opacity(0.4)],
                        startPoint: .top, endPoint: .bottom
                    ),
                    lineWidth: 0.8
                )
            )
            .shadow(color: FrigyBrand.primary.opacity(0.18), radius: 10, y: 4)
            .shadow(color: .black.opacity(0.06), radius: 3, y: 1)
            // Volume-preserving squash-&-stretch anchored to the travel direction.
            .scaleEffect(x: stretchX, y: 2 - stretchX, anchor: stretchAnchor)
    }

    @ViewBuilder
    private var barBackground: some View {
        Capsule()
            .fill(.ultraThinMaterial)
            .overlay(
                Capsule().strokeBorder(
                    (colorScheme == .dark ? Color.white.opacity(0.10) : Color.white.opacity(0.5)),
                    lineWidth: 0.8
                )
            )
            .shadow(color: .black.opacity(0.10), radius: 14, y: 6)
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
    /// Adaptive translucent surface. Real Liquid Glass on iOS 26; `.ultraThinMaterial`
    /// (adaptive, content-bending blur) on iOS 18 — swap point for the migration.
    @ViewBuilder
    func liquidSurface() -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(.regular.interactive(), in: .capsule)
        } else {
            self.background(.ultraThinMaterial, in: Capsule())
        }
    }
}
