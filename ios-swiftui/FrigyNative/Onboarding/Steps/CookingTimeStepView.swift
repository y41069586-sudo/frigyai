import SwiftUI

struct CookingTimeStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: String? = nil

    @Environment(LanguageManager.self) private var lang

    private var options: [(String, String, String, String)] {
        [
            ("quick",  "timer",          lang.t("< 30 Minuten"),  lang.t("Schnelle Gerichte für den Alltag")),
            ("medium", "clock.fill",     lang.t("30–60 Minuten"), lang.t("Ausgewogene Mahlzeiten mit mehr Abwechslung")),
            ("long",   "flame.fill",     lang.t("> 60 Minuten"),  lang.t("Aufwändige Gerichte & Meal Prep")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: lang.t("Wie viel Zeit nimmst du dir zum Kochen?"))

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
