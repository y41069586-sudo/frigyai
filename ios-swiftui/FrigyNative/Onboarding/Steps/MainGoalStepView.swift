import SwiftUI

struct MainGoalStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft

    @Environment(LanguageManager.self) private var lang

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
    }

    private var options: [(id: String, icon: String, titleA: String, titleB: String)] {
        [
            ("lose",     "flame.fill",    lang.t("Gewicht"),  lang.t("abnehmen")),
            ("maintain", "scalemass.fill",lang.t("Gewicht"),  lang.t("beibehalten")),
            ("gain",     "dumbbell.fill", lang.t("Gewicht"),  lang.t("zulegen")),
        ]
    }

    private var canProceed: Bool {
        ["lose", "maintain", "gain"].contains(draft.goalMode)
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            FrigyMascotQuestion(lang.t("Was ist dein Ziel?"))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            Spacer()

            // Option cards
            VStack(spacing: 10) {
                ForEach(options, id: \.id) { opt in
                    goalCard(opt)
                }
            }
            .frame(maxWidth: 340)
            .padding(.horizontal, 20)

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(isEnabled: canProceed) {
                    onNext(draft)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    private func goalCard(_ opt: (id: String, icon: String, titleA: String, titleB: String)) -> some View {
        let isSelected = draft.goalMode == opt.id
        return Button {
            if opt.id == "maintain" {
                draft.goalMode = "maintain"
                draft.targetWeightKg = draft.weightKg
            } else {
                draft.goalMode = opt.id
            }
        } label: {
            HStack(spacing: 12) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isSelected ? Color(hex: "#C0FFD9") : Color(hex: "#EAFFF5"))
                        .frame(width: 40, height: 40)
                    Image(systemName: opt.icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                // Text
                HStack(spacing: 6) {
                    Text(opt.titleA)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(FrigyBrand.text)
                        .tracking(-0.3)
                    Text(opt.titleB)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.text)
                        .tracking(-0.3)
                }
                Spacer()

                // Checkmark
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary)
                        .frame(width: 28, height: 28)
                        .shadow(color: FrigyBrand.borderMint.opacity(0.6), radius: 5, y: 2)
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                }
                .opacity(isSelected ? 1 : 0)
                .scaleEffect(isSelected ? 1 : 0.6)
                .animation(.spring(duration: 0.18), value: isSelected)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isSelected ? FrigyBrand.selectedBg : Color(UIColor.systemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(
                                isSelected ? FrigyBrand.borderMint : Color(hex: "#D1D5DB"),
                                lineWidth: 1.5
                            )
                    )
                    .shadow(
                        color: isSelected ? FrigyBrand.borderMint.opacity(0.35) : Color.black.opacity(0.02),
                        radius: isSelected ? 10 : 1, y: isSelected ? 4 : 1
                    )
            )
            .scaleEffect(isSelected ? 1.02 : 1)
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.2), value: isSelected)
    }
}
