import SwiftUI

struct HeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var inputText = ""
    @State private var isMetric = true

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let cm = profile.heightCm
        _inputText = State(initialValue: cm > 0 ? String(Int(cm)) : "")
    }

    private var parsedCm: Double? {
        if isMetric {
            guard let val = Double(inputText), val >= 100, val <= 250 else { return nil }
            return val
        } else {
            // Imperial: split "5'11" or just "71" (inches)
            let text = inputText.trimmingCharacters(in: .whitespaces)
            if text.contains("'") {
                let parts = text.split(separator: "'")
                guard parts.count >= 1, let feet = Double(parts[0]) else { return nil }
                let inches = parts.count > 1 ? Double(parts[1].trimmingCharacters(in: CharacterSet(charactersIn: "\" "))) ?? 0 : 0
                let cm = (feet * 30.48) + (inches * 2.54)
                return cm >= 100 && cm <= 250 ? cm : nil
            } else {
                guard let inches = Double(text) else { return nil }
                let cm = inches * 2.54
                return cm >= 100 && cm <= 250 ? cm : nil
            }
        }
    }

    private var canProceed: Bool { parsedCm != nil }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                OnboardingQuestion(text: "Wie groß bist du?")

                VStack(spacing: 16) {
                    // Unit toggle
                    HStack(spacing: 0) {
                        ForEach(["cm", "ft/in"], id: \.self) { label in
                            let selected = (label == "cm") == isMetric
                            Button {
                                isMetric = (label == "cm")
                                inputText = ""
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
                    .frame(maxWidth: 200)

                    OnboardingInputCard {
                        HStack(spacing: 8) {
                            TextField(isMetric ? "175" : "5'11\"", text: $inputText)
                                .keyboardType(.numbersAndPunctuation)
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)

                            Text(isMetric ? "cm" : "ft")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                    }
                    .frame(maxWidth: 260)

                    if !inputText.isEmpty && !canProceed {
                        Text(isMetric ? "100 – 250 cm" : "3'3\" – 8'2\"")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.red)
                    }
                }
            }

            Spacer()

            OnboardingContinueButton(isEnabled: canProceed) {
                var updated = draft
                if let cm = parsedCm {
                    updated.heightCm = cm
                }
                onNext(updated)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }
}
