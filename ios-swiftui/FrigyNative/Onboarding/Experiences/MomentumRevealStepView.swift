import SwiftUI

/// SCREEN 3 — "Live Preview" experience.
/// Shows a personalised preview assembled from onboarding context.
/// Three small adjustable controls let the user tune their plan.
/// After 1–2 adjustments OR 4 s idle → "Continue" fades in.
/// Optional soft auto-advance after a further 4 s of no interaction.
struct MomentumRevealStepView: View {
    let onBack: (() -> Void)?
    let onNext: () -> Void

    // Adjustable preview dials
    @State private var mealCount: Int = 3        // 2–5
    @State private var intensity: Int = 1        // 0 Sanft / 1 Ausgewogen / 2 Intensiv
    @State private var focusArea: Int = 0        // 0 Ernährung / 1 Bewegung / 2 Beides

    private let intensityLabels = ["Sanft", "Ausgewogen", "Intensiv"]
    private let intensityColors: [Color] = [Color(hex: "#75FBB2"), Color(hex: "#36D1FF"), Color(hex: "#FF8A5B")]
    private let focusLabels = ["Ernährung", "Bewegung", "Beides"]

    // Completion logic
    @State private var adjustmentCount: Int = 0
    @State private var idleSeconds: Double = 0
    @State private var ctaVisible: Bool = false
    @State private var ctaOpacity: Double = 0
    @State private var autoAdvanceSeconds: Double = 0
    @State private var autoAdvancePending: Bool = false

    private let adjustmentsNeeded = 2
    private let idleThreshold: Double = 4.0
    private let autoAdvanceDelay: Double = 4.0

    private let tick = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common).autoconnect()

    private var accentTint: Color { intensityColors[intensity] }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                AmbientBackground(tint: accentTint,
                                  secondaryTint: ExperiencePalette.accentDeep,
                                  intensity: 0.7, motion: 0.5)

                ParticleField(count: 18, color: accentTint, speed: 0.5, intensity: 0.5)

                VStack(spacing: 0) {
                    navBar

                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 28) {
                            headerCard
                            controlsCard
                            previewCard
                        }
                        .padding(.horizontal, 22)
                        .padding(.top, 12)
                        .padding(.bottom, 24)
                    }

                    ctaSection
                        .padding(.bottom, 28)
                }
            }
        }
        .onReceive(tick) { _ in tick60() }
    }

    // MARK: - Nav

    private var navBar: some View {
        HStack {
            if let onBack {
                ExperienceBackButton(action: onBack)
            } else {
                Color.clear.frame(width: 42, height: 42)
            }
            Spacer()
            Text("Deine Vorschau")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(ExperiencePalette.textMuted)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    // MARK: - Header card

    private var headerCard: some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(accentTint.opacity(0.18))
                        .frame(width: 52, height: 52)
                    Image(systemName: "sparkles")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(accentTint)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("KI-Plan erstellt")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(ExperiencePalette.textPrimary)
                    Text("Passe es nach deinem Geschmack an")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(ExperiencePalette.textMuted)
                }
                Spacer()
            }
        }
        .padding(18)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.1), lineWidth: 1))
    }

    // MARK: - Controls card

    private var controlsCard: some View {
        VStack(spacing: 20) {
            // Mahlzeiten
            controlRow(label: "Mahlzeiten pro Tag") {
                HStack(spacing: 0) {
                    ForEach(2...5, id: \.self) { v in
                        Button {
                            guard v != mealCount else { return }
                            mealCount = v
                            didAdjust()
                        } label: {
                            Text("\(v)")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(v == mealCount ? ExperiencePalette.base : ExperiencePalette.textMuted)
                                .frame(width: 44, height: 36)
                                .background(v == mealCount ? accentTint : Color.white.opacity(0.08),
                                            in: RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: mealCount)
                    }
                }
            }

            Divider().background(Color.white.opacity(0.08))

            // Intensität
            controlRow(label: "Intensität") {
                HStack(spacing: 6) {
                    ForEach(intensityLabels.indices, id: \.self) { i in
                        Button {
                            guard i != intensity else { return }
                            intensity = i
                            didAdjust()
                        } label: {
                            Text(intensityLabels[i])
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(i == intensity ? ExperiencePalette.base : ExperiencePalette.textMuted)
                                .padding(.horizontal, 10)
                                .frame(height: 32)
                                .background(i == intensity ? intensityColors[i] : Color.white.opacity(0.08),
                                            in: Capsule())
                        }
                        .buttonStyle(.plain)
                        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: intensity)
                    }
                }
            }

            Divider().background(Color.white.opacity(0.08))

            // Fokus
            controlRow(label: "Fokus") {
                HStack(spacing: 6) {
                    ForEach(focusLabels.indices, id: \.self) { i in
                        Button {
                            guard i != focusArea else { return }
                            focusArea = i
                            didAdjust()
                        } label: {
                            Text(focusLabels[i])
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(i == focusArea ? ExperiencePalette.base : ExperiencePalette.textMuted)
                                .padding(.horizontal, 10)
                                .frame(height: 32)
                                .background(i == focusArea ? accentTint : Color.white.opacity(0.08),
                                            in: Capsule())
                        }
                        .buttonStyle(.plain)
                        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: focusArea)
                    }
                }
            }
        }
        .padding(18)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.1), lineWidth: 1))
    }

    @ViewBuilder
    private func controlRow<C: View>(label: String, @ViewBuilder control: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(ExperiencePalette.textMuted)
            control()
        }
    }

    // MARK: - Preview card

    private var previewCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Dein Wochenplan")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(ExperiencePalette.textPrimary)

            VStack(spacing: 10) {
                ForEach(weekDays, id: \.self) { day in
                    HStack(spacing: 12) {
                        Text(day)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(ExperiencePalette.textMuted)
                            .frame(width: 28, alignment: .leading)

                        // Activity bar
                        Capsule()
                            .fill(accentTint.opacity(0.18))
                            .frame(maxWidth: .infinity)
                            .frame(height: 28)
                            .overlay(alignment: .leading) {
                                let w = barWidth(for: day)
                                Capsule()
                                    .fill(
                                        LinearGradient(colors: [accentTint, accentTint.opacity(0.6)],
                                                       startPoint: .leading, endPoint: .trailing)
                                    )
                                    .frame(width: w, height: 28)
                                    .animation(.spring(response: 0.5, dampingFraction: 0.75), value: intensity)
                                    .animation(.spring(response: 0.5, dampingFraction: 0.75), value: focusArea)
                            }

                        Text(dayLabel(for: day))
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(ExperiencePalette.textMuted)
                            .frame(width: 62, alignment: .trailing)
                    }
                }
            }
        }
        .padding(18)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.1), lineWidth: 1))
    }

    private let weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

    private func barWidth(for day: String) -> CGFloat {
        let base: [String: Double] = [
            "Mo": 0.72, "Di": 0.55, "Mi": 0.80, "Do": 0.50,
            "Fr": 0.68, "Sa": 0.38, "So": 0.30,
        ]
        let intensityBoost = [0.0, 0.1, 0.2][intensity]
        let focusBoost = focusArea == 1 ? 0.08 : 0.0
        let raw = (base[day] ?? 0.5) + intensityBoost + focusBoost
        return CGFloat(min(1, raw)) * 180
    }

    private func dayLabel(for day: String) -> String {
        let isWorkout = focusArea != 0
        let workoutDays: Set<String> = intensity == 2
            ? ["Mo", "Di", "Mi", "Do", "Fr"] : ["Mo", "Mi", "Fr"]
        if isWorkout && workoutDays.contains(day) { return "Training" }
        return "\(mealCount)x Mahlzeit"
    }

    // MARK: - CTA

    @ViewBuilder
    private var ctaSection: some View {
        VStack(spacing: 10) {
            if autoAdvancePending {
                // Tiny auto-advance hint
                let fraction = min(1, autoAdvanceSeconds / autoAdvanceDelay)
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.06)).frame(height: 2)
                    Capsule().fill(accentTint.opacity(0.5)).frame(width: max(0, CGFloat(fraction) * 160), height: 2)
                }
                .frame(width: 160)
                .opacity(0.6)
                .animation(.linear(duration: 1.0 / 60.0), value: fraction)
            }

            ExperienceCTAButton(title: "Plan übernehmen", action: onNext)
                .padding(.horizontal, 28)
                .opacity(ctaOpacity)
                .scaleEffect(0.94 + ctaOpacity * 0.06)
                .animation(.spring(response: 0.5, dampingFraction: 0.72), value: ctaOpacity)
        }
    }

    // MARK: - Logic

    private func didAdjust() {
        ExperienceHaptics.selection()
        adjustmentCount += 1
        idleSeconds = 0
        autoAdvanceSeconds = 0
        autoAdvancePending = false

        if !ctaVisible && adjustmentCount >= adjustmentsNeeded {
            revealCTA()
        }
    }

    private func revealCTA() {
        ctaVisible = true
        withAnimation(.easeOut(duration: 0.6)) { ctaOpacity = 1 }
        ExperienceHaptics.impact(.light, intensity: 0.6)
    }

    private func tick60() {
        // Idle timer to reveal CTA even without adjustments
        if !ctaVisible {
            idleSeconds += 1.0 / 60.0
            if idleSeconds >= idleThreshold { revealCTA() }
        }

        // Auto-advance after CTA is visible and user is idle
        if ctaVisible && !autoAdvancePending {
            autoAdvancePending = true
        }
        if autoAdvancePending {
            autoAdvanceSeconds += 1.0 / 60.0
            if autoAdvanceSeconds >= autoAdvanceDelay {
                onNext()
            }
        }
    }
}
