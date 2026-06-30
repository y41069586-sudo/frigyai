import SwiftUI

struct GoalStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: String? = nil

    @Environment(LanguageManager.self) private var lang

    private var options: [(String, String, String, String)] {
        [
            ("lose",     "arrow.down.circle.fill", lang.t("Abnehmen"),       lang.t("Körperfett reduzieren & leichter werden")),
            ("maintain", "equal.circle.fill",      lang.t("Gewicht halten"), lang.t("Gesund bleiben & Gewicht stabilisieren")),
            ("gain",     "arrow.up.circle.fill",   lang.t("Zunehmen"),       lang.t("Muskeln aufbauen & Körpergewicht steigern")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: lang.t("Was ist dein Ziel?"))

                VStack(spacing: 10) {
                    ForEach(options, id: \.0) { opt in
                        OnboardingSelectionCard(
                            opt.2,
                            subtitle: opt.3,
                            systemImage: opt.1,
                            isSelected: selected == opt.0
                        ) {
                            withAnimation(.spring(duration: 0.2)) { selected = opt.0 }
                        }
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(isEnabled: selected != nil, action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
