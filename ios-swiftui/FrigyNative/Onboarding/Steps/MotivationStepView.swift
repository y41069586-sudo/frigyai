import SwiftUI

struct MotivationStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: Set<String> = []

    @Environment(LanguageManager.self) private var lang

    private var options: [(String, String, String, String)] {
        [
            ("look",    "eye.fill",             lang.t("Besser aussehen"),    lang.t("Körper formen & definieren")),
            ("health",  "heart.fill",           lang.t("Gesünder leben"),     lang.t("Wohlbefinden & Energie steigern")),
            ("sport",   "figure.run",           lang.t("Sportliche Leistung"),lang.t("Fitness & Ausdauer verbessern")),
            ("energy",  "bolt.fill",            lang.t("Mehr Energie"),       lang.t("Vitaler & aktiver im Alltag")),
            ("sleep",   "moon.stars.fill",      lang.t("Besser schlafen"),    lang.t("Erholung & Regeneration")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    Spacer().frame(height: 8)

                    OnboardingQuestion(text: lang.t("Was motiviert dich?"))

                    Text(lang.t("Mehrere Antworten möglich"))
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)

                    VStack(spacing: 10) {
                        ForEach(options, id: \.0) { opt in
                            OnboardingSelectionCard(
                                opt.2,
                                subtitle: opt.3,
                                systemImage: opt.1,
                                isSelected: selected.contains(opt.0)
                            ) {
                                withAnimation(.spring(duration: 0.2)) {
                                    if selected.contains(opt.0) {
                                        selected.remove(opt.0)
                                    } else {
                                        selected.insert(opt.0)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 24)

                    Spacer().frame(height: 8)
                }
            }

            OnboardingContinueButton(isEnabled: !selected.isEmpty, action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
