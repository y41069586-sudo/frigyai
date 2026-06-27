import SwiftUI

struct StructuredModeStepView: View {
    let step: OnboardingStep
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private var pageIndex: Int {
        switch step {
        case .structuredMode2: return 1
        case .structuredMode3: return 2
        default: return 0
        }
    }

    private let pages: [(String, String, String, [(String, String)])] = [
        (
            "calendar",
            "Strukturierter Modus",
            "Ein vollständiger Wochenplan, der genau auf dich zugeschnitten ist.",
            [
                ("sparkles",     "KI erstellt deinen persönlichen Plan"),
                ("calendar",     "7 Tage, 3 Mahlzeiten täglich"),
                ("cart.fill",    "Automatische Einkaufsliste"),
            ]
        ),
        (
            "fork.knife.circle.fill",
            "Mahlzeiten folgen",
            "Dein Plan ist dein Leitfaden – du folgst einfach den vorgeschlagenen Mahlzeiten.",
            [
                ("checkmark.circle", "Tägliche Mahlzeiten vorgeplant"),
                ("arrow.clockwise",  "Plan jederzeit anpassen"),
                ("chart.bar.fill",   "Fortschritt automatisch getrackt"),
            ]
        ),
        (
            "trophy.fill",
            "Ziel erreichen",
            "Mit Struktur und KI-Unterstützung erreichst du dein Ziel zuverlässig.",
            [
                ("flame.fill",        "Kaloriendefizit eingehalten"),
                ("scalemass.fill",    "Gewicht in Kontrolle"),
                ("star.fill",         "Nachhaltige Ergebnisse"),
            ]
        ),
    ]

    var body: some View {
        let page = pages[pageIndex]

        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 88, height: 88)
                    Image(systemName: page.0)
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 8) {
                    Text(page.1)
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                    Text(page.2)
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    ForEach(page.3, id: \.0) { item in
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(FrigyBrand.selectedBg)
                                    .frame(width: 38, height: 38)
                                Image(systemName: item.0)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(FrigyBrand.primaryDark)
                            }
                            Text(item.1)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(FrigyBrand.text)
                            Spacer()
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
