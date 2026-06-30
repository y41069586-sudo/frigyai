import SwiftUI

struct SpeedSelectStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var appeared = false

    @Environment(LanguageManager.self) private var lang

    private let kgPerLb = 0.45359237
    private let minKg = 0.1
    private let maxKg = 0.9

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        let weekly = max(0.1, min(0.9, profile.weeklyGoalKg > 0 ? profile.weeklyGoalKg : 0.5))
        var d = profile
        d.weeklyGoalKg = weekly
        _draft = State(initialValue: d)
    }

    private var kgPerWeek: Double { max(minKg, min(maxKg, draft.weeklyGoalKg)) }
    private var displayValue: Double { isMetric ? kgPerWeek : kgPerWeek / kgPerLb }
    private var displayMin: Double { isMetric ? minKg : minKg / kgPerLb }
    private var displayMax: Double { isMetric ? maxKg : maxKg / kgPerLb }
    private var unitLabel: String { isMetric ? "kg" : "lbs" }

    private func snapDisplay(_ v: Double) -> Double {
        let step = 0.1
        let s = (v / step).rounded() * step
        return max(displayMin, min(displayMax, s))
    }

    private func formatValue(_ v: Double) -> String {
        let snapped = snapDisplay(v)
        return String(format: "%.1f", snapped)
    }

    private var pct: Double {
        guard maxKg > minKg else { return 0 }
        return max(0, min(1, (kgPerWeek - minKg) / (maxKg - minKg)))
    }

    private var speedLabel: String {
        switch pct {
        case ..<0.34: return draft.goalMode == "gain" ? lang.t("Sanfter Aufbau") : lang.t("Sanfter Start")
        case ..<0.67: return lang.t("Optimales Tempo")
        default:      return draft.goalMode == "gain" ? lang.t("Intensiver Aufbau") : lang.t("Schnelle Abnahme")
        }
    }

    private var speedEmoji: String {
        switch pct {
        case ..<0.34: return "🐢"
        case ..<0.67: return "💪"
        default:      return "🔥"
        }
    }

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
            FrigyMascotQuestion(lang.t("Wie schnell möchtest du dein Ziel erreichen?"))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            Spacer()

            VStack(spacing: 28) {
                // Value + emoji badge
                VStack(spacing: 8) {
                    ZStack {
                        // Outer glow ring
                        Circle()
                            .fill(paceColor(pct).opacity(0.12))
                            .frame(width: 130, height: 130)
                            .animation(.easeInOut(duration: 0.3), value: pct)

                        Circle()
                            .fill(Color(UIColor.systemBackground))
                            .frame(width: 106, height: 106)
                            .shadow(color: paceColor(pct).opacity(0.3), radius: 18, y: 6)
                            .animation(.easeInOut(duration: 0.3), value: pct)

                        VStack(spacing: 2) {
                            Text(speedEmoji)
                                .font(.system(size: 28))
                                .animation(.none, value: speedEmoji)

                            HStack(alignment: .lastTextBaseline, spacing: 3) {
                                Text(formatValue(displayValue))
                                    .font(.system(size: 26, weight: .black, design: .rounded))
                                    .foregroundColor(FrigyBrand.text)
                                    .contentTransition(.numericText())
                                    .animation(.snappy(duration: 0.16), value: displayValue)
                                Text(unitLabel)
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                        }
                    }
                    .scaleEffect(appeared ? 1 : 0.7)
                    .opacity(appeared ? 1 : 0)
                    .animation(.spring(response: 0.5, dampingFraction: 0.65).delay(0.1), value: appeared)

                    Text(speedLabel)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(paceColor(pct))
                        .animation(.easeInOut(duration: 0.25), value: speedLabel)
                        .contentTransition(.opacity)
                }

                // Slider card
                VStack(spacing: 20) {
                    PaceSlider(
                        value: Binding(
                            get: { displayValue },
                            set: { newVal in
                                let kg = isMetric ? newVal : newVal * kgPerLb
                                draft.weeklyGoalKg = max(minKg, min(maxKg, kg))
                            }
                        ),
                        minVal: displayMin,
                        maxVal: displayMax,
                        pace: pct
                    )

                    // Pole labels
                    HStack {
                        Label(draft.goalMode == "gain" ? lang.t("Sanft") : lang.t("Langsam"), systemImage: "tortoise.fill")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(paceColor(0))
                        Spacer()
                        Label(draft.goalMode == "gain" ? lang.t("Intensiv") : lang.t("Schnell"), systemImage: "hare.fill")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(paceColor(1))
                    }
                    .padding(.horizontal, 4)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 20)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color(UIColor.systemBackground))
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.08), radius: 16, y: 6)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                )
                .padding(.horizontal, 20)
                .scaleEffect(appeared ? 1 : 0.88)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(0.2), value: appeared)

                // Unit toggle
                MintSegmentedControl(
                    options: [("metric", lang.t("Metrisch")), ("imperial", lang.t("Imperial"))],
                    selected: isMetric ? "metric" : "imperial"
                ) { id in
                    isMetric = (id == "metric")
                }
                .padding(.horizontal, 20)
                .opacity(appeared ? 1 : 0)
                .animation(.easeOut(duration: 0.4).delay(0.3), value: appeared)
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton { onNext(draft) }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, max(20, 16))
                    .background(FrigyBrand.bg)
            }
        }
        .onAppear { appeared = true }
    }

    private func paceColor(_ p: Double) -> Color {
        func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double { a + (b - a) * t }
        let g = (r: 0.22, g: 0.83, b: 0.49)
        let o = (r: 1.00, g: 0.62, b: 0.20)
        let r = (r: 0.98, g: 0.27, b: 0.27)
        if p < 0.5 {
            let t = p / 0.5
            return Color(red: lerp(g.r, o.r, t), green: lerp(g.g, o.g, t), blue: lerp(g.b, o.b, t))
        } else {
            let t = (p - 0.5) / 0.5
            return Color(red: lerp(o.r, r.r, t), green: lerp(o.g, r.g, t), blue: lerp(o.b, r.b, t))
        }
    }
}

// MARK: - PaceSlider

private struct PaceSlider: View {
    @Binding var value: Double
    let minVal: Double
    let maxVal: Double
    let pace: Double

    @State private var liveVal: Double? = nil
    @State private var isActive = false

    private var renderVal: Double { liveVal ?? value }

    private func pct(_ v: Double) -> Double {
        guard maxVal > minVal else { return 0 }
        return max(0, min(1, (v - minVal) / (maxVal - minVal)))
    }

    private func snap(_ v: Double) -> Double {
        let step = 0.1
        let s = (v / step).rounded() * step
        return max(minVal, min(maxVal, s))
    }

    private func color(_ p: Double) -> Color {
        func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double { a + (b - a) * t }
        let g = (r: 0.22, g: 0.83, b: 0.49)
        let o = (r: 1.00, g: 0.62, b: 0.20)
        let r = (r: 0.98, g: 0.27, b: 0.27)
        if p < 0.5 {
            let t = p / 0.5
            return Color(red: lerp(g.r, o.r, t), green: lerp(g.g, o.g, t), blue: lerp(g.b, o.b, t))
        } else {
            let t = (p - 0.5) / 0.5
            return Color(red: lerp(o.r, r.r, t), green: lerp(o.g, r.g, t), blue: lerp(o.b, r.b, t))
        }
    }

    private var trackGradient: LinearGradient {
        LinearGradient(
            colors: [color(0), color(0.33), color(0.66), color(1)],
            startPoint: .leading, endPoint: .trailing
        )
    }

    private let thumbSize: CGFloat = 32
    private let trackH: CGFloat = 18

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let p = CGFloat(pct(renderVal))
            let thumbX = p * (w - thumbSize)

            ZStack(alignment: .leading) {
                // Track background (faded)
                Capsule()
                    .fill(trackGradient)
                    .opacity(0.2)
                    .frame(height: trackH)

                // Active fill
                Capsule()
                    .fill(trackGradient)
                    .frame(width: max(thumbSize / 2, thumbX + thumbSize / 2), height: trackH)
                    .shadow(color: color(Double(p)).opacity(0.35), radius: 6, y: 2)

                // Thumb
                ZStack {
                    Circle()
                        .fill(Color(UIColor.systemBackground))
                        .frame(width: thumbSize, height: thumbSize)
                        .shadow(color: color(Double(p)).opacity(isActive ? 0.5 : 0.3),
                                radius: isActive ? 12 : 6, y: isActive ? 4 : 2)

                    Circle()
                        .stroke(color(Double(p)), lineWidth: 3)
                        .frame(width: thumbSize, height: thumbSize)

                    Circle()
                        .fill(color(Double(p)))
                        .frame(width: 10, height: 10)
                }
                .scaleEffect(isActive ? 1.2 : 1)
                .animation(.spring(response: 0.28, dampingFraction: 0.6), value: isActive)
                .offset(x: thumbX)
            }
            .frame(height: thumbSize)
            .contentShape(Rectangle().size(CGSize(width: w, height: 52)).offset(y: -10))
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { drag in
                        isActive = true
                        let ratio = max(0, min(1, (drag.location.x - thumbSize / 2) / (w - thumbSize)))
                        let raw = minVal + ratio * (maxVal - minVal)
                        liveVal = raw
                        value = raw
                    }
                    .onEnded { _ in
                        let snapped = snap(renderVal)
                        withAnimation(.spring(response: 0.32, dampingFraction: 0.7)) {
                            liveVal = snapped
                        }
                        value = snapped
                        isActive = false
                        Task {
                            try? await Task.sleep(nanoseconds: 500_000_000)
                            liveVal = nil
                        }
                    }
            )
        }
        .frame(height: thumbSize)
    }
}
