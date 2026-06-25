import SwiftUI

struct GenderStepView: View {
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

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question header
            VStack(alignment: .leading, spacing: 0) {
                FrigyMascotQuestion("Was ist dein biologisches Geschlecht?")
                    .padding(.horizontal, 20)
                    .padding(.top, 4)
                    .padding(.bottom, 12)
            }

            Spacer()

            // Gender image cards
            HStack(spacing: 16) {
                genderCard(id: "male", imageName: "GenderMale", label: "Männlich")
                genderCard(id: "female", imageName: "GenderFemale", label: "Weiblich")
            }
            .frame(maxWidth: 300)
            .padding(.horizontal, 20)

            // Non-binary option
            Button {
                draft.gender = draft.gender == "non-binary" ? nil : "non-binary"
            } label: {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 5)
                            .fill(draft.gender == "non-binary" ? FrigyBrand.primary : Color(UIColor.systemBackground))
                            .frame(width: 20, height: 20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 5)
                                    .stroke(
                                        draft.gender == "non-binary" ? FrigyBrand.primary : FrigyBrand.cardBorder,
                                        lineWidth: 2
                                    )
                            )
                        if draft.gender == "non-binary" {
                            Image(systemName: "checkmark")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                    .animation(.easeInOut(duration: 0.2), value: draft.gender == "non-binary")

                    Text("Non-Binär / Divers")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(FrigyBrand.text.opacity(draft.gender == "non-binary" ? 1.0 : 0.8))
                        .tracking(-0.3)
                }
            }
            .buttonStyle(.plain)
            .padding(.top, 24)

            Spacer()

            // Continue button with border separator
            VStack(spacing: 0) {
                Divider()
                    .overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(isEnabled: draft.gender != nil) {
                    onNext(draft)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    private func genderCard(id: String, imageName: String, label: String) -> some View {
        let selected = draft.gender == id
        return Button {
            draft.gender = id
        } label: {
            VStack(spacing: 10) {
                Image(imageName)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity)
                    .aspectRatio(1, contentMode: .fit)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                selected ? FrigyBrand.selectedBg : Color.clear,
                                lineWidth: 3
                            )
                            .padding(-3)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                selected ? FrigyBrand.primary : Color.clear,
                                lineWidth: 2
                            )
                            .padding(-5)
                    )

                Text(label)
                    .font(.system(size: 15, weight: selected ? .semibold : .medium))
                    .foregroundColor(FrigyBrand.text.opacity(selected ? 1.0 : 0.7))
                    .tracking(-0.3)
            }
            .scaleEffect(selected ? 1.03 : 1.0)
            .opacity(selected ? 1.0 : 0.88)
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.2), value: selected)
    }
}
