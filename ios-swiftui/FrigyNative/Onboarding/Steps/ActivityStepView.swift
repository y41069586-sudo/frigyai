import SwiftUI

struct ActivityStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
    }

    private let options: [(id: String, icon: String, title: String, subtitle: String)] = [
        ("low",    "figure.walk",          "Wenig aktiv",       "Überwiegend sitzend, wenig Sport"),
        ("medium", "figure.run",           "Mäßig aktiv",       "1–3x Sport pro Woche"),
        ("high",   "figure.highintensity.intervaltraining", "Sehr aktiv", "Tägliche körperliche Aktivität"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Wie aktiv bist du im Alltag?")

                VStack(spacing: 10) {
                    ForEach(options, id: \.id) { opt in
                        OnboardingSelectionCard(
                            opt.title,
                            subtitle: opt.subtitle,
                            systemImage: opt.icon,
                            isSelected: draft.activityLevel == opt.id
                        ) {
                            draft.activityLevel = opt.id
                        }
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(isEnabled: draft.activityLevel != nil) {
                onNext(draft)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }
}
