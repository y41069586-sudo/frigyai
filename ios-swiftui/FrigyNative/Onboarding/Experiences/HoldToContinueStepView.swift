import SwiftUI

/// SCREEN 1 — "Press & Shape" experience.
/// A soft surface physically deforms under the finger — liquid/material feel.
/// After ~3–5 s of cumulative interaction OR reaching full deformation,
/// a "Continue" CTA appears. No game loop — clear guided funnel.
struct HoldToContinueStepView: View {
    let onBack: (() -> Void)?
    let onNext: () -> Void

    // Deformation state
    @State private var touchPoint: CGPoint = .zero
    @State private var touchRadius: CGFloat = 0       // 0 when not pressing
    @State private var deformDepth: CGFloat = 0       // 0–1, how deep the dent is
    @State private var ripples: [Ripple] = []

    // Completion logic
    @State private var interactionSeconds: Double = 0  // accumulated engagement
    @State private var ctaVisible: Bool = false
    @State private var ctaScale: Double = 0.86
    @State private var autoAdvanceTask: Task<Void, Never>? = nil

    private let targetSeconds: Double = 3.5
    private let tick = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common).autoconnect()

    // Ripple model
    struct Ripple: Identifiable {
        let id = UUID()
        let origin: CGPoint
        var radius: CGFloat = 0
        var opacity: Double = 0.7
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                AmbientBackground(intensity: 0.5 + deformDepth * 0.6, motion: 0.7 + deformDepth * 0.5)

                // The "surface" canvas
                surfaceCanvas(in: geo.size)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)

                ParticleField(count: 22, speed: 0.6 + deformDepth * 0.5,
                              intensity: 0.3 + deformDepth * 0.7)

                chrome(in: geo)
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { v in
                        let pt = v.location
                        if touchRadius < 1 {
                            // first contact
                            ExperienceHaptics.impact(.light, intensity: 0.5)
                            addRipple(at: pt)
                        }
                        touchPoint = pt
                        withAnimation(.interactiveSpring(response: 0.25, dampingFraction: 0.6)) {
                            touchRadius = 120
                            deformDepth = min(1, deformDepth + 0.06)
                        }
                    }
                    .onEnded { v in
                        addRipple(at: v.location)
                        withAnimation(.spring(response: 0.5, dampingFraction: 0.55)) {
                            touchRadius = 0
                        }
                    }
            )
        }
        .onReceive(tick) { _ in tick60() }
    }

    // MARK: - Surface

    @ViewBuilder
    private func surfaceCanvas(in size: CGSize) -> some View {
        TimelineView(.animation) { tl in
            let t = tl.date.timeIntervalSinceReferenceDate
            Canvas { ctx, sz in
                // Base surface layer
                let baseColor = ExperiencePalette.accent.opacity(0.07 + deformDepth * 0.10)
                ctx.fill(Path(CGRect(origin: .zero, size: sz)), with: .color(baseColor))

                // Deformation dent — soft gaussian-like glow under finger
                if touchRadius > 1 {
                    let cx = touchPoint.x
                    let cy = touchPoint.y
                    let r = touchRadius * (1 + 0.12 * sin(t * 4))
                    let shading = GraphicsContext.Shading.radialGradient(
                        Gradient(colors: [
                            ExperiencePalette.accent.opacity(0.38 * deformDepth),
                            ExperiencePalette.accentGlow.opacity(0.15 * deformDepth),
                            ExperiencePalette.accent.opacity(0),
                        ]),
                        center: CGPoint(x: cx, y: cy),
                        startRadius: 0,
                        endRadius: r
                    )
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2)),
                        with: shading
                    )
                }

                // Ripple rings
                for ripple in ripples {
                    let rr = ripple.radius
                    let c = touchPoint
                    let ringPath = Path(ellipseIn: CGRect(
                        x: ripple.origin.x - rr, y: ripple.origin.y - rr,
                        width: rr * 2, height: rr * 2
                    ))
                    ctx.stroke(ringPath,
                               with: .color(ExperiencePalette.accentGlow.opacity(ripple.opacity * 0.5)),
                               lineWidth: 1.2)
                    _ = c
                }

                // Grid mesh that warps near touch (surface topology feel)
                let cols = 10
                let rows = 16
                let cw = sz.width / CGFloat(cols)
                let ch = sz.height / CGFloat(rows)
                for row in 0...rows {
                    for col in 0...cols {
                        let bx = CGFloat(col) * cw
                        let by = CGFloat(row) * ch
                        let dx = bx - touchPoint.x
                        let dy = by - touchPoint.y
                        let dist = sqrt(dx * dx + dy * dy)
                        let maxR: CGFloat = 160
                        let pull = touchRadius > 1 ? max(0, 1 - dist / maxR) : 0
                        let warpX = bx - dx * pull * 0.08 * deformDepth
                        let warpY = by - dy * pull * 0.08 * deformDepth
                        let pt = CGPoint(x: warpX, y: warpY)
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: pt.x - 1, y: pt.y - 1, width: 2, height: 2)),
                            with: .color(ExperiencePalette.accent.opacity(0.08 + pull * 0.14 * deformDepth))
                        )
                    }
                }
            }
        }
    }

    // MARK: - Chrome

    @ViewBuilder
    private func chrome(in geo: GeometryProxy) -> some View {
        VStack(spacing: 0) {
            HStack {
                if let onBack {
                    ExperienceBackButton(action: onBack)
                } else {
                    Color.clear.frame(width: 42, height: 42)
                }
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)

            Spacer()

            VStack(spacing: 12) {
                Text("Dein Erlebnis\nentsteht gerade")
                    .font(.system(size: 28, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(ExperiencePalette.textPrimary)
                    .lineSpacing(2)
                    .shadow(color: ExperiencePalette.accentGlow.opacity(0.3 * deformDepth), radius: 16)

                Text("Berühre den Bildschirm")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(ExperiencePalette.textMuted)
                    .opacity(ctaVisible ? 0 : 1)
                    .animation(.easeOut(duration: 0.4), value: ctaVisible)
            }
            .padding(.horizontal, 32)

            Spacer()

            // Progress hint bar
            progressBar

            Spacer().frame(height: 32)

            // CTA — appears after engagement threshold
            if ctaVisible {
                ExperienceCTAButton(title: "Weiter", action: onNext)
                    .padding(.horizontal, 28)
                    .padding(.bottom, 40)
                    .scaleEffect(ctaScale)
                    .animation(.spring(response: 0.5, dampingFraction: 0.7), value: ctaScale)
                    .onAppear {
                        withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                            ctaScale = 1.0
                        }
                    }
            } else {
                Color.clear.frame(height: 98)
                    .padding(.bottom, 40)
            }
        }
    }

    private var progressBar: some View {
        let fraction = min(1, interactionSeconds / targetSeconds)
        return ZStack(alignment: .leading) {
            Capsule()
                .fill(Color.white.opacity(0.08))
                .frame(height: 3)
            Capsule()
                .fill(
                    LinearGradient(colors: [ExperiencePalette.accentGlow, ExperiencePalette.accent],
                                   startPoint: .leading, endPoint: .trailing)
                )
                .frame(width: max(0, CGFloat(fraction) * 220), height: 3)
                .animation(.linear(duration: 1.0 / 60.0), value: fraction)
        }
        .frame(width: 220)
        .opacity(ctaVisible ? 0 : 0.7)
        .animation(.easeOut(duration: 0.5), value: ctaVisible)
    }

    // MARK: - Tick

    private func tick60() {
        // Animate ripples outward & fade
        for i in ripples.indices {
            ripples[i].radius += 2.2
            ripples[i].opacity -= 0.018
        }
        ripples.removeAll { $0.opacity <= 0 || $0.radius > 220 }

        // Accumulate engagement while touching
        if touchRadius > 1 {
            interactionSeconds += 1.0 / 60.0
        }

        // Decay deformation slowly when not pressing
        if touchRadius < 1 && deformDepth > 0 {
            deformDepth = max(0, deformDepth - (1.0 / 60.0) / 2.0)
        }

        // Reveal CTA once threshold is met
        if !ctaVisible && interactionSeconds >= targetSeconds {
            ctaVisible = true
            ExperienceHaptics.impact(.medium, intensity: 0.8)
        }
    }

    private func addRipple(at point: CGPoint) {
        ripples.append(Ripple(origin: point))
    }
}
