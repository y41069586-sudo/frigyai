import SwiftUI

struct AllergiesStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var otherText: String = ""
    @FocusState private var otherFocused: Bool

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
    }

    private let options: [(id: String, emoji: String, title: String, isNone: Bool, isOther: Bool)] = [
        ("none",      "✅", "Keine Allergien",    true, false),
        ("peanuts",   "🥜", "Erdnüsse",           false, false),
        ("tree-nuts", "🌰", "Schalenfrüchte",     false, false),
        ("milk",      "🥛", "Milch",              false, false),
        ("eggs",      "🥚", "Eier",               false, false),
        ("fish",      "🐟", "Fisch",              false, false),
        ("shellfish", "🦐", "Schalentiere",       false, false),
        ("soy",       "🫘", "Soja",               false, false),
        ("wheat",     "🌾", "Weizen",             false, false),
        ("other",     "✏️", "Andere",             false, true),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            FrigyMascotQuestion("Hast du Allergien oder Unverträglichkeiten?")
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            // Option cards (scrollable)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 10) {
                    ForEach(options, id: \.id) { opt in
                        allergyCard(opt)

                        // Inline "Other" text field
                        if opt.isOther && draft.allergies.contains("other") {
                            allergyOtherField
                                .transition(.opacity.combined(with: .move(edge: .top)))
                        }
                    }
                    Color.clear.frame(height: 16)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .animation(.easeInOut(duration: 0.22), value: draft.allergies.contains("other"))
            }

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(isEnabled: !draft.allergies.isEmpty) {
                    onNext(draft)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    private func allergyCard(_ opt: (id: String, emoji: String, title: String, isNone: Bool, isOther: Bool)) -> some View {
        let isSelected = draft.allergies.contains(opt.id)
        return Button {
            toggle(id: opt.id, isNone: opt.isNone, isOther: opt.isOther)
        } label: {
            HStack(spacing: 16) {
                // Emoji icon
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(isSelected ? Color(hex: "#C0FFD9") : Color(hex: "#EAFFF5"))
                        .frame(width: 40, height: 40)
                    Text(opt.emoji)
                        .font(.system(size: 20))
                }

                // Title
                Text(opt.title)
                    .font(.system(size: 15.5, weight: .medium))
                    .foregroundColor(FrigyBrand.text)
                    .tracking(-0.3)
                    .frame(maxWidth: .infinity, alignment: .leading)

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
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isSelected ? FrigyBrand.selectedBg : Color(UIColor.systemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(
                                isSelected ? FrigyBrand.primary : Color(hex: "#D1D5DB"),
                                lineWidth: 1.5
                            )
                    )
                    .shadow(
                        color: isSelected ? FrigyBrand.borderMint.opacity(0.35) : Color.black.opacity(0.02),
                        radius: isSelected ? 8 : 1, y: isSelected ? 3 : 1
                    )
            )
            .scaleEffect(isSelected ? 1.02 : 1)
        }
        .buttonStyle(.plain)
        .animation(.spring(duration: 0.18), value: isSelected)
    }

    private var allergyOtherField: some View {
        TextField("Beschreibe deine Allergie…", text: $otherText)
            .font(.system(size: 15))
            .foregroundColor(FrigyBrand.text)
            .focused($otherFocused)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(FrigyBrand.bg)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(FrigyBrand.borderMint, lineWidth: 1.5)
            )
            .shadow(color: FrigyBrand.borderMint.opacity(0.2), radius: 7, y: 2)
            .onAppear { otherFocused = true }
    }

    private func toggle(id: String, isNone: Bool, isOther: Bool) {
        if isNone {
            let has = draft.allergies.contains("none")
            draft.allergies = has ? [] : ["none"]
        } else {
            draft.allergies.removeAll { $0 == "none" }
            let has = draft.allergies.contains(id)
            if has {
                draft.allergies.removeAll { $0 == id }
                if isOther { otherText = "" }
            } else {
                draft.allergies.append(id)
            }
        }
    }
}
