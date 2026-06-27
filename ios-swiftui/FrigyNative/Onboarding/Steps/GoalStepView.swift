import SwiftUI

struct GoalStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: String? = nil

    private let options = [
        ("lose",     "arrow.down.circle.fill", "Abnehmen",       "Körperfett reduzieren & leichter werden"),
        ("maintain", "equal.circle.fill",      "Gewicht halten", "Gesund bleiben & Gewicht stabilisieren"),
        ("gain",     "arrow.up.circle.fill",   "Zunehmen",       "Muskeln aufbauen & Körpergewicht steigern"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Was ist dein Ziel?")

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
