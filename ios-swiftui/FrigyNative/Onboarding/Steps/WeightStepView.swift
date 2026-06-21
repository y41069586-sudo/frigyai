import SwiftUI

struct WeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var inputText = ""
    @State private var isMetric = true

    private let kgPerLb = 0.45359237
    private var unitLabel: String { isMetric ? "kg" : "lbs" }
    private var placeholder: String { isMetric ? "70,0" : "154.3" }
    private var minVal: Double { isMetric ? 30 : 66 }
    private var maxVal: Double { isMetric ? 250 : 550 }

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let kg = profile.weightKg
        _inputText = State(initialValue: kg > 0 ? String(format: "%.1f", kg).replacingOccurrences(of: ".", with: ",") : "")
    }

    private var parsedKg: Double? {
        let norm = inputText.replacingOccurrences(of: ",", with: ".")
        guard let val = Double(norm) else { return nil }
        let kg = isMetric ? val : val * kgPerLb
        return (kg >= 30 && kg <= 250) ? kg : nil
    }

    private var canProceed: Bool { parsedKg != nil }

    private var validationColor: Color {
        if inputText.isEmpty { return FrigyBrand.textMuted }
        return canProceed ? FrigyBrand.primaryDark : .red
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                OnboardingQuestion(text: "Wie viel wiegst du aktuell?")

                VStack(spacing: 16) {
                    // Unit toggle
                    HStack(spacing: 0) {
                        ForEach(["Metrisch", "Imperial"], id: \.self) { label in
                            let selected = (label == "Metrisch") == isMetric
                            Button {
                                let wasMetric = isMetric
                                isMetric = (label == "Metrisch")
                                if wasMetric != isMetric {
                                    if let kg = parsedKg {
                                        let display = isMetric ? kg : kg / kgPerLb
                                        inputText = String(format: "%.1f", display)
                                            .replacingOccurrences(of: ".", with: isMetric ? "," : ".")
                                    } else {
                                        inputText = ""
                                    }
                                }
                            } label: {
                                Text(label)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(selected ? .white : FrigyBrand.primaryDark)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(selected ? FrigyBrand.primaryDark : .clear)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(4)
                    .background(FrigyBrand.selectedBg)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .frame(maxWidth: 240)

                    // Input card
                    OnboardingInputCard {
                        HStack(alignment: .center, spacing: 8) {
                            TextField(placeholder, text: $inputText)
                                .keyboardType(.decimalPad)
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)

                            Text(unitLabel)
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                    }
                    .frame(maxWidth: 280)

                    if !inputText.isEmpty && !canProceed {
                        Text(isMetric ? "30 – 250 kg" : "66 – 550 lbs")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.red)
                    }
                }
            }

            Spacer()

            OnboardingContinueButton(isEnabled: canProceed) {
                var updated = draft
                if let kg = parsedKg {
                    updated.weightKg = kg
                }
                onNext(updated)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }
}
