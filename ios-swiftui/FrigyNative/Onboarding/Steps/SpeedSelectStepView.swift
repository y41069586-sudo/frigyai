import SwiftUI

struct SpeedSelectStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var sliderActive: Bool = false

    private let kgPerLb = 0.45359237
    private let minKg = 0.1
    private let maxKg = 1.0

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let weekly = max(0.1, min(1.0, profile.weeklyGoalKg > 0 ? profile.weeklyGoalKg : 0.5))
        var d = profile
        d.weeklyGoalKg = weekly
        _draft = State(initialValue: d)
    }

    private var kgPerWeek: Double { max(minKg, min(maxKg, draft.weeklyGoalKg)) }
    private var displayValue: Double { isMetric ? kgPerWeek : kgPerWeek / kgPerLb }
    private var displayMin: Double { isMetric ? minKg : minKg / kgPerLb }
    private var displayMax: Double { isMetric ? maxKg : maxKg / kgPerLb }
    private var unitLabel: String { isMetric ? "kg" : "lbs" }

    /// Discrete step in display units so the slider lands on clean values
    /// (exactly 0,5 kg — not 0,55) instead of drifting from free dragging.
    private var displayStep: Double { isMetric ? 0.1 : 0.1 }

    private func snapDisplay(_ v: Double) -> Double {
        let snapped = (v / displayStep).rounded() * displayStep
        return max(displayMin, min(displayMax, snapped))
    }

    /// Formats a display value with the fewest decimals needed (0,5 — not 0,50).
    private func formatValue(_ v: Double) -> String {
        let snapped = snapDisplay(v)
        let twoDecimals = String(format: "%.2f", snapped)
        if twoDecimals.hasSuffix("0") {
            return String(format: "%.1f", snapped)
        }
        return twoDecimals
    }

    private var directionLabel: String {
        draft.goalMode == "gain" ? "Geschwindigkeit der Gewichtszunahme pro Woche"
            : "Geschwindigkeit der Gewichtsabnahme pro Woche"
    }

    // Skip this step for maintain goal
    private var isMaintain: Bool { draft.goalMode == "maintain" }

    var body: some View {
        Group {
            if isMaintain {
                Color.clear.onAppear { onNext(draft) }
            } else {
                content
            }
        }
    }

    private var content: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            Text("Wie schnell möchtest du dein Ziel erreichen?")
                .font(.system(size: 19, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
                .tracking(-0.5)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            Spacer()

            VStack(spacing: 0) {
                // Subtitle label
                Text(directionLabel)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundColor(FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)

                // Large value display
                HStack(alignment: .lastTextBaseline, spacing: 6) {
                    Text(formatValue(displayValue))
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        // Smooth, fast iOS rolling-number transition as the slider moves.
                        .contentTransition(.numericText())
                        .animation(.snappy(duration: 0.18), value: displayValue)
                        .scaleEffect(sliderActive ? 1.06 : 1)
                        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: sliderActive)
                    Text(unitLabel)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                }
                .padding(.top, 16)
                .padding(.bottom, 28)

                // Mint slider
                MintPaceSlider(
                    value: Binding(
                        get: { snapDisplay(displayValue) },
                        set: { newVal in
                            let snapped = snapDisplay(newVal)
                            let kg = isMetric ? snapped : snapped * kgPerLb
                            draft.weeklyGoalKg = max(minKg, min(maxKg, (kg * 1000).rounded() / 1000))
                        }
                    ),
                    min: displayMin,
                    max: displayMax,
                    ticks: isMetric ? [0.1, 0.5, 1.0] : [
                        (minKg / kgPerLb * 10).rounded() / 10,
                        (0.5 / kgPerLb * 10).rounded() / 10,
                        (maxKg / kgPerLb * 10).rounded() / 10,
                    ],
                    isActive: $sliderActive
                )
                .padding(.horizontal, 24)

                // Unit toggle
                MintSegmentedControl(
                    options: [("metric", "Metrisch"), ("imperial", "Imperial")],
                    selected: isMetric ? "metric" : "imperial"
                ) { id in
                    isMetric = (id == "metric")
                }
                .padding(.top, 32)
                .padding(.horizontal, 20)
            }

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(action: {
                    onNext(draft)
                })
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }
}

// MARK: - MintPaceSlider

private struct MintPaceSlider: View {
    @Binding var value: Double
    let min: Double
    let max: Double
    let ticks: [Double]
    @Binding var isActive: Bool

    private func pct(_ v: Double) -> Double {
        guard max > min else { return 0 }
        return Swift.max(0, Swift.min(1, (v - min) / (max - min)))
    }

    var body: some View {
        VStack(spacing: 4) {
            GeometryReader { geo in
                let w = geo.size.width
                let pct = pct(value)

                ZStack(alignment: .leading) {
                    // Track background — liquid glass capsule
                    Capsule()
                        .fill(.clear)
                        .frame(height: 10)
                        .realGlass(in: Capsule(), interactive: false, fallbackBorder: FrigyBrand.cardBorder.opacity(0.5))

                    // Active track
                    Capsule()
                        .fill(FrigyBrand.buttonGradient)
                        .frame(width: max(CGFloat(pct) * w, 10), height: 10)
                        .overlay(Capsule().stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                        .shadow(color: Color(hex: "#4AE896").opacity(0.35), radius: 3, y: 1)

                    // Thumb — liquid glass circle
                    Circle()
                        .fill(.clear)
                        .frame(width: 26, height: 26)
                        .realGlass(in: Circle(), interactive: true)
                        .overlay(Circle().stroke(FrigyBrand.primary, lineWidth: 2.5))
                        .shadow(color: Color(hex: "#4AE896").opacity(0.55), radius: 6, y: 2)
                        .offset(x: CGFloat(pct) * (w - 26))
                        .animation(.spring(response: 0.25, dampingFraction: 0.7), value: pct)
                }
                .frame(height: 22)
                .contentShape(Rectangle().size(CGSize(width: w, height: 42)).offset(y: -10))
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { drag in
                            isActive = true
                            let ratio = Swift.max(0, Swift.min(1, drag.location.x / w))
                            value = min + ratio * (max - min)
                        }
                        .onEnded { _ in isActive = false }
                )
            }
            .frame(height: 42)

            // Tick labels
            HStack {
                ForEach(Array(ticks.enumerated()), id: \.offset) { _, tick in
                    let isActive = abs(tick - value) < 0.06
                    Text(String(format: "%.1f", tick))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(isActive ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
                        .frame(maxWidth: .infinity)
                        .animation(.easeInOut(duration: 0.15), value: isActive)
                }
            }
            .padding(.top, 2)
        }
    }
}
