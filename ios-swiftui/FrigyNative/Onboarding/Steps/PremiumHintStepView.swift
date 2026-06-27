import SwiftUI

struct PremiumHintStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let features = [
        ("sparkles",           "Unbegrenzte Wochenpläne",       "Täglich frisch generiert"),
        ("camera.viewfinder",  "Kühlschrank scannen",           "Unlimitierte Scans pro Monat"),
        ("chart.bar.fill",     "Detaillierte Analysen",         "Nährwerte, Trends & Fortschritt"),
        ("cart.fill",          "Smarte Einkaufsliste",          "Automatisch & sortiert"),
        ("bell.fill",          "Erinnerungen",                  "Mahlzeiten & Trinkwasser"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.15))
                            .frame(width: 88, height: 88)
                        Image(systemName: "crown.fill")
                            .font(.system(size: 34, weight: .semibold))
                            .foregroundColor(Color(hex: "#F59E0B"))
                    }
                    Text("Frigy Premium")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("Alle Features. Keine Einschränkungen.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                }

                VStack(spacing: 8) {
                    ForEach(features, id: \.0) { feat in
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(FrigyBrand.selectedBg)
                                    .frame(width: 40, height: 40)
                                Image(systemName: feat.0)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(FrigyBrand.primaryDark)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(feat.1)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                Text(feat.2)
                                    .font(.system(size: 12))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(FrigyBrand.primaryDark)
                                .font(.system(size: 16))
                        }
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
