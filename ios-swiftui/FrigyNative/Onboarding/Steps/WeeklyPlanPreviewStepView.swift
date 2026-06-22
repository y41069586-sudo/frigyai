import SwiftUI

struct WeeklyPlanPreviewStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    private let meals = [
        ("Frühstück",  "Haferflocken mit Beeren",    "sunrise.fill"),
        ("Mittagessen","Hähnchen mit Quinoa",         "sun.max.fill"),
        ("Abendessen", "Lachs mit Brokkoli",          "moon.fill"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    Spacer().frame(height: 8)

                    VStack(spacing: 6) {
                        Text("Dein Wochenplan")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                            .multilineTextAlignment(.center)
                        Text("Personalisiert für deine Ziele")
                            .font(.system(size: 15))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.horizontal, 24)

                    // Day selector
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(Array(days.enumerated()), id: \.offset) { idx, day in
                                VStack(spacing: 4) {
                                    Text(day)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(idx == 0 ? .white : FrigyBrand.textMuted)
                                        .frame(width: 38, height: 38)
                                        .background(idx == 0 ? FrigyBrand.buttonGradient : AnyShapeStyle(Color.clear))
                                        .clipShape(Circle())
                                        .overlay(
                                            Circle().stroke(idx == 0 ? Color.clear : FrigyBrand.cardBorder, lineWidth: 1)
                                        )
                                }
                            }
                        }
                        .padding(.horizontal, 24)
                    }

                    // Meal cards for Monday
                    VStack(spacing: 10) {
                        ForEach(meals, id: \.0) { meal in
                            mealCard(time: meal.0, name: meal.1, icon: meal.2)
                        }
                    }
                    .padding(.horizontal, 24)

                    // Calorie summary
                    HStack(spacing: 0) {
                        macroItem(value: "1.850", label: "kcal", color: FrigyBrand.primaryDark)
                        Divider().frame(height: 36)
                        macroItem(value: "140g", label: "Protein", color: Color(hex: "#3B82F6"))
                        Divider().frame(height: 36)
                        macroItem(value: "210g", label: "Kohlenhydrate", color: Color(hex: "#F59E0B"))
                        Divider().frame(height: 36)
                        macroItem(value: "62g", label: "Fett", color: Color(hex: "#EF4444"))
                    }
                    .padding(.vertical, 16)
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(FrigyBrand.cardBorder, lineWidth: 1))
                    .padding(.horizontal, 24)

                    Spacer().frame(height: 8)
                }
            }

            OnboardingContinueButton("Sieht lecker aus!", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func mealCard(time: String, name: String, icon: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(FrigyBrand.selectedBg)
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(time)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(FrigyBrand.textMuted)
                Text(name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(FrigyBrand.text)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundColor(FrigyBrand.borderMint)
        }
        .padding(14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }

    private func macroItem(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
    }
}
