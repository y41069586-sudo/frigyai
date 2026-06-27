import SwiftUI
import UIKit

// MARK: - Shared cinematic design language
//
// The three onboarding "experience" screens (Hold-to-Continue, Energy-Swipe,
// Momentum-Reveal) share one dark, premium, glassmorphic motion language so they
// feel like a single immersive thread woven through the normal questionnaire.

enum ExperiencePalette {
    static let base       = Color(hex: "#050B08")   // near-black green
    static let baseRaise  = Color(hex: "#0A1A12")
    static let accent     = Color(hex: "#75FBB2")   // brand mint
    static let accentDeep = Color(hex: "#2EB56D")
    static let accentGlow = Color(hex: "#4AE896")
    static let textPrimary = Color.white
    static let textMuted   = Color.white.opacity(0.6)
}

// MARK: - Haptics

enum ExperienceHaptics {
    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium, intensity: CGFloat = 1) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred(intensity: intensity)
    }

    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}

// MARK: - Color blending

extension Color {
    /// Linear RGB interpolation toward another color (0 = self, 1 = other).
    func blended(with other: Color, amount: Double) -> Color {
        let t = CGFloat(max(0, min(1, amount)))
        let c1 = UIColor(self)
        let c2 = UIColor(other)
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0
        c1.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        c2.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        return Color(
            red: Double(r1 + (r2 - r1) * t),
            green: Double(g1 + (g2 - g1) * t),
            blue: Double(b1 + (b2 - b1) * t)
        )
    }
}

// MARK: - Ambient lighting background
//
// Soft, slowly drifting radial "blobs" of light. No per-frame blur (radial
// falloff is already soft) so it stays buttery at 60fps even on older phones.

struct AmbientBackground: View {
    var tint: Color = ExperiencePalette.accent
    var secondaryTint: Color = ExperiencePalette.accentDeep
    var intensity: Double = 1
    var motion: Double = 1

    var body: some View {
        TimelineView(.animation) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate * 0.12 * motion
            Canvas { ctx, size in
                ctx.fill(Path(CGRect(origin: .zero, size: size)),
                         with: .color(ExperiencePalette.base))

                let blobs: [(x: Double, y: Double, r: Double, color: Color)] = [
                    (0.28 + 0.12 * sin(t),         0.26 + 0.10 * cos(t * 0.8), 0.62, tint),
                    (0.74 + 0.10 * cos(t * 0.9),   0.36 + 0.12 * sin(t * 1.1), 0.55, secondaryTint),
                    (0.50 + 0.14 * sin(t * 0.7 + 1), 0.80 + 0.08 * cos(t * 1.2), 0.7, ExperiencePalette.accentGlow),
                ]

                for blob in blobs {
                    let center = CGPoint(x: blob.x * size.width, y: blob.y * size.height)
                    let radius = blob.r * max(size.width, size.height)
                    let shading = GraphicsContext.Shading.radialGradient(
                        Gradient(colors: [
                            blob.color.opacity(0.55 * intensity),
                            blob.color.opacity(0),
                        ]),
                        center: center, startRadius: 0, endRadius: radius
                    )
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: center.x - radius, y: center.y - radius,
                                               width: radius * 2, height: radius * 2)),
                        with: shading
                    )
                }
            }
            .ignoresSafeArea()
        }
        .background(ExperiencePalette.base.ignoresSafeArea())
    }
}

// MARK: - Floating particle field

struct ParticleField: View {
    var count: Int = 26
    var color: Color = ExperiencePalette.accentGlow
    var speed: Double = 1
    var intensity: Double = 1
    /// Subtle bias the whole field drifts toward (used for finger parallax).
    var bias: CGSize = .zero

    private let seeds: [Seed]

    struct Seed {
        let x, y, r, phase, drift: Double
    }

    init(count: Int = 26,
         color: Color = ExperiencePalette.accentGlow,
         speed: Double = 1,
         intensity: Double = 1,
         bias: CGSize = .zero) {
        self.count = count
        self.color = color
        self.speed = speed
        self.intensity = intensity
        self.bias = bias
        var rng = SystemRandomNumberGenerator()
        self.seeds = (0..<count).map { _ in
            Seed(
                x: Double.random(in: 0...1, using: &rng),
                y: Double.random(in: 0...1, using: &rng),
                r: Double.random(in: 0.8...2.6, using: &rng),
                phase: Double.random(in: 0...(2 * .pi), using: &rng),
                drift: Double.random(in: 0.3...1.0, using: &rng)
            )
        }
    }

    var body: some View {
        TimelineView(.animation) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate * speed
            Canvas { ctx, size in
                for seed in seeds {
                    var yy = (seed.y - t * 0.02 * seed.drift).truncatingRemainder(dividingBy: 1)
                    if yy < 0 { yy += 1 }
                    let twinkle = 0.35 + 0.65 * abs(sin(t * seed.drift + seed.phase))
                    let point = CGPoint(
                        x: seed.x * size.width + 8 * sin(t * 0.5 + seed.phase) + bias.width * seed.drift,
                        y: yy * size.height + bias.height * seed.drift
                    )
                    let r = seed.r
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: point.x - r, y: point.y - r, width: r * 2, height: r * 2)),
                        with: .color(color.opacity(0.5 * twinkle * intensity))
                    )
                }
            }
            .ignoresSafeArea()
        }
        .allowsHitTesting(false)
    }
}

// MARK: - Shared chrome

struct ExperienceBackButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: {
            ExperienceHaptics.impact(.light, intensity: 0.6)
            action()
        }) {
            Image(systemName: "chevron.left")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white.opacity(0.9))
                .frame(width: 42, height: 42)
                .background(.ultraThinMaterial, in: Circle())
                .overlay(Circle().stroke(.white.opacity(0.16), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

/// Glassy capsule CTA with a soft accent glow and a gentle breathing pulse.
struct ExperienceCTAButton: View {
    let title: String
    var pulses: Bool = true
    let action: () -> Void

    @State private var pulse = false

    var body: some View {
        Button(action: {
            ExperienceHaptics.impact(.medium)
            action()
        }) {
            HStack(spacing: 10) {
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
                Image(systemName: "arrow.right")
                    .font(.system(size: 15, weight: .bold))
            }
            .foregroundStyle(ExperiencePalette.base)
            .frame(maxWidth: .infinity)
            .frame(height: 58)
            .background(
                LinearGradient(colors: [ExperiencePalette.accent, ExperiencePalette.accentDeep],
                               startPoint: .leading, endPoint: .trailing),
                in: Capsule()
            )
            .overlay(Capsule().stroke(.white.opacity(0.25), lineWidth: 1))
            .shadow(color: ExperiencePalette.accentGlow.opacity(pulse ? 0.65 : 0.35),
                    radius: pulse ? 26 : 16, y: 8)
            .scaleEffect(pulse ? 1.015 : 1)
        }
        .buttonStyle(.plain)
        .onAppear {
            guard pulses else { return }
            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}

// MARK: - Liquid fill shape (sine-wave top edge)

struct LiquidFillShape: Shape {
    /// 0 = empty (bottom), 1 = full (covers everything).
    var progress: Double
    /// Continuously advancing phase for the travelling wave.
    var phase: Double
    var amplitude: CGFloat = 14

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let clamped = max(0, min(1, progress))
        let surfaceY = rect.height * (1 - clamped)
        let amp = amplitude * CGFloat(min(1, clamped * 2.2)) // calm near full

        path.move(to: CGPoint(x: 0, y: rect.height))
        path.addLine(to: CGPoint(x: 0, y: surfaceY))

        let steps = 60
        for i in 0...steps {
            let x = rect.width * CGFloat(i) / CGFloat(steps)
            let rel = Double(i) / Double(steps)
            let y = surfaceY + sin(rel * .pi * 2 * 1.5 + phase) * amp
                            + sin(rel * .pi * 2 * 3 + phase * 1.7) * amp * 0.35
            path.addLine(to: CGPoint(x: x, y: y))
        }

        path.addLine(to: CGPoint(x: rect.width, y: rect.height))
        path.closeSubpath()
        return path
    }
}
