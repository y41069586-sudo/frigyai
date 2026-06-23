import SwiftUI

struct ShoppingListIntroStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let items: [(emoji: String, label: String)] = [
        ("🥛", "Bio-Hafermilch"),
        ("🥑", "Avocados"),
        ("🐟", "Lachsfilet"),
        ("🥗", "Rucola-Salat"),
        ("🍓", "Bio-Beeren"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question with mint highlight
            Group {
                Text("") +
                Text("Einkaufsliste")
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .underline(color: FrigyBrand.primary) +
                Text(" generieren")
            }
            .font(.system(size: 19, weight: .semibold))
            .foregroundColor(FrigyBrand.text)
            .tracking(-0.5)
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 4)

            // Subtitle
            Text("Nur die Zutaten, die dir noch fehlen.")
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "#7C9388"))
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

            Spacer()

            // Shopping list card hero
            shoppingListCard
                .frame(maxWidth: .infinity)

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    private var shoppingListCard: some View {
        ZStack(alignment: .top) {
            // Clipboard clip at top
            RoundedRectangle(cornerRadius: 8)
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#FBFFFD"), FrigyBrand.primary, FrigyBrand.primaryDark],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .frame(width: 34, height: 14)
                .overlay(
                    Capsule()
                        .fill(Color.white.opacity(0.4))
                        .frame(width: 14, height: 4)
                        .offset(y: 5)
                )
                .shadow(color: Color(hex: "#186848").opacity(0.45), radius: 6, y: 3)
                .offset(y: 0)
                .zIndex(2)

            // Card body
            ZStack {
                // Floor shadow
                Ellipse()
                    .fill(
                        RadialGradient(
                            colors: [Color(hex: "#39D47F").opacity(0.22), .clear],
                            center: .center, startRadius: 0, endRadius: 74
                        )
                    )
                    .frame(width: 148, height: 18)
                    .blur(radius: 2)
                    .offset(y: 128)

                VStack(spacing: 0) {
                    // Header
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(
                                        LinearGradient(colors: [Color(hex: "#FBFFFD"), FrigyBrand.primary], startPoint: .topLeading, endPoint: .bottomTrailing)
                                    )
                                    .frame(width: 14, height: 14)
                                Image(systemName: "cart.fill")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            VStack(alignment: .leading, spacing: 0) {
                                Text("Meine Einkaufsliste")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                Text("\(items.count) Artikel")
                                    .font(.system(size: 10))
                                    .foregroundColor(Color(hex: "#7C9388"))
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 14)
                    .padding(.bottom, 8)

                    Divider()
                        .overlay(Color(hex: "#EDF7F1"))
                        .padding(.horizontal, 16)

                    // Items
                    VStack(spacing: 0) {
                        ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                            HStack(spacing: 8) {
                                // Check circle
                                ZStack {
                                    Circle()
                                        .fill(
                                            LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing)
                                        )
                                        .frame(width: 22, height: 22)
                                        .shadow(color: Color(hex: "#4AE896").opacity(0.5), radius: 4, y: 1)
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.white)
                                }

                                // Emoji badge
                                ZStack {
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(FrigyBrand.selectedBg)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 6)
                                                .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                                        )
                                        .frame(width: 22, height: 22)
                                    Text(item.emoji)
                                        .font(.system(size: 12))
                                }

                                Text(item.label)
                                    .font(.system(size: 11.5, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                    .tracking(-0.3)
                                    .lineLimit(1)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            if i < items.count - 1 {
                                Spacer().frame(height: 8)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(width: 192, height: 238)
                .background(
                    RoundedRectangle(cornerRadius: 18)
                        .fill(LinearGradient(colors: [.white, Color(hex: "#FAFFFC")], startPoint: .top, endPoint: .bottom))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(Color(hex: "#D1D5DB"), lineWidth: 1)
                        )
                        .shadow(color: Color(hex: "#0A7848").opacity(0.20), radius: 22, y: 12)
                )
            }
            .offset(y: 9)
        }
        .frame(width: 200, height: 260)
    }
}
