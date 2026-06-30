import SwiftUI

struct HowItWorksStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 88, height: 88)
                    Image(systemName: "questionmark.circle.fill")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 8) {
                    Text(lang.t("Wie es funktioniert"))
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                    Text(lang.t("Frigy kombiniert KI-Technologie mit deinen persönlichen Daten für perfekte Ergebnisse."))
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    stepRow("1", lang.t("Profil erstellen"), lang.t("Teile deine Ziele und Körperdaten"))
                    stepRow("2", lang.t("KI analysiert dich"), lang.t("Frigy berechnet deine optimalen Nährwerte"))
                    stepRow("3", lang.t("Plan erhalten"),   lang.t("Personalisierter Wochenplan in Sekunden"))
                    stepRow("4", lang.t("Fortschritt sehen"), lang.t("Tracke täglich und erreiche dein Ziel"))
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func stepRow(_ num: String, _ title: String, _ detail: String) -> some View {
        HStack(spacing: 14) {
            Text(num)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 30, height: 30)
                .background(FrigyBrand.buttonGradient)
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(FrigyBrand.text)
                Text(detail)
                    .font(.system(size: 13))
                    .foregroundColor(FrigyBrand.textMuted)
            }
            Spacer()
        }
        .padding(14)
        .background(Color(UIColor.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
