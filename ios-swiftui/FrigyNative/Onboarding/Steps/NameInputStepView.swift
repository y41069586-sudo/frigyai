import SwiftUI

struct NameInputStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var name: String
    @FocusState private var focused: Bool

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _name = State(initialValue: profile.name)
    }

    private var trimmed: String { name.trimmingCharacters(in: .whitespaces) }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Wie sollen wir dich nennen?")

                OnboardingInputCard {
                    TextField("Dein Vorname", text: $name)
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                        .autocapitalization(.words)
                        .focused($focused)
                }
                .frame(maxWidth: 300)
            }

            Spacer()

            OnboardingContinueButton(isEnabled: !trimmed.isEmpty) {
                var updated = profile
                updated.name = trimmed
                onNext(updated)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .onAppear { focused = true }
    }
}
