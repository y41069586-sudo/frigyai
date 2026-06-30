import SwiftUI

struct SuccessStatsStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var appeared = false

    @Environment(LanguageManager.self) private var lang

    private var stats: [(String, String, String)] {
        [
            ("10.000+", lang.t("aktive Nutzer"),         "person.3.fill"),
            ("Ø -8 kg", lang.t("in 3 Monaten"),          "arrow.down.circle.fill"),
            ("4,8 ★",   lang.t("App-Bewertung"),          "star.fill"),
            ("92 %",    lang.t("erreichen ihr Ziel"),     "checkmark.seal.fill"),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                VStack(spacing: 6) {
                    Text(lang.t("Andere schaffen es –"))
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t("du auch!"))
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(Array(stats.enumerated()), id: \.offset) { idx, stat in
                        statCard(value: stat.0, label: stat.1, icon: stat.2)
                            .opacity(appeared ? 1 : 0)
                            .offset(y: appeared ? 0 : 20)
                            .animation(.spring(duration: 0.5).delay(Double(idx) * 0.1), value: appeared)
                    }
                }
                .padding(.horizontal, 24)

                Text(lang.t("Tausende Menschen haben mit Frigy ihre Ernährung transformiert."))
                    .font(.system(size: 14))
                    .foregroundColor(FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 36)
            }

            Spacer()

            OnboardingContinueButton(lang.t("Das kann ich auch!"), action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
        .onAppear { appeared = true }
    }

    private func statCard(value: String, label: String, icon: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDark)
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundColor(FrigyBrand.text)
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(FrigyBrand.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(Color(UIColor.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
