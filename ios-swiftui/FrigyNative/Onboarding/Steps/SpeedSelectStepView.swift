import SwiftUI

struct SpeedSelectStepView: View {
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

    private let options: [(kg: Double, icon: String, title: String, subtitle: String)] = [
        (0.25, "tortoise.fill",  "Gemächlich",  "0,25 kg/Woche — besonders sanft"),
        (0.5,  "figure.walk",   "Ausgewogen",  "0,5 kg/Woche — empfohlen"),
        (0.75, "hare.fill",     "Zügig",       "0,75 kg/Woche — ambitioniert"),
        (1.0,  "bolt.fill",     "Intensiv",    "1,0 kg/Woche — sehr konsequent"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    Spacer().frame(height: 12)

                    OnboardingQuestion(text: "Wie schnell möchtest du dein Ziel erreichen?")

                    VStack(spacing: 10) {
                        ForEach(options, id: \.title) { opt in
                            OnboardingSelectionCard(
                                opt.title,
                                subtitle: opt.subtitle,
                                systemImage: opt.icon,
                                isSelected: draft.weeklyGoalKg == opt.kg
                            ) {
                                draft.weeklyGoalKg = opt.kg
                            }
                        }
                    }
                    .padding(.horizontal, 24)

                    Spacer().frame(height: 100)
                }
            }
            .overlay(alignment: .bottom) {
                VStack(spacing: 0) {
                    LinearGradient(colors: [FrigyBrand.bg.opacity(0), FrigyBrand.bg], startPoint: .top, endPoint: .bottom)
                        .frame(height: 32)
                    OnboardingContinueButton {
                        onNext(draft)
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                    .background(FrigyBrand.bg)
                }
            }
        }
    }
}
