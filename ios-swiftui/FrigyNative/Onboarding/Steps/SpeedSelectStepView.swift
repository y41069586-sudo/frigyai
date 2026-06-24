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
    private let maxKg = 0.9

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        // Start at 0.1 kg/week (leftmost, gentlest); keep a prior in-range choice.
        let weekly = max(0.1, min(0.9, profile.weeklyGoalKg > 0 ? profile.weeklyGoalKg : 0.1))
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
            FrigyMascotQuestion("Wie schnell möchtest du dein Ziel erreichen?")
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
                        get: { displayValue },
                        set: { newVal in
                            // Store raw value during drag — slider snaps on release
                            let kg = isMetric ? newVal : newVal * kgPerLb
                            draft.weeklyGoalKg = max(minKg, min(maxKg, kg))
                        }
                    ),
                    min: displayMin,
                    max: displayMax,
                    ticks: isMetric ? [0.1, 0.5, 0.9] : [
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

    // Smooth live position during drag; nil = use value binding
    @State private var liveVal: Double? = nil

    private var renderVal: Double { liveVal ?? value }

    private func snap(_ v: Double) -> Double {
        let step = 0.1
        let s = (v / step).rounded() * step
        return Swift.max(min, Swift.min(max, s))
    }

    private func pct(_ v: Double) -> Double {
        guard max > min else { return 0 }
        return Swift.max(0, Swift.min(1, (v - min) / (max - min)))
    }

    // Pace scale: green (gentle) → orange (moderate) → red (aggressive).
    private static let green  = (r: 0.22, g: 0.83, b: 0.49)   // #39D47F
    private static let orange = (r: 1.00, g: 0.62, b: 0.20)   // #FF9E33
    private static let red    = (r: 0.98, g: 0.27, b: 0.27)   // #FA4545

    /// Smoothly interpolated colour for a 0…1 position along the track.
    private func paceColor(_ p: Double) -> Color {
        func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double { a + (b - a) * t }
        let g = Self.green, o = Self.orange, r = Self.red
        if p < 0.5 {
            let t = p / 0.5
            return Color(red: lerp(g.r, o.r, t), green: lerp(g.g, o.g, t), blue: lerp(g.b, o.b, t))
        } else {
            let t = (p - 0.5) / 0.5
            return Color(red: lerp(o.r, r.r, t), green: lerp(o.g, r.g, t), blue: lerp(o.b, r.b, t))
        }
    }

    /// Full green→orange→red gradient across the whole track length.
    private var paceGradient: LinearGradient {
        LinearGradient(
            colors: [paceColor(0), paceColor(0.5), paceColor(1)],
            startPoint: .leading, endPoint: .trailing
        )
    }

    var body: some View {
        VStack(spacing: 4) {
            GeometryReader { geo in
                let w = geo.size.width
                let p = pct(renderVal)

                ZStack(alignment: .leading) {
                    // Track background
                    Capsule()
                        .fill(paceGradient)
                        .opacity(0.28)
                        .frame(height: 12)
                        .overlay(Capsule().stroke(Color.white.opacity(0.45), lineWidth: 1).blendMode(.overlay))
                        .overlay(Capsule().stroke(FrigyBrand.cardBorder.opacity(0.45), lineWidth: 1))

                    // Active fill
                    Capsule()
                        .fill(paceGradient)
                        .frame(height: 12)
                        .mask(alignment: .leading) {
                            Capsule()
                                .frame(width: Swift.max(CGFloat(p) * (w - 28) + 14, 12), height: 12)
                        }
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.35), lineWidth: 1)
                                .blendMode(.overlay)
                                .frame(width: Swift.max(CGFloat(p) * (w - 28) + 14, 12), height: 12),
                            alignment: .leading
                        )
                        .shadow(color: paceColor(p).opacity(0.4), radius: 4, y: 1)

                    // Thumb
                    ZStack {
                        Circle()
                            .fill(.clear)
                            .frame(width: 28, height: 28)
                            .realGlass(in: Circle(), interactive: true)
                        Circle()
                            .stroke(paceColor(p), lineWidth: 3)
                            .frame(width: 28, height: 28)
                        Circle()
                            .stroke(Color.white.opacity(0.55), lineWidth: 1)
                            .frame(width: 28, height: 28)
                            .blendMode(.overlay)
                        Circle()
                            .fill(paceColor(p))
                            .frame(width: 9, height: 9)
                    }
                    .scaleEffect(isActive ? 1.18 : 1)
                    .shadow(color: paceColor(p).opacity(0.55), radius: isActive ? 9 : 6, y: 2)
                    .offset(x: CGFloat(p) * (w - 28))
                    .animation(.spring(response: 0.32, dampingFraction: 0.6), value: isActive)
                }
                .frame(height: 28)
                .contentShape(Rectangle().size(CGSize(width: w, height: 42)).offset(y: -10))
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { drag in
                            isActive = true
                            let ratio = Swift.max(0, Swift.min(1, (drag.location.x - 14) / (w - 28)))
                            let raw = min + ratio * (max - min)
                            liveVal = raw           // smooth visual
                            value = raw             // propagate raw for number display
                        }
                        .onEnded { _ in
                            let snapped = snap(renderVal)
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.72)) {
                                liveVal = snapped
                            }
                            value = snapped
                            isActive = false
                            // Clear override after spring settles
                            Task {
                                try? await Task.sleep(nanoseconds: 600_000_000)
                                liveVal = nil
                            }
                        }
                )
            }
            .frame(height: 42)

            GeometryReader { geo in
                let w = geo.size.width
                ForEach(Array(ticks.enumerated()), id: \.offset) { _, tick in
                    let highlighted = abs(tick - renderVal) < 0.06
                    Text(String(format: "%.1f", tick))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(highlighted ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
                        .fixedSize()
                        .position(x: CGFloat(pct(tick)) * (w - 28) + 14, y: 8)
                        .animation(.easeInOut(duration: 0.15), value: highlighted)
                }
            }
            .frame(height: 16)
            .padding(.top, 2)
        }
    }
}
