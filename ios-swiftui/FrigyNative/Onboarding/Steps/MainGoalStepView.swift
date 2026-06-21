import SwiftUI

struct MainGoalStepView: View {
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
        ("lose",     "arrow.down.circle.fill", "Abnehmen",          "Gewicht reduzieren & Körperfett abbauen"),
        ("maintain", "equal.circle.fill",      "Gewicht halten",    "Aktuelles Gewicht behalten"),
        ("gain",     "arrow.up.circle.fill",   "Gewicht zunehmen",  "Muskelmasse & Körpergewicht aufbauen"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Was ist dein Hauptziel?")

                VStack(spacing: 10) {
                    ForEach(options, id: \.id) { opt in
                        OnboardingSelectionCard(
                            opt.title,
                            subtitle: opt.subtitle,
                            systemImage: opt.icon,
                            isSelected: draft.goalMode == opt.id
                        ) {
                            draft.goalMode = opt.id
                        }
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton {
                onNext(draft)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }
}
