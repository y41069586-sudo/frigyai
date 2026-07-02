import SwiftUI

/// Bottom navigation with an Apple-"Liquid Glass"-style motion system.
///
/// The key correction in this version: on Apple's own surfaces (iOS 26 tab
/// bars, Dynamic Island, Apple Pay) Liquid Glass is a TRANSITION effect, not a
/// permanent visual state. At rest the selection indicator is a clean,
/// near-static, minimally-translucent pill. The glass surface, specular
/// highlight and rim only gain visual weight WHILE something is moving, then
/// fade back out as it settles — they never sit at full intensity at idle.
///
/// This is driven by a single continuous `liquidIntensity` (0...1) plus a
/// `motionPhase` enum (`idle` / `moving` / `settling`) for phase bookkeeping.
/// The selection bubble itself still FLOWS between tabs via
/// `matchedGeometryEffect` (SwiftUI owns the geometry, so there is no manual
/// frame math, no layout jitter and no state desync on rapid tapping), and a
/// volume-preserving squash-&-stretch layer gives the elastic "liquid"
/// deformation whose intensity scales with travel distance — a velocity
/// proxy, since taps have no real velocity to read.
struct GlassTabBar: View {
    @Binding var selection: AppTab
    var mealCount: Int = 0
    var onTrackerTap: (() -> Void)? = nil

    @Environment(LanguageManager.self) private var lang
    @Environment(\.colorScheme) private var colorScheme

    private let tabs: [AppTab] = [.home, .plans, .shopping]

    /// Namespace the bubble morphs within. Migrates 1:1 to iOS 26 `glassEffectID`.
    @Namespace private var bubbleNS

    private enum MotionPhase {
        case idle
        case moving
        case settling
    }

    // MARK: Motion-phase state

    /// Coarse phase bookkeeping. Purely descriptive — all actual visuals are
    /// driven continuously by `liquidIntensity` / `stretchX` below, so a phase
    /// change never causes a visual "pop".
    @State private var motionPhase: MotionPhase = .idle
    /// True for the whole moving+settling window. Exposed mainly so future
    /// consumers (haptics, debug UI) can key off a single boolean instead of
    /// the phase enum.
    @State private var isTransitioning: Bool = false
    /// 0 = clean idle pill, 1 = full transient glass. Rises fast on tap,
    /// decays back to 0 once the flow has visually landed — this is the knob
    /// that keeps Liquid Glass a MOTION-ONLY effect.
    @State private var liquidIntensity: CGFloat = 0
    /// Generation counter so a settle scheduled by an earlier tap can't
    /// clobber phase state for a newer, still-in-flight tap (interruptible
    /// springs need interruptible bookkeeping too).
    @State private var motionToken: Int = 0

    // Squash-&-stretch state, driven independently of the position spring so the two
    // compose without fighting. `stretchX` > 1 elongates along travel; `y` compresses
    // to preserve volume (the classic liquid deform). `anchor` points at the travel
    // direction so the leading edge reaches ahead before the body catches up. This
    // already self-resets to 1 at rest, so it was never the "permanent liquid" bug —
    // the always-visible glass surface/highlight/rim were.
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
                    // The transient glass sits ABOVE the icon/label, not behind it.
                    // Real backdrop glass (iOS 26 `glassEffect`) optically bends
                    // whatever is beneath it — placing it in front is what lets it
                    // genuinely refract the glyph as the pill slides across it,
                    // instead of just tinting a static background.
                    .overlay {
                        if active {
                            motionLens
                                .matchedGeometryEffect(id: "motionLens", in: bubbleNS)
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
    /// set of springs — no competing animations, no desync. Interruptible: a new tap
    /// bumps `motionToken`, so any settle scheduled by the previous tap silently no-ops.
    private func switchTo(_ tab: AppTab) {
        guard tab != selection,
              let from = tabs.firstIndex(of: selection),
              let to = tabs.firstIndex(of: tab) else { return }

        let distance = CGFloat(abs(to - from))
        // Velocity proxy: farther jump → more stretch (capped so it stays tasteful).
        let peak = 1.0 + min(0.34, 0.17 * distance)
        // Lead with the travel direction so the bubble's front edge reaches ahead.
        stretchAnchor = to > from ? .leading : .trailing

        motionToken += 1
        let token = motionToken
        motionPhase = .moving
        isTransitioning = true

        // MOTION turns the glass ON: a fast rise so the transient surface is present
        // the instant travel begins — never a resting-state default.
        withAnimation(.spring(response: 0.12, dampingFraction: 0.8)) {
            liquidIntensity = 1
        }

        // Position + size FLOW — a responsive spring with a touch of overshoot so
        // it settles with life, not a dead ease.
        withAnimation(.spring(response: 0.44, dampingFraction: 0.74)) {
            selection = tab
        }

        // Elastic squash-&-stretch, decoupled: a fast snappy stretch OUT …
        withAnimation(.spring(response: 0.17, dampingFraction: 0.58)) {
            stretchX = peak
        }
        // … then a softer settle back to rest, slightly delayed so the deform trails
        //    the motion (the liquid "catch up").
        withAnimation(.spring(response: 0.46, dampingFraction: 0.7).delay(0.07)) {
            stretchX = 1
        }

        // SETTLE: once the flow has visually landed, calm the glass back OFF. This
        // is what keeps Liquid Glass a TRANSITION effect instead of a permanent
        // surface — the idle pill it fades into is the same clean, minimal base
        // that was there before the tap.
        withAnimation(.easeOut(duration: 0.32).delay(0.30)) {
            liquidIntensity = 0
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.30) {
            guard token == motionToken else { return }
            motionPhase = .settling
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.62) {
            guard token == motionToken else { return }
            motionPhase = .idle
            isTransitioning = false
        }
    }

    // MARK: - Surfaces

    /// IDLE base — always present, deliberately unglamorous: a quiet translucent
    /// fill and a hairline border. This is the resting state Apple's own tab bar
    /// shows almost all of the time; it sits BEHIND the icon/label as usual.
    private var liquidBubble: some View {
        Capsule()
            .fill(idleFillColor)
            .overlay(
                Capsule().strokeBorder(idleBorderColor, lineWidth: 0.75)
            )
            .shadow(color: .black.opacity(0.05), radius: 2, y: 1)
            .scaleEffect(x: stretchX, y: 2 - stretchX, anchor: stretchAnchor)
    }

    /// MOTION lens — the real Liquid Glass: adaptive material, specular highlight,
    /// bright rim and dark lens-edge lines (the top/bottom hairlines a real optical
    /// lens shows). Rendered ABOVE the icon/label so on iOS 26 the system
    /// `glassEffect` genuinely refracts the glyph beneath it as it slides — the
    /// warped-icon look during a transition. Opacity is `liquidIntensity`, so it
    /// only carries visual weight while MOVING/SETTLING and is invisible at idle.
    private var motionLens: some View {
        Capsule()
            .fill(motionFillColor)
            .liquidSurface()
            .overlay(specularHighlight)
            .overlay(rimHighlight)
            .overlay(lensEdgeLines)
            .shadow(color: FrigyBrand.primary.opacity(0.18), radius: 10, y: 4)
            .shadow(color: .black.opacity(0.06), radius: 3, y: 1)
            .opacity(liquidIntensity)
            .allowsHitTesting(false)
            .scaleEffect(x: stretchX, y: 2 - stretchX, anchor: stretchAnchor)
    }

    private var idleFillColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.12) : Color.white.opacity(0.68)
    }

    private var idleBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.05)
    }

    private var motionFillColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.10) : Color.white.opacity(0.55)
    }

    /// Dynamic specular highlight — a bright top edge that reads as light bending
    /// across the glass. Only ever seen through the `liquidIntensity`-gated layer.
    private var specularHighlight: some View {
        Capsule()
            .fill(
                LinearGradient(
                    colors: [.white.opacity(colorScheme == .dark ? 0.22 : 0.55), .clear],
                    startPoint: .top, endPoint: .center
                )
            )
            .blendMode(.plusLighter)
            .allowsHitTesting(false)
    }

    /// Neutral rim so the glass edge is visible over any background.
    private var rimHighlight: some View {
        Capsule().strokeBorder(
            LinearGradient(
                colors: [.white.opacity(0.9), .white.opacity(0.15), .white.opacity(0.4)],
                startPoint: .top, endPoint: .bottom
            ),
            lineWidth: 0.8
        )
    }

    /// The thin dark hairline a real optical lens shows near its top and bottom
    /// edge — light grazing the curved glass surface reads as a dark line right
    /// before the bright refracted band. Purely cosmetic, but it's what sells a
    /// pill as GLASS rather than a flat tinted shape.
    private var lensEdgeLines: some View {
        VStack {
            Capsule()
                .fill(Color.black.opacity(0.16))
                .frame(height: 1.5)
                .padding(.horizontal, 16)
                .padding(.top, 4)
            Spacer(minLength: 0)
            Capsule()
                .fill(Color.black.opacity(0.12))
                .frame(height: 1.5)
                .padding(.horizontal, 16)
                .padding(.bottom, 4)
        }
        .allowsHitTesting(false)
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
