import SwiftUI

struct WeeklyPlanPreviewStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let entries: [(emoji: String, label: String)] = [
        ("🥗", "Quinoa-Bowl"),
        ("🥑", "Avocado-Toast"),
        ("🍗", "Hähnchen-Wrap"),
        ("🍓", "Beeren-Smoothie"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question with mint highlight
            Group {
                Text("Erreiche dein Ziel durch einen ") +
                Text("Wochenplan")
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .underline(color: FrigyBrand.primary) +
                Text(" gezielt auf dein Kalorienziel.")
            }
            .font(.system(size: 19, weight: .semibold))
            .foregroundColor(FrigyBrand.text)
            .tracking(-0.5)
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 12)

            Spacer()

            // Notebook hero
            mealNotebook
                .padding(.horizontal, 20)

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

    private var mealNotebook: some View {
        ZStack {
            // Floating food emojis
            Text("🥑")
                .font(.system(size: 22))
                .offset(x: -110, y: -4)
                .rotationEffect(.degrees(-8))

            Text("🥕")
                .font(.system(size: 20))
                .offset(x: 110, y: -2)
                .rotationEffect(.degrees(10))

            Text("🍅")
                .font(.system(size: 19))
                .offset(x: -120, y: 80)
                .rotationEffect(.degrees(-4))

            Text("🥦")
                .font(.system(size: 19))
                .offset(x: 115, y: 70)
                .rotationEffect(.degrees(14))

            // Shadow page behind
            RoundedRectangle(cornerRadius: 18)
                .fill(Color(hex: "#F1FBF6"))
                .frame(width: 220, height: 256)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(Color(hex: "#D1D5DB"), lineWidth: 1)
                )
                .offset(x: 4, y: 4)
                .shadow(color: Color(hex: "#0A7848").opacity(0.12), radius: 14, y: 8)

            // Main notebook page
            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 18)
                    .fill(
                        LinearGradient(colors: [.white, Color(hex: "#FAFFFC")], startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 220, height: 256)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(Color(hex: "#BCFDDC"), lineWidth: 1)
                    )
                    .shadow(color: Color(hex: "#0A7848").opacity(0.18), radius: 22, y: 12)

                // Spiral binding stripe
                Rectangle()
                    .fill(
                        LinearGradient(colors: [Color(hex: "#FBFFFD"), FrigyBrand.primary], startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 22, height: 256)
                    .clipShape(
                        UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: 18)
                    )

                // Spiral rings
                VStack(spacing: 18) {
                    ForEach(0..<8, id: \.self) { _ in
                        Circle()
                            .fill(Color.white)
                            .overlay(Circle().stroke(FrigyBrand.primaryDark, lineWidth: 2))
                            .frame(width: 10, height: 10)
                    }
                }
                .padding(.leading, 6)
                .padding(.top, 22)

                // Page content
                VStack(alignment: .leading, spacing: 0) {
                    // Header
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                        Text("Mein Plan")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(FrigyBrand.text)
                    }
                    .padding(.bottom, 12)

                    // Entry list
                    VStack(spacing: 12) {
                        ForEach(entries, id: \.label) { entry in
                            HStack(spacing: 10) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(FrigyBrand.selectedBg)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(FrigyBrand.borderMint, lineWidth: 1)
                                        )
                                        .frame(width: 32, height: 32)
                                    Text(entry.emoji)
                                        .font(.system(size: 16))
                                }
                                Text(entry.label)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                    .tracking(-0.3)
                                    .lineLimit(1)
                            }
                        }
                    }
                }
                .padding(.leading, 36)
                .padding(.top, 18)
                .padding(.trailing, 16)
                .frame(width: 220, alignment: .topLeading)
            }
            .frame(width: 220, height: 256)
        }
        .frame(width: 260, height: 300)
        .frame(maxWidth: .infinity)
    }
}
