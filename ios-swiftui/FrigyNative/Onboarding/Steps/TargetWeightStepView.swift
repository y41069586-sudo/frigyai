import SwiftUI

struct TargetWeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var inputText: String = ""
    @State private var isMetric: Bool = true
    @FocusState private var isFocused: Bool

    private let kgPerLb = 0.45359237

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)

        // Smart init: derive a sensible target
        var initTarget = profile.targetWeightKg
        if initTarget == 65 || initTarget == 0 {
            if profile.goalMode == "lose" { initTarget = max(40, profile.weightKg - 5) }
            else if profile.goalMode == "gain" { initTarget = profile.weightKg + 5 }
            else { initTarget = profile.weightKg }
        }
        _inputText = State(initialValue: initTarget > 0 ? formatDecimal(initTarget, separator: ",") : "")
        var d = profile
        d.targetWeightKg = initTarget
        _draft = State(initialValue: d)
    }

    private var minVal: Double { isMetric ? 30 : 66 }
    private var maxVal: Double { isMetric ? 250 : 550 }
    private var unitLabel: String { isMetric ? "kg" : "lbs" }
    private var placeholder: String { isMetric ? "65,0" : "143.3" }

    private var parsedDisplay: Double? {
        let norm = inputText.replacingOccurrences(of: ",", with: ".")
        return Double(norm)
    }

    private var canProceed: Bool {
        guard let val = parsedDisplay else { return false }
        return val >= minVal && val <= maxVal
    }

    private var showError: Bool {
        !inputText.isEmpty && parsedDisplay != nil && !canProceed
    }

    private var questionTitle: String {
        switch draft.goalMode {
        case "lose":     return "Wie viel möchtest du wiegen?"
        case "gain":     return "Welches Gewicht möchtest du aufbauen?"
        default:         return "Dein Zielgewicht"
        }
    }

    private var helperText: String {
        if showError {
            return isMetric ? "Bitte zwischen 30 und 250 kg eingeben." : "Bitte zwischen 66 und 550 lbs eingeben."
        }
        return isMetric ? "z.B. 65,0 kg" : "e.g. 143.3 lbs"
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            FrigyMascotQuestion(questionTitle)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            // Unit toggle
            MintSegmentedControl(
                options: [("metric", "Metrisch"), ("imperial", "Imperial")],
                selected: isMetric ? "metric" : "imperial"
            ) { id in
                let wasMetric = isMetric
                isMetric = (id == "metric")
                if wasMetric != isMetric, let val = parsedDisplay {
                    let converted = wasMetric ? val / kgPerLb : val * kgPerLb
                    inputText = formatDecimal(converted, separator: isMetric ? "," : ".")
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 4)

            Spacer()

            // Input card
            VStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.white)
                        .overlay(
                            RoundedRectangle(cornerRadius: 24)
                                .stroke(FrigyBrand.borderMint, lineWidth: 1)
                        )
                        .shadow(color: Color(hex: "#39D47F").opacity(0.12), radius: 18, y: 8)

                    HStack(spacing: 12) {
                        TextField(placeholder, text: $inputText)
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(FrigyBrand.text)
                            .multilineTextAlignment(.center)
                            .keyboardType(.decimalPad)
                            .focused($isFocused)
                            .frame(maxWidth: .infinity)
                            .onChange(of: inputText) { _, _ in commitInput() }

                        Text(unitLabel)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                }
                .frame(maxWidth: 320)
                .frame(height: 64)

                Text(helperText)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(showError ? Color(hex: "#DC2626") : FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .animation(.easeInOut(duration: 0.15), value: helperText)
            }
            .padding(.horizontal, 20)

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton("Ziel festlegen", isEnabled: canProceed) {
                    onNext(draft)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear { isFocused = true }
    }

    private func commitInput() {
        guard let val = parsedDisplay, val >= minVal, val <= maxVal else { return }
        let kg = isMetric ? val : val * kgPerLb
        draft.targetWeightKg = kg
    }
}

private func formatDecimal(_ val: Double, separator: Character) -> String {
    let s = String(format: "%.1f", val)
    if separator == "," { return s.replacingOccurrences(of: ".", with: ",") }
    return s
}
