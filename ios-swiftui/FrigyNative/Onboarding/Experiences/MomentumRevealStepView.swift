import SwiftUI

/// SCREEN 3 — "Momentum reveal" experience (placed shortly before finalization).
/// Starts dark and minimal; UI materializes cinematically over a few seconds.
/// Dragging accelerates the reveal — more drag means more light, color and depth.
/// Everything converges into "Your experience is ready" with a clean CTA.
struct MomentumRevealStepView: View {
    let onBack: (() -> Void)?
    let onNext: () -> Void

    /// 0 = dark/minimal, 1 = fully revealed.
    @State private var reveal: Double = 0
    @State private var fingerBias: CGSize = .zero
    @State private var lastDrag: CGFloat = 0
    private let tick = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common).autoconnect()

    private struct Feature {
        let title: String
        let subtitle: String
        let symbol: String
        let appearAt: Double
    }

    private let features: [Feature] = [
        Feature(title: "KI-Coaching", subtitle: "Persönlich auf dich abgestimmt", symbol: "sparkles", appearAt: 0.18),
        Feature(title: "Smarte Pläne", subtitle: "Jede Woche neu, automatisch", symbol: "calendar", appearAt: 0.40),
        Feature(title: "Echte Insights", subtitle: "Sieh deinen Fortschritt klar", symbol: "chart.line.uptrend.xyaxis", appearAt: 0.62),
    ]

    private var converged: Bool { reveal >= 0.985 }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                AmbientBackground(intensity: 0.15 + reveal * 1.0, motion: 0.6 + reveal * 0.8)
                    .opacity(0.4 + reveal * 0.6)

                ParticleField(count: 30, speed: 0.7 + reveal,
                              intensity: 0.1 + reveal * 0.9, bias: fingerBias)

                // Volumetric central light that intensifies with reveal.
                RadialGradient(
                    colors: [ExperiencePalette.accentGlow.opacity(0.5 * reveal),
                             ExperiencePalette.accent.opacity(0)],
                    center: .center, startRadius: 0, endRadius: 320
                )
                .scaleEffect(0.6 + reveal * 0.8)
                .ignoresSafeArea()
                .allowsHitTesting(false)

                content(in: geo)

                if !converged {
                    hintOverlay
                }
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        let dy = value.translation.height - lastDrag
                        lastDrag = value.translation.height
                        // Any motion (mostly upward) accelerates the reveal.
                        let delta = abs(dy) / 900.0 + max(0, -dy) / 600.0
                        bump(by: delta)
                        fingerBias = CGSize(width: value.translation.width * 0.06,
                                            height: value.translation.height * 0.05)
                    }
                    .onEnded { _ in
                        lastDrag = 0
                        withAnimation(.easeOut(duration: 1.2)) { fingerBias = .zero }
                    }
            )
        }
        .onReceive(tick) { _ in autoReveal() }
    }

    @ViewBuilder
    private func content(in geo: GeometryProxy) -> some View {
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

            // Floating glass feature cards that materialize as reveal grows.
            VStack(spacing: 16) {
                ForEach(Array(features.enumerated()), id: \.offset) { i, feature in
                    featureCard(feature, depth: i)
                }
            }
            .padding(.horizontal, 28)

            Spacer().frame(height: 28)

            // Converged message + CTA.
            VStack(spacing: 18) {
                Text("Your experience is ready")
                    .font(.system(size: 26, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(ExperiencePalette.textPrimary)
                    .padding(.horizontal, 28)
                    .opacity(convergeProgress)
                    .blur(radius: (1 - convergeProgress) * 10)
                    .scaleEffect(0.9 + convergeProgress * 0.1)

                ExperienceCTAButton(title: "Los geht's", action: onNext)
                    .padding(.horizontal, 28)
                    .opacity(convergeProgress)
                    .scaleEffect(0.92 + convergeProgress * 0.08)
                    .allowsHitTesting(converged)
            }

            Spacer()
        }
    }

    /// Eased 0→1 for the final ~15% of reveal (the "convergence").
    private var convergeProgress: Double {
        let start = 0.82
        guard reveal > start else { return 0 }
        let t = (reveal - start) / (1 - start)
        return min(1, t * t * (3 - 2 * t)) // smoothstep
    }

    @ViewBuilder
    private func featureCard(_ feature: Feature, depth: Int) -> some View {
        let local = revealAmount(for: feature.appearAt)
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .fill(ExperiencePalette.accent.opacity(0.18))
                    .frame(width: 50, height: 50)
                Image(systemName: feature.symbol)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(ExperiencePalette.accent)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(feature.title)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(ExperiencePalette.textPrimary)
                Text(feature.subtitle)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(ExperiencePalette.textMuted)
            }
            Spacer()
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(.white.opacity(0.12 + local * 0.12), lineWidth: 1)
        )
        .shadow(color: ExperiencePalette.accentGlow.opacity(0.25 * local), radius: 18, y: 8)
        // Cinematic assembly: fade + blur + rise + slight parallax by depth.
        .opacity(local)
        .blur(radius: (1 - local) * 8)
        .offset(y: CGFloat(1 - local) * (40 + CGFloat(depth) * 12))
        .scaleEffect(0.96 + local * 0.04)
        // Fade the cards back out as the final message converges.
        .opacity(1 - convergeProgress * 0.85)
    }

    private var hintOverlay: some View {
        VStack {
            Spacer()
            VStack(spacing: 10) {
                Image(systemName: "chevron.up")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(ExperiencePalette.accent)
                    .offset(y: reveal > 0.02 ? -6 : 4)
                    .animation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true), value: reveal > 0.02)
                Text("Ziehen, um zu enthüllen")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(ExperiencePalette.textMuted)
            }
            .opacity(max(0, 0.9 - reveal * 1.6))
            .padding(.bottom, 54)
        }
        .allowsHitTesting(false)
    }

    // MARK: - Reveal engine

    /// Local 0→1 reveal for a single element based on its appearance threshold.
    private func revealAmount(for threshold: Double) -> Double {
        let span = 0.22
        let t = (reveal - threshold) / span
        return min(1, max(0, t))
    }

    private func bump(by amount: Double) {
        guard !converged else { return }
        let before = reveal
        reveal = min(1, reveal + amount)
        hapticAcross(before: before, after: reveal)
    }

    /// Gentle baseline auto-reveal so the screen always breathes to life, even
    /// without input — drag simply accelerates past it.
    private func autoReveal() {
        guard !converged else { return }
        let ceiling = 0.55
        if reveal < ceiling {
            let before = reveal
            reveal = min(ceiling, reveal + (1.0 / 60.0) / 3.2)
            hapticAcross(before: before, after: reveal)
        }
    }

    /// Fires soft ticks as each feature crosses its appearance threshold, and a
    /// success notification at full convergence.
    private func hapticAcross(before: Double, after: Double) {
        for feature in features where before < feature.appearAt && after >= feature.appearAt {
            ExperienceHaptics.impact(.soft, intensity: 0.5)
        }
        if before < 1 && after >= 1 {
            ExperienceHaptics.success()
        }
    }
}
