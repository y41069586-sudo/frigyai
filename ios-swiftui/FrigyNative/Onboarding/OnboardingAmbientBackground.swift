import SwiftUI

// MARK: - Cinematic ambient background

/// A single, persistent cinematic ambient layer that lives behind the *entire*
/// onboarding flow.
///
/// It is mounted exactly once in `OnboardingSkeletonView` — whose identity never
/// changes as the individual steps swap in and out — so its motion is perfectly
/// continuous across every screen. This is what gives the "one continuous motion
/// flow" feel: as the glass step-panels slide past, the light, gradients and
/// particles behind them keep drifting without ever resetting.
///
/// Driven by `TimelineView(.animation)` (time-based, not state-based) so the
/// animation can never desync or restart on a step change, and stays buttery
/// smooth. Honors Reduce Motion by falling back to a static composition.
struct OnboardingAmbientBackground: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        GeometryReader { geo in
            let size = geo.size
            Group {
                if reduceMotion {
                    composition(at: 0, size: size)
                } else {
                    // Cap at ~30fps: the drift is slow and luxurious, so 30fps is
                    // visually identical to 60 while halving the GPU cost of the
                    // soft blurs — keeps it smooth even on older devices.
                    TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: false)) { timeline in
                        let t = timeline.date.timeIntervalSinceReferenceDate
                        composition(at: t, size: size)
                    }
                }
            }
        }
        .ignoresSafeArea()
    }

    // MARK: Composition

    @ViewBuilder
    private func composition(at t: TimeInterval, size: CGSize) -> some View {
        let w = size.width
        let h = size.height
        ZStack {
            baseGradient

            // Floating light blobs — drift on slow Lissajous paths and gently
            // "breathe", giving fluid morphing, ambient lighting and depth.
            blob(color: FrigyBrand.primary,
                 base: CGPoint(x: 0.20, y: 0.16), amp: CGSize(width: 0.06, height: 0.05),
                 speed: 0.018, phase: 0.0, diameter: w * 1.05, opacity: blobOpacity, t: t, w: w, h: h)
            blob(color: FrigyBrand.primaryDark,
                 base: CGPoint(x: 0.84, y: 0.28), amp: CGSize(width: 0.05, height: 0.07),
                 speed: 0.015, phase: 1.7, diameter: w * 0.95, opacity: blobOpacity * 0.85, t: t, w: w, h: h)
            blob(color: accentBlue,
                 base: CGPoint(x: 0.28, y: 0.84), amp: CGSize(width: 0.07, height: 0.05),
                 speed: 0.013, phase: 3.1, diameter: w * 1.0, opacity: blobOpacity * 0.6, t: t, w: w, h: h)
            blob(color: FrigyBrand.primary,
                 base: CGPoint(x: 0.80, y: 0.90), amp: CGSize(width: 0.05, height: 0.06),
                 speed: 0.016, phase: 4.6, diameter: w * 0.85, opacity: blobOpacity * 0.55, t: t, w: w, h: h)

            // Synchronized particle accents — a soft field of motes drifting
            // upward with subtle parallax sway and twinkle.
            ParticleField(t: t, tint: particleTint)
                .blendMode(colorScheme == .dark ? .plusLighter : .normal)
        }
    }

    // MARK: Blob

    private func blob(color: Color, base: CGPoint, amp: CGSize,
                      speed: Double, phase: Double, diameter: CGFloat,
                      opacity: Double, t: TimeInterval, w: CGFloat, h: CGFloat) -> some View {
        let angle = t * speed * 2 * .pi
        let x = (base.x + amp.width  * CGFloat(sin(angle + phase))) * w
        let y = (base.y + amp.height * CGFloat(cos(angle * 1.3 + phase))) * h
        let breathe = 1.0 + 0.07 * CGFloat(sin(t * 0.10 + phase))
        return Circle()
            .fill(
                RadialGradient(
                    colors: [color.opacity(opacity), color.opacity(0)],
                    center: .center, startRadius: 0, endRadius: diameter * 0.5
                )
            )
            .frame(width: diameter * breathe, height: diameter * breathe)
            .position(x: x, y: y)
            .blur(radius: 30)
    }

    // MARK: Tokens

    private var baseGradient: some View {
        LinearGradient(
            colors: colorScheme == .dark
                ? [Color(hex: "#0A150E"), Color(hex: "#08130C")]
                : [Color(hex: "#FBFFFD"), Color(hex: "#F1FFF8")],
            startPoint: .top, endPoint: .bottom
        )
    }

    private var blobOpacity: Double { colorScheme == .dark ? 0.24 : 0.30 }
    private var particleTint: Color { colorScheme == .dark ? FrigyBrand.primary : FrigyBrand.primaryDark }
    private var accentBlue: Color { Color(hex: "#8FD4FB") }
}

// MARK: - Particle field

/// A lightweight GPU particle field rendered via `Canvas`. Particles are fully
/// deterministic functions of time (hashed by index), so there is no per-frame
/// allocation and nothing to keep in state — it composites for free behind the
/// step panels.
private struct ParticleField: View {
    let t: TimeInterval
    let tint: Color

    private let count = 26

    var body: some View {
        Canvas { ctx, size in
            for i in 0..<count {
                let seed = Double(i)
                // Stable pseudo-random horizontal home + per-particle speed.
                let randX = frac(sin(seed * 12.9898) * 43758.5453)
                let speed = 0.010 + frac(sin(seed * 78.233) * 12345.678) * 0.018
                let drift = frac(seed * 0.61803398875) // golden-ratio spread

                // Upward travel that wraps seamlessly 0→1.
                var prog = drift + t * speed
                prog -= floor(prog)

                let sway = CGFloat(sin(t * 0.25 + seed * 1.7)) * 16
                let px = CGFloat(randX) * size.width + sway
                let py = (1 - CGFloat(prog)) * size.height

                let radius = CGFloat(1.3 + frac(sin(seed * 5.0) * 999.0) * 2.4)
                // Gentle twinkle + fade near the top/bottom edges.
                let twinkle = 0.10 + 0.16 * (sin(t * 0.6 + seed * 2.3) * 0.5 + 0.5)
                let edgeFade = min(1, min(prog, 1 - prog) * 4)
                let alpha = twinkle * edgeFade

                let rect = CGRect(x: px - radius, y: py - radius, width: radius * 2, height: radius * 2)
                ctx.fill(Path(ellipseIn: rect), with: .color(tint.opacity(alpha)))
            }
        }
        .allowsHitTesting(false)
    }

    private func frac(_ v: Double) -> Double {
        let f = v - floor(v)
        return f < 0 ? f + 1 : f
    }
}

// MARK: - Scaffold veil

/// Translucent scrim placed behind every onboarding step's content (via
/// `OnboardingStepScaffold`). It keeps text and cards perfectly legible while
/// letting the shared `OnboardingAmbientBackground` glow softly through — the
/// glassmorphism layer that ties every screen to the same continuous backdrop.
struct OnboardingScaffoldVeil: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            LinearGradient(
                colors: colorScheme == .dark
                    ? [Color(hex: "#0A150E").opacity(0.46), Color(hex: "#0A150E").opacity(0.72)]
                    : [Color(hex: "#FBFFFD").opacity(0.55), Color(hex: "#FBFFFD").opacity(0.80)],
                startPoint: .top, endPoint: .bottom
            )
            // Hairline top sheen for that "frosted glass catching light" feel.
            LinearGradient(
                colors: [Color.white.opacity(colorScheme == .dark ? 0.04 : 0.30), .clear],
                startPoint: .top, endPoint: .center
            )
            .blendMode(.plusLighter)
        }
    }
}
