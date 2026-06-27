import SwiftUI

struct MotivationStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: Set<String> = []

    private let options = [
        ("look",    "eye.fill",             "Besser aussehen",    "Körper formen & definieren"),
        ("health",  "heart.fill",           "Gesünder leben",     "Wohlbefinden & Energie steigern"),
        ("sport",   "figure.run",           "Sportliche Leistung","Fitness & Ausdauer verbessern"),
        ("energy",  "bolt.fill",            "Mehr Energie",       "Vitaler & aktiver im Alltag"),
        ("sleep",   "moon.stars.fill",      "Besser schlafen",    "Erholung & Regeneration"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    Spacer().frame(height: 8)

                    OnboardingQuestion(text: "Was motiviert dich?")

                    Text("Mehrere Antworten möglich")
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
