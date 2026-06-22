import SwiftUI

struct GoalSelectionStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected: String? = nil

    private let options = [
        (
            id: "structured",
            icon: "calendar.badge.checkmark",
            title: "Strukturiert",
            subtitle: "Wochenpläne mit festen Mahlzeiten & Einkaufslisten",
            badge: "Empfohlen"
        ),
        (
            id: "spontan",
            icon: "bolt.fill",
            title: "Spontan",
            subtitle: "Flexibel tracken ohne feste Pläne",
            badge: String?.none
        ),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Wie möchtest du Frigy nutzen?")

                VStack(spacing: 12) {
                    ForEach(options, id: \.id) { opt in
                        goalCard(opt)
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(isEnabled: selected != nil, action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func goalCard(_ opt: (id: String, icon: String, title: String, subtitle: String, badge: String?)) -> some View {
        let isSelected = selected == opt.id

        return Button {
            withAnimation(.spring(duration: 0.2)) { selected = opt.id }
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isSelected ? FrigyBrand.primary : FrigyBrand.selectedBg.opacity(0.5))
                        .frame(width: 50, height: 50)
                    Image(systemName: opt.icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(isSelected ? .white : FrigyBrand.primaryDark)
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(opt.title)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(FrigyBrand.text)
                        if let badge = opt.badge {
                            Text(badge)
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(FrigyBrand.primaryDark)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(FrigyBrand.primary.opacity(0.25))
                                .clipShape(Capsule())
                        }
                    }
                    Text(opt.subtitle)
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(FrigyBrand.primaryDark)
                        .font(.system(size: 22))
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isSelected ? FrigyBrand.selectedBg : .white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isSelected ? FrigyBrand.primary : FrigyBrand.cardBorder, lineWidth: isSelected ? 1.5 : 1)
                    )
            )
        }
        .buttonStyle(.plain)
        .scaleEffect(isSelected ? 1.01 : 1)
    }
}
