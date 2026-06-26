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

            // Gender selection cards — modern symbol badges (no PNGs)
            HStack(spacing: 14) {
                genderCard(
                    id: "male",
                    symbol: "♂",
                    label: "Männlich",
                    badgeColors: [Color(hex: "#7DD3FC"), Color(hex: "#3B82F6")]
                )
                genderCard(
                    id: "female",
                    symbol: "♀",
                    label: "Weiblich",
                    badgeColors: [Color(hex: "#FBCFE8"), Color(hex: "#EC4899")]
                )
            }
            .frame(maxWidth: 340)
            .padding(.horizontal, 20)

            // Non-binary / diverse — full-width pill card to match the new style
            nonBinaryCard
                .frame(maxWidth: 340)
                .padding(.horizontal, 20)
                .padding(.top, 12)

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

    private func genderCard(id: String, symbol: String, label: String, badgeColors: [Color]) -> some View {
        let selected = draft.gender == id
        return Button {
            draft.gender = id
        } label: {
            VStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: badgeColors,
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 68, height: 68)
                        .shadow(color: badgeColors.last!.opacity(selected ? 0.35 : 0.18),
                                radius: selected ? 12 : 6, y: 4)

                    Text(symbol)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.white)
                }

                Text(label)
                    .font(.system(size: 16, weight: selected ? .bold : .semibold))
                    .foregroundColor(FrigyBrand.text.opacity(selected ? 1.0 : 0.75))
                    .tracking(-0.3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 22)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(selected ? FrigyBrand.selectedBg : Color(UIColor.secondarySystemBackground).opacity(0.5))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(selected ? FrigyBrand.primary : FrigyBrand.cardBorder.opacity(0.6),
                            lineWidth: selected ? 2.5 : 1.5)
            )
            .overlay(alignment: .topTrailing) {
                if selected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(.white, FrigyBrand.primaryDark)
                        .padding(10)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .scaleEffect(selected ? 1.03 : 1.0)
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: selected)
    }

    private var nonBinaryCard: some View {
        let selected = draft.gender == "non-binary"
        return Button {
            draft.gender = selected ? nil : "non-binary"
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: [Color(hex: "#C4B5FD"), Color(hex: "#8B5CF6")],
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 40, height: 40)
                    Text("⚧")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                }

                Text("Non-Binär / Divers")
                    .font(.system(size: 15, weight: selected ? .bold : .semibold))
                    .foregroundColor(FrigyBrand.text.opacity(selected ? 1.0 : 0.8))
                    .tracking(-0.3)

                Spacer()

                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22))
                    .foregroundStyle(selected ? AnyShapeStyle(.white) : AnyShapeStyle(FrigyBrand.cardBorder),
                                     selected ? AnyShapeStyle(FrigyBrand.primaryDark) : AnyShapeStyle(Color.clear))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(selected ? FrigyBrand.selectedBg : Color(UIColor.secondarySystemBackground).opacity(0.5))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(selected ? FrigyBrand.primary : FrigyBrand.cardBorder.opacity(0.6),
                            lineWidth: selected ? 2.5 : 1.5)
            )
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: selected)
    }
}
