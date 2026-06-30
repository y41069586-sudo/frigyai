import SwiftUI

struct GoalModeStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: String? = nil

    @Environment(LanguageManager.self) private var lang

    private var options: [(String, String, String, String)] {
        [
            ("strict",   "bolt.fill",         lang.t("Strikt"),       lang.t("Klare Regeln, schnellere Ergebnisse")),
            ("balanced", "leaf.fill",          lang.t("Ausgewogen"),   lang.t("Nachhaltig & langfristig")),
            ("flexible", "wind",              lang.t("Flexibel"),     lang.t("Lockerer Ansatz mit Spielraum")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: lang.t("Welchen Modus bevorzugst du?"))

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
