import SwiftUI

struct DietaryPreferencesStepView: View {
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
        ("balanced",     "🥗", "Ausgewogene Ernährung"),
        ("vegan",        "🌱", "Vegan"),
        ("vegetarian",   "🧀", "Vegetarisch"),
        ("keto",         "🥩", "Keto-Diät"),
        ("low-carb",     "🥑", "Kohlenhydratarme Diät"),
        ("paleo",        "🍖", "Paleo-Diät"),
    ]

    private var selectedId: String? { draft.dietaryPreferences.first }
    private var canProceed: Bool { selectedId != nil }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            Text("Wie ist dein Ernährungsziel?")
                .font(.system(size: 19, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
                .tracking(-0.5)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            // 2-column grid (scrollable)
            ScrollView(showsIndicators: false) {
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)],
                    spacing: 10
                ) {
                    ForEach(options, id: \.id) { opt in
                        dietCard(opt)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 16)
            }

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

    private func dietCard(_ opt: (id: String, emoji: String, title: String)) -> some View {
        let isSelected = selectedId == opt.id
        return Button {
            draft.dietaryPreferences = [opt.id]
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    // Emoji icon
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isSelected ? Color(hex: "#C0FFD9") : Color(hex: "#EAFFF5"))
                            .frame(width: 36, height: 36)
                        Text(opt.emoji)
                            .font(.system(size: 18))
                    }
                    Spacer()
                    // Checkmark
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary)
                            .frame(width: 24, height: 24)
                            .shadow(color: Color(hex: "#6EECC0").opacity(0.6), radius: 4, y: 2)
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .opacity(isSelected ? 1 : 0)
                    .scaleEffect(isSelected ? 1 : 0.6)
                    .animation(.spring(duration: 0.18), value: isSelected)
                }
                .padding(.bottom, 8)

                Text(opt.title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(FrigyBrand.text)
                    .tracking(-0.3)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(12)
            .frame(maxWidth: .infinity, minHeight: 104, alignment: .topLeading)
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
