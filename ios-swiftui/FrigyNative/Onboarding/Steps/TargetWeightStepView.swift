import SwiftUI

struct TargetWeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var inputText = ""

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let tw = profile.targetWeightKg
        _inputText = State(initialValue: tw > 0 ? String(format: "%.0f", tw) : "")
    }

    private var parsedKg: Double? {
        guard let val = Double(inputText.replacingOccurrences(of: ",", with: ".")),
              val >= 30, val <= 300 else { return nil }
        return val
    }

    private var canProceed: Bool { parsedKg != nil }

    private var goalText: String {
        switch draft.goalMode {
        case "lose":     return "Wunschgewicht (Ziel)"
        case "gain":     return "Zielgewicht (Aufbau)"
        default:         return "Zielgewicht"
        }
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                OnboardingQuestion(text: "Wie viel möchtest du wiegen?")

                VStack(spacing: 16) {
                    OnboardingInputCard {
                        HStack(spacing: 8) {
                            TextField("65", text: $inputText)
                                .keyboardType(.decimalPad)
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: .infinity)
                            Text("kg")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                    }
                    .frame(maxWidth: 260)

                    if canProceed, let kg = parsedKg {
                        let diff = draft.weightKg - kg
                        if abs(diff) > 0.5 {
                            Text(diff > 0
                                 ? String(format: "%.0f kg abnehmen", diff)
                                 : String(format: "%.0f kg zunehmen", abs(diff)))
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(FrigyBrand.primaryDark)
                        }
                    }
                }
            }

            Spacer()

            OnboardingContinueButton(isEnabled: canProceed) {
                var updated = draft
                if let kg = parsedKg {
                    updated.targetWeightKg = kg
                }
                onNext(updated)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }
}
