import SwiftUI

struct WeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var selectedKg: Int = 70
    @State private var selectedLbs: Int = 154

    private let kgPerLb = 0.45359237

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let kg = profile.weightKg > 0 ? Int(round(profile.weightKg)) : 70
        let lbs = profile.weightKg > 0 ? Int(round(profile.weightKg / 0.45359237)) : 154
        _selectedKg  = State(initialValue: min(max(kg, 30), 250))
        _selectedLbs = State(initialValue: min(max(lbs, 66), 550))
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion("Wie viel wiegst du aktuell?")
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            MintSegmentedControl(
                options: [("metric", "Metrisch"), ("imperial", "Imperial")],
                selected: isMetric ? "metric" : "imperial"
            ) { id in
                let wasMetric = isMetric
                isMetric = (id == "metric")
                // Sync the other unit when switching
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
                        draft.weightKg = Double(kg)
                    }
            } else {
                NumberScrollInput(value: $selectedLbs, range: 66...550, unit: "lbs")
                    .padding(.horizontal, 20)
                    .onChange(of: selectedLbs) { _, lbs in
                        draft.weightKg = Double(lbs) * kgPerLb
                    }
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton {
                    var updated = draft
                    updated.weightKg = isMetric ? Double(selectedKg) : Double(selectedLbs) * kgPerLb
                    onNext(updated)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear {
            draft.weightKg = isMetric ? Double(selectedKg) : Double(selectedLbs) * kgPerLb
        }
    }
}
