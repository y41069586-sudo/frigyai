import SwiftUI

struct CookingExperienceStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: String? = nil

    private let options = [
        ("beginner",      "1.circle.fill",    "Anfänger",         "Einfache Rezepte mit wenigen Zutaten"),
        ("intermediate",  "2.circle.fill",    "Fortgeschritten",  "Ich koche gerne & experimentiere"),
        ("expert",        "3.circle.fill",    "Profi",            "Komplexe Gerichte & Techniken"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Wie sind deine Kochkenntnisse?")

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
