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

    private let options: [(id: String, icon: String, label: String)] = [
        ("male",       "figure.stand",          "Männlich"),
        ("female",     "figure.stand.dress",     "Weiblich"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                OnboardingQuestion(text: "Was ist dein biologisches Geschlecht?")

                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        ForEach(options, id: \.id) { opt in
                            genderCard(opt)
                        }
                    }
                    .padding(.horizontal, 24)

                    Button {
                        let newVal = draft.gender == "non-binary" ? nil : "non-binary"
                        draft.gender = newVal
                    } label: {
                        HStack(spacing: 10) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 5)
                                    .stroke(draft.gender == "non-binary" ? FrigyBrand.primaryDark : FrigyBrand.cardBorder, lineWidth: 2)
                                    .frame(width: 20, height: 20)
                                    .background(draft.gender == "non-binary" ? FrigyBrand.primary : .clear)
                                    .clipShape(RoundedRectangle(cornerRadius: 5))
                                if draft.gender == "non-binary" {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                }
                            }
                            Text("Non-Binär / Divers")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(FrigyBrand.text.opacity(draft.gender == "non-binary" ? 1 : 0.7))
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 4)
                }
            }

            Spacer()

            OnboardingContinueButton(isEnabled: draft.gender != nil) {
                onNext(draft)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }

    private func genderCard(_ opt: (id: String, icon: String, label: String)) -> some View {
        let selected = draft.gender == opt.id
        return Button {
            draft.gender = opt.id
        } label: {
            VStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(selected ? FrigyBrand.primary.opacity(0.2) : FrigyBrand.selectedBg.opacity(0.5))
                        .frame(width: 72, height: 72)
                    Image(systemName: opt.icon)
                        .font(.system(size: 30, weight: .medium))
                        .foregroundColor(selected ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
                }
                Text(opt.label)
                    .font(.system(size: 15, weight: selected ? .semibold : .medium))
                    .foregroundColor(FrigyBrand.text)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(selected ? FrigyBrand.selectedBg : .white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(selected ? FrigyBrand.primary : FrigyBrand.cardBorder, lineWidth: selected ? 2 : 1)
                    )
            )
            .scaleEffect(selected ? 1.02 : 1)
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.22), value: selected)
    }
}
