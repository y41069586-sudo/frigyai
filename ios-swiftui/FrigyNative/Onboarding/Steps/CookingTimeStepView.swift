import SwiftUI

struct CookingTimeStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: String? = nil

    private let options = [
        ("quick",  "timer",          "< 30 Minuten",  "Schnelle Gerichte für den Alltag"),
        ("medium", "clock.fill",     "30–60 Minuten", "Ausgewogene Mahlzeiten mit mehr Abwechslung"),
        ("long",   "flame.fill",     "> 60 Minuten",  "Aufwändige Gerichte & Meal Prep"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Wie viel Zeit nimmst du dir zum Kochen?")

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
