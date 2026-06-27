import SwiftUI

struct BodyBasicsStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 88, height: 88)
                    Image(systemName: "figure.stand")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 8) {
                    Text("Körperdaten")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("Damit Frigy deinen persönlichen Kalorienbedarf genau berechnen kann.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    dataRow("scalemass.fill",    "Aktuelles Gewicht",  "Ausgangspunkt für deinen Plan")
                    dataRow("ruler.fill",         "Körpergröße",        "Für den BMI-Berechnung")
                    dataRow("calendar.circle",    "Alter",              "Beeinflusst deinen Stoffwechsel")
                    dataRow("person.fill",        "Geschlecht",         "Für genaue Kalorienberechnung")
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton("Verstanden", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func dataRow(_ icon: String, _ title: String, _ detail: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(FrigyBrand.selectedBg)
                    .frame(width: 40, height: 40)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
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
        .padding(12)
        .background(Color(UIColor.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
