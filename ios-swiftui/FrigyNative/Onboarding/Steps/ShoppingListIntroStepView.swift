import SwiftUI

struct ShoppingListIntroStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var appeared = false

    private let items: [(emoji: String, label: String)] = [
        ("🥛", "Bio-Hafermilch"),
        ("🥑", "Avocados"),
        ("🐟", "Lachsfilet"),
        ("🥗", "Rucola-Salat"),
        ("🍓", "Bio-Beeren"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion("Deine Einkaufsliste, automatisch.")
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 4)

            Text("Nur die Zutaten, die dir noch fehlen.")
                .font(.system(size: 14))
                .foregroundColor(FrigyBrand.textMuted)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

            Spacer()

            shoppingCard
                .frame(maxWidth: .infinity)
                .scaleEffect(appeared ? 1 : 0.88)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(0.12), value: appeared)

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(action: onNext)
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, max(20, 16))
                    .background(FrigyBrand.bg)
            }
        }
        .onAppear { appeared = true }
    }

    private var shoppingCard: some View {
        VStack(spacing: 0) {
            // Card header
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(FrigyBrand.buttonGradient)
                        .frame(width: 36, height: 36)
                    Image(systemName: "cart.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Meine Einkaufsliste")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("\(items.count) Artikel")
                        .font(.system(size: 12))
                        .foregroundColor(FrigyBrand.textMuted)
                }
                Spacer()
                Text("Heute")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(FrigyBrand.primary.opacity(0.18), in: Capsule())
            }
            .padding(.horizontal, 18)
            .padding(.top, 16)
            .padding(.bottom, 12)

            Divider()
                .overlay(FrigyBrand.borderMint.opacity(0.5))
                .padding(.horizontal, 18)

            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { idx, item in
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 18))
                            .foregroundColor(FrigyBrand.primaryDark)
                        Text(item.emoji)
                            .font(.system(size: 18))
                        Text(item.label)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(FrigyBrand.text)
                        Spacer()
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
                    .opacity(appeared ? 1 : 0)
                    .offset(x: appeared ? 0 : 16)
                    .animation(.spring(response: 0.4, dampingFraction: 0.7).delay(0.2 + Double(idx) * 0.06), value: appeared)

                    if idx < items.count - 1 {
                        Divider()
                            .overlay(FrigyBrand.borderMint.opacity(0.3))
                            .padding(.horizontal, 18)
                    }
                }
            }
            .padding(.bottom, 12)
        }
        .background(
            RoundedRectangle(cornerRadius: 22)
                .fill(.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 22)
                        .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                )
                .shadow(color: FrigyBrand.primaryDark.opacity(0.1), radius: 18, y: 8)
        )
        .padding(.horizontal, 28)
    }
}
