import SwiftUI

/// SCREEN 1 — "Hold to continue" experience.
/// The user presses and holds a central button; the whole screen fills with a
/// fluid liquid gradient that reacts live to progress. Releasing early rewinds
/// smoothly; completing fires a haptic + cinematic flash and seamlessly advances.
struct HoldToContinueStepView: View {
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var progress: Double = 0
    @State private var isHolding = false
    @State private var completed = false
    @State private var flash: Double = 0
    @State private var breathe = false

    private let holdDuration: Double = 1.8          // seconds to fill
    private let releaseDuration: Double = 0.7        // faster rewind
    private let tick = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common).autoconnect()

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Ambient light grows with progress + gentle zoom while holding.
                AmbientBackground(intensity: 0.45 + progress * 0.9, motion: 0.8 + progress)
                    .scaleEffect(1 + progress * 0.06)

                // Liquid gradient fill rising from the bottom.
                TimelineView(.animation) { timeline in
                    let phase = timeline.date.timeIntervalSinceReferenceDate * 2.4
                    LiquidFillShape(progress: progress, phase: phase)
                        .fill(
                            LinearGradient(
                                colors: [
                                    ExperiencePalette.accent.opacity(0.32),
                                    ExperiencePalette.accentDeep.opacity(0.55),
                                ],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                        .overlay(
                            LiquidFillShape(progress: progress, phase: phase)
                                .stroke(ExperiencePalette.accentGlow.opacity(0.6), lineWidth: 1.5)
                                .blur(radius: 0.5)
                        )
                        .ignoresSafeArea()
                }

                ParticleField(count: 30, speed: 0.9 + progress, intensity: 0.4 + progress * 0.8)

                content(in: geo)
                    .scaleEffect(1 + progress * 0.03)

                // Cinematic completion flash.
                Color.white
                    .opacity(flash)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
            }
        }
        .onReceive(tick) { _ in advance() }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                breathe = true
            }
        }
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

            VStack(spacing: 14) {
                Text("Build your personalized\nexperience")
                    .font(.system(size: 28, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(ExperiencePalette.textPrimary)
                    .lineSpacing(2)

                Text("Hold to continue")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(ExperiencePalette.textMuted)
                    .opacity(isHolding ? 0.4 : 1)
                    .animation(.easeInOut(duration: 0.3), value: isHolding)
            }
            .padding(.horizontal, 32)

            Spacer()

            holdButton

            Spacer()
            Spacer()
        }
    }

    private var holdButton: some View {
        ZStack {
            // Outer breathing halo
            Circle()
                .stroke(ExperiencePalette.accent.opacity(0.18), lineWidth: 1.5)
                .frame(width: 210, height: 210)
                .scaleEffect(breathe ? 1.06 : 0.96)
                .opacity(0.6 + progress * 0.4)

            Circle()
                .stroke(ExperiencePalette.accent.opacity(0.25), lineWidth: 1)
                .frame(width: 168, height: 168)
                .scaleEffect(breathe ? 1.04 : 0.98)

            // Glass core
            Circle()
                .fill(.ultraThinMaterial)
                .frame(width: 150, height: 150)
                .overlay(
                    Circle().stroke(
                        LinearGradient(colors: [ExperiencePalette.accent, ExperiencePalette.accentDeep],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
                        lineWidth: 1.5
                    )
                )
                .shadow(color: ExperiencePalette.accentGlow.opacity(0.4 + progress * 0.5),
                        radius: 26 + progress * 24, y: 0)

            // Progress ring
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    LinearGradient(colors: [ExperiencePalette.accentGlow, ExperiencePalette.accent],
                                   startPoint: .top, endPoint: .bottom),
                    style: StrokeStyle(lineWidth: 5, lineCap: .round)
                )
                .frame(width: 150, height: 150)
                .rotationEffect(.degrees(-90))

            VStack(spacing: 6) {
                Image(systemName: completed ? "checkmark" : "hand.tap.fill")
                    .font(.system(size: 26, weight: .semibold))
                    .foregroundStyle(ExperiencePalette.textPrimary)
                    .contentTransition(.symbolEffect(.replace))
                Text(completed ? "Ready" : "HOLD")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(ExperiencePalette.textMuted)
            }
        }
        .scaleEffect(isHolding ? 1.06 : 1)
        .animation(.spring(response: 0.35, dampingFraction: 0.6), value: isHolding)
        .contentShape(Circle())
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    guard !completed, !isHolding else { return }
                    isHolding = true
                    ExperienceHaptics.impact(.light, intensity: 0.7)
                }
                .onEnded { _ in
                    isHolding = false
                }
        )
    }

    // MARK: - Progress engine

    private func advance() {
        guard !completed else { return }
        if isHolding {
            progress = min(1, progress + (1.0 / 60.0) / holdDuration)
            // light "rising" haptic pulses as the fill climbs
            if progress < 1, Int(progress * 100) % 12 == 0 {
                ExperienceHaptics.impact(.soft, intensity: 0.35)
            }
            if progress >= 1 { complete() }
        } else if progress > 0 {
            progress = max(0, progress - (1.0 / 60.0) / releaseDuration)
        }
    }

    private func complete() {
        completed = true
        isHolding = false
        progress = 1
        ExperienceHaptics.success()

        withAnimation(.easeOut(duration: 0.18)) { flash = 0.85 }
        withAnimation(.easeIn(duration: 0.45).delay(0.18)) { flash = 0 }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.62) {
            onNext()
        }
    }
}
