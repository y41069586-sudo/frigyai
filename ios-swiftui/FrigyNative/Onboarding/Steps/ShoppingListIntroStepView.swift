import SwiftUI

struct ShoppingListIntroStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let items = [
        ("Hähnchenbrust",   "500g",  true),
        ("Brokkoli",        "1 Stk", true),
        ("Lachs",           "300g",  false),
        ("Haferflocken",    "500g",  false),
        ("Griechischer Joghurt", "200g", false),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 88, height: 88)
                    Image(systemName: "cart.fill")
                        .font(.system(size: 34, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 8) {
                    Text("Deine Einkaufsliste")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)

                    Text("Frigy erstellt automatisch eine Einkaufsliste für deinen Wochenplan.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                // Mock shopping list
                VStack(spacing: 8) {
                    ForEach(items, id: \.0) { item in
                        shoppingRow(name: item.0, amount: item.1, checked: item.2)
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton("Klingt gut!", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func shoppingRow(name: String, amount: String, checked: Bool) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(checked ? FrigyBrand.primary : FrigyBrand.cardBorder.opacity(0.5))
                    .frame(width: 24, height: 24)
                if checked {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            Text(name)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(checked ? FrigyBrand.textMuted : FrigyBrand.text)
                .strikethrough(checked, color: FrigyBrand.textMuted)
            Spacer()
            Text(amount)
                .font(.system(size: 13))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
