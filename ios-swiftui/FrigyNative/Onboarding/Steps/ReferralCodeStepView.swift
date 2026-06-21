import SwiftUI

struct ReferralCodeStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var code: String
    @FocusState private var focused: Bool

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _code = State(initialValue: profile.referralCode ?? "")
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Hast du einen Einladungscode?")

                VStack(spacing: 12) {
                    OnboardingInputCard {
                        TextField("Code eingeben (optional)", text: $code)
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                            .multilineTextAlignment(.center)
                            .autocapitalization(.allCharacters)
                            .focused($focused)
                    }
                    .frame(maxWidth: 300)

                    Text("Freunde können dir ihren Referral-Code schicken.")
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                }
            }

            Spacer()

            VStack(spacing: 10) {
                if !code.trimmingCharacters(in: .whitespaces).isEmpty {
                    OnboardingContinueButton("Code anwenden") {
                        var updated = profile
                        updated.referralCode = code.trimmingCharacters(in: .whitespaces)
                        onNext(updated)
                    }
                    .padding(.horizontal, 24)
                }
                Button("Ohne Code weiter") {
                    var updated = profile
                    updated.referralCode = nil
                    onNext(updated)
                }
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(FrigyBrand.primaryDark)
            }
            .padding(.bottom, 40)
        }
    }
}
