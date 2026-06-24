import SwiftUI

struct TargetWeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var selectedKg: Int = 65
    @State private var selectedLbs: Int = 143

    private let kgPerLb = 0.45359237

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext

        var initTarget = profile.targetWeightKg
        if initTarget <= 0 || initTarget == 65 {
            if profile.goalMode == "lose"      { initTarget = max(40, profile.weightKg - 5) }
            else if profile.goalMode == "gain" { initTarget = profile.weightKg + 5 }
            else                               { initTarget = profile.weightKg }
        }
        var d = profile
        d.targetWeightKg = initTarget
        _draft = State(initialValue: d)

        let kg  = initTarget > 0 ? Int(round(initTarget)) : 65
        let lbs = initTarget > 0 ? Int(round(initTarget / 0.45359237)) : 143
        _selectedKg  = State(initialValue: min(max(kg, 30), 250))
        _selectedLbs = State(initialValue: min(max(lbs, 66), 550))
    }

    private var questionTitle: String {
        switch draft.goalMode {
        case "lose": return "Wie viel möchtest du wiegen?"
        case "gain": return "Welches Gewicht möchtest du aufbauen?"
        default:     return "Dein Zielgewicht"
        }
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion(questionTitle)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            MintSegmentedControl(
                options: [("metric", "Metrisch"), ("imperial", "Imperial")],
                selected: isMetric ? "metric" : "imperial"
            ) { id in
                let wasMetric = isMetric
                isMetric = (id == "metric")
                if wasMetric && !isMetric {
                    selectedLbs = min(max(Int(round(Double(selectedKg) / kgPerLb)), 66), 550)
                } else if !wasMetric && isMetric {
                    selectedKg = min(max(Int(round(Double(selectedLbs) * kgPerLb)), 30), 250)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 4)

            Spacer()

            if isMetric {
                NumberScrollInput(value: $selectedKg, range: 30...250, unit: "kg")
                    .padding(.horizontal, 20)
                    .onChange(of: selectedKg) { _, kg in
                        draft.targetWeightKg = Double(kg)
                    }
            } else {
                NumberScrollInput(value: $selectedLbs, range: 66...550, unit: "lbs")
                    .padding(.horizontal, 20)
                    .onChange(of: selectedLbs) { _, lbs in
                        draft.targetWeightKg = Double(lbs) * kgPerLb
                    }
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton("Ziel festlegen") {
                    var updated = draft
                    updated.targetWeightKg = isMetric ? Double(selectedKg) : Double(selectedLbs) * kgPerLb
                    onNext(updated)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear {
            draft.targetWeightKg = isMetric ? Double(selectedKg) : Double(selectedLbs) * kgPerLb
        }
    }
}

private func formatDecimal(_ val: Double, separator: Character) -> String {
    let s = String(format: "%.1f", val)
    if separator == "," { return s.replacingOccurrences(of: ".", with: ",") }
    return s
}
