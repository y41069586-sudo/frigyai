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

    private let options: [(id: String, icon: String, label: String)] = [
        ("none",          "fork.knife",       "Keine Einschränkung"),
        ("vegetarian",    "leaf.fill",         "Vegetarisch"),
        ("vegan",         "hare.fill",         "Vegan"),
        ("pescatarian",   "fish.fill",         "Pescetarisch"),
        ("low_carb",      "minus.circle.fill", "Low Carb"),
        ("keto",          "bolt.fill",         "Keto"),
        ("paleo",         "flame.fill",        "Paleo"),
        ("mediterranean", "sun.max.fill",      "Mediterran"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    Spacer().frame(height: 12)

                    OnboardingQuestion(text: "Hast du Ernährungspräferenzen?")

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(options, id: \.id) { opt in
                            let selected = draft.dietaryPreferences.contains(opt.id)
                            Button {
                                if opt.id == "none" {
                                    draft.dietaryPreferences = selected ? [] : ["none"]
                                } else {
                                    draft.dietaryPreferences.removeAll { $0 == "none" }
                                    if selected {
                                        draft.dietaryPreferences.removeAll { $0 == opt.id }
                                    } else {
                                        draft.dietaryPreferences.append(opt.id)
                                    }
                                }
                            } label: {
                                VStack(spacing: 8) {
                                    Image(systemName: opt.icon)
                                        .font(.system(size: 22, weight: .semibold))
                                        .foregroundColor(selected ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
                                    Text(opt.label)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(FrigyBrand.text)
                                        .multilineTextAlignment(.center)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(selected ? FrigyBrand.selectedBg : .white)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 16)
                                                .stroke(selected ? FrigyBrand.primary : FrigyBrand.cardBorder, lineWidth: selected ? 1.5 : 1)
                                        )
                                )
                            }
                            .buttonStyle(.plain)
                            .scaleEffect(selected ? 1.02 : 1)
                            .animation(.spring(duration: 0.2), value: selected)
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
