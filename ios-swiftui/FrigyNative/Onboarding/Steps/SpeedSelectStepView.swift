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
                    Text(String(format: "%.1f", displayValue))
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .scaleEffect(sliderActive ? 1.06 : 1)
                        .animation(.spring(stiffness: 380, damping: 22), value: sliderActive)
                    Text(unitLabel)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                }
                .padding(.top, 16)
                .padding(.bottom, 28)

                // Mint slider
                MintPaceSlider(
                    value: Binding(
                        get: { displayValue },
                        set: { newVal in
                            let kg = isMetric ? newVal : newVal * kgPerLb
                            draft.weeklyGoalKg = max(minKg, min(maxKg, (kg * 100).rounded() / 100))
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
                    // Track background
                    Capsule()
                        .fill(FrigyBrand.selectedBg)
                        .frame(height: 7)

                    // Active track
                    Capsule()
                        .fill(FrigyBrand.buttonGradient)
                        .frame(width: CGFloat(pct) * w, height: 7)
                        .shadow(color: Color(hex: "#4AE896").opacity(0.35), radius: 3, y: 1)

                    // Thumb
                    Circle()
                        .fill(Color.white)
                        .overlay(Circle().stroke(FrigyBrand.primary, lineWidth: 3))
                        .frame(width: 22, height: 22)
                        .shadow(color: Color(hex: "#4AE896").opacity(0.55), radius: 6, y: 2)
                        .offset(x: CGFloat(pct) * (w - 22))
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
