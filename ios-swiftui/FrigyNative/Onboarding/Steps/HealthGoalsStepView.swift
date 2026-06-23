import SwiftUI

struct HealthGoalsStepView: View {
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

    private let options: [(id: String, emoji: String, title: String)] = [
        ("fitness",           "🏋️", "Fitness & Straffung"),
        ("performance",       "⚡",  "Sportliche Leistung verbessern"),
        ("anti-inflammatory", "🌿", "Entzündungshemmende Ernährung"),
        ("energy",            "🔋", "Energie steigern"),
        ("pregnancy",         "🤰", "Ernährung während der Schwangerschaft"),
        ("digestion",         "✨", "Verdauungsgesundheit verbessern"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            Text("Was möchtest du erreichen?")
                .font(.system(size: 19, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
                .tracking(-0.5)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            // Option cards (scrollable)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 10) {
                    ForEach(options, id: \.id) { opt in
                        healthGoalCard(opt)
                    }
                    Color.clear.frame(height: 16)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(isEnabled: !draft.healthGoals.isEmpty) {
                    onNext(draft)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    private func healthGoalCard(_ opt: (id: String, emoji: String, title: String)) -> some View {
        let isSelected = draft.healthGoals.contains(opt.id)
        return Button {
            if isSelected {
                draft.healthGoals.removeAll { $0 == opt.id }
            } else {
                draft.healthGoals.append(opt.id)
            }
        } label: {
            HStack(spacing: 12) {
                // Emoji icon
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isSelected ? Color(hex: "#C0FFD9") : Color(hex: "#EAFFF5"))
                        .frame(width: 40, height: 40)
                    Text(opt.emoji)
                        .font(.system(size: 20))
                }

                // Title
                Text(opt.title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.text)
                    .tracking(-0.3)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // Checkmark
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary)
                        .frame(width: 28, height: 28)
                        .shadow(color: Color(hex: "#6EECC0").opacity(0.6), radius: 5, y: 2)
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
                    .fill(isSelected ? FrigyBrand.selectedBg : Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(
                                isSelected ? FrigyBrand.primary : Color(hex: "#D1D5DB"),
                                lineWidth: 1.5
                            )
                    )
                    .shadow(
                        color: isSelected ? Color(hex: "#6EECC0").opacity(0.35) : Color.black.opacity(0.02),
                        radius: isSelected ? 10 : 1, y: isSelected ? 4 : 1
                    )
            )
            .scaleEffect(isSelected ? 1.02 : 1)
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.2), value: isSelected)
    }
}
