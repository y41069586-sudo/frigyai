import SwiftUI

struct TutorialTransitionStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(LanguageManager.self) private var lang

    private var features: [(String, String, String, String)] {
        [
            ("1", "camera.viewfinder",   lang.t("Kühlschrank scannen"),       lang.t("Foto machen – KI erkennt alle Zutaten")),
            ("2", "calendar",            lang.t("Wochenplan erhalten"),        lang.t("Personalisierte Mahlzeiten für 7 Tage")),
            ("3", "cart.fill",           lang.t("Einkaufsliste"),              lang.t("Fehlende Zutaten werden automatisch ergänzt")),
            ("4", "chart.bar.fill",      lang.t("Fortschritt tracken"),        lang.t("Kalorien & Makros im Blick behalten")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.15))
                            .frame(width: 80, height: 80)
                        Image(systemName: "sparkles")
                            .font(.system(size: 32, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    Text(lang.t("So funktioniert Frigy"))
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                }

                VStack(spacing: 10) {
                    ForEach(features, id: \.0) { feat in
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(FrigyBrand.selectedBg)
                                    .frame(width: 44, height: 44)
                                Image(systemName: feat.1)
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundColor(FrigyBrand.primaryDark)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(feat.2)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                Text(feat.3)
                                    .font(.system(size: 13))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                            Spacer()
                            Text(feat.0)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(FrigyBrand.primaryDark)
                                .frame(width: 22, height: 22)
                                .background(FrigyBrand.primary.opacity(0.25))
                                .clipShape(Circle())
                        }
                        .padding(14)
                        .background(Color(UIColor.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.cardBorder, lineWidth: 1))
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(lang.t("Jetzt loslegen"), action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
