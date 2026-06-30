import SwiftUI

struct ActivityStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @Environment(LanguageManager.self) private var lang
    @State private var draft: UserProfileDraft

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
    }

    private var options: [(id: String, icon: String, title: String, subtitle: String)] {
        [
            ("sedentary", "chair.lounge.fill",    lang.t("Wenig aktiv"),  lang.t("0 Tage pro Woche")),
            ("light",     "figure.walk",           lang.t("Leicht aktiv"), lang.t("1–2 Tage pro Woche")),
            ("moderate",  "dumbbell.fill",         lang.t("Aktiv"),        lang.t("3–5 Tage pro Woche")),
            ("active",    "bolt.fill",             lang.t("Sehr aktiv"),   lang.t("6–7 Tage pro Woche")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            FrigyMascotQuestion(lang.t("Wie aktiv bist du?"))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            // Option cards (scrollable)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 10) {
                    ForEach(options, id: \.id) { opt in
                        activityCard(opt)
                    }
                    Color.clear.frame(height: 16)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(isEnabled: draft.activityLevel != nil) {
                    onNext(draft)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    private func activityCard(_ opt: (id: String, icon: String, title: String, subtitle: String)) -> some View {
        let isSelected = draft.activityLevel == opt.id
        return Button {
            draft.activityLevel = opt.id
        } label: {
            HStack(spacing: 16) {
                // Icon container
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isSelected ? Color(hex: "#C0FFD9") : Color(hex: "#EAFFF5"))
                        .frame(width: 48, height: 48)
                        .shadow(
                            color: isSelected ? FrigyBrand.borderMint.opacity(0.45) : .clear,
                            radius: 6, y: 2
                        )
                    Image(systemName: opt.icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(isSelected ? FrigyBrand.primaryDeep : FrigyBrand.primaryDark)
                }

                // Text
                VStack(alignment: .leading, spacing: 2) {
                    Text(opt.title)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(FrigyBrand.text)
                        .tracking(-0.3)
                    Text(opt.subtitle)
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#7C9388"))
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
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? FrigyBrand.selectedBg : Color(UIColor.systemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(
                                isSelected ? FrigyBrand.borderMint : Color(hex: "#D1D5DB"),
                                lineWidth: 1.5
                            )
                    )
                    .shadow(
                        color: isSelected ? FrigyBrand.borderMint.opacity(0.35) : Color.black.opacity(0.02),
                        radius: isSelected ? 12 : 2, y: isSelected ? 4 : 1
                    )
            )
            .scaleEffect(isSelected ? 1.02 : 1)
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.2), value: isSelected)
    }
}
