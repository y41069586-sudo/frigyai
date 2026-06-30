import SwiftUI

struct WeeklyPlanPreviewStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var appeared = false

    @Environment(LanguageManager.self) private var lang

    private var days: [(short: String, meals: [String])] {
        [
            (lang.t("Mo"), [lang.t("🥗 Quinoa-Bowl"), lang.t("🍗 Hähnchen-Wrap")]),
            (lang.t("Di"), [lang.t("🥑 Avocado-Toast"), lang.t("🍓 Beeren-Smoothie")]),
            (lang.t("Mi"), [lang.t("🐟 Lachs & Reis"), lang.t("🥦 Gemüse-Curry")]),
            (lang.t("Do"), [lang.t("🍳 Rührei & Toast"), lang.t("🥩 Steak-Salat")]),
            (lang.t("Fr"), [lang.t("🌯 Veggie-Wrap"), lang.t("🍝 Pasta bolognese")]),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion(lang.t("Dein Wochenplan, perfekt auf dich abgestimmt."))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 4)

            Text(lang.t("KI plant deine Mahlzeiten basierend auf deinem Ziel und Geschmack."))
                .font(.system(size: 14))
                .foregroundColor(FrigyBrand.textMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
                .lineSpacing(2)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)
                .opacity(appeared ? 1 : 0)
                .animation(.easeOut(duration: 0.4).delay(0.2), value: appeared)

            Spacer()

            planCard
                .scaleEffect(appeared ? 1 : 0.88)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.5, dampingFraction: 0.72).delay(0.12), value: appeared)

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

    private var planCard: some View {
        VStack(spacing: 0) {
            // Card header
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(FrigyBrand.buttonGradient)
                        .frame(width: 36, height: 36)
                    Image(systemName: "calendar")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(lang.t("Mein Wochenplan"))
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t("KI-generiert · Diese Woche"))
                        .font(.system(size: 12))
                        .foregroundColor(FrigyBrand.textMuted)
                }
                Spacer()
                HStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                    Text(lang.t("Dein Plan"))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(FrigyBrand.primaryDeep)
                }
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
                ForEach(Array(days.enumerated()), id: \.offset) { idx, day in
                    HStack(alignment: .top, spacing: 12) {
                        Text(day.short)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(FrigyBrand.primaryDeep)
                            .frame(width: 28, alignment: .leading)
                            .padding(.top, 1)

                        VStack(alignment: .leading, spacing: 3) {
                            ForEach(day.meals, id: \.self) { meal in
                                Text(meal)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(FrigyBrand.text)
                            }
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 9)
                    .opacity(appeared ? 1 : 0)
                    .offset(x: appeared ? 0 : 14)
                    .animation(.spring(response: 0.4, dampingFraction: 0.72).delay(0.22 + Double(idx) * 0.06), value: appeared)

                    if idx < days.count - 1 {
                        Divider()
                            .overlay(FrigyBrand.borderMint.opacity(0.3))
                            .padding(.horizontal, 18)
                    }
                }
            }
            .padding(.bottom, 14)
        }
        .background(
            RoundedRectangle(cornerRadius: 22)
                .fill(Color(UIColor.systemBackground))
                .overlay(
                    RoundedRectangle(cornerRadius: 22)
                        .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                )
                .shadow(color: FrigyBrand.primaryDark.opacity(0.1), radius: 18, y: 8)
        )
        .padding(.horizontal, 24)
    }
}
