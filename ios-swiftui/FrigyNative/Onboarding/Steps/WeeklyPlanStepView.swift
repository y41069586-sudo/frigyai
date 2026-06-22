import SwiftUI

struct WeeklyPlanStepView: View {
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
                    Image(systemName: "calendar")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 8) {
                    Text("Dein Wochenplan")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("Frigy erstellt dir einen vollständigen 7-Tage-Ernährungsplan – automatisch & personalisiert.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    featureRow("sparkles",       "KI wählt optimale Mahlzeiten")
                    featureRow("heart.fill",     "Abgestimmt auf deine Präferenzen")
                    featureRow("scalemass.fill", "Kalorienziel wird eingehalten")
                    featureRow("arrow.clockwise","Jede Woche frisch generiert")
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func featureRow(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(FrigyBrand.selectedBg)
                    .frame(width: 38, height: 38)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(FrigyBrand.text)
            Spacer()
        }
    }
}
