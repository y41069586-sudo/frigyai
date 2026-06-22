import SwiftUI

struct IntroStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.18))
                        .frame(width: 100, height: 100)
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.30))
                        .frame(width: 76, height: 76)
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                }

                VStack(spacing: 10) {
                    Text("Willkommen bei Frigy")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                    Text("Dein persönlicher KI-Ernährungsassistent für eine gesündere Lebensweise.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    pillRow("Personalisierte Ernährungspläne")
                    pillRow("KI-gestützte Kühlschrank-Erkennung")
                    pillRow("Automatische Einkaufsliste")
                    pillRow("Kalorien & Makros tracken")
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton("Jetzt starten", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func pillRow(_ text: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 18))
                .foregroundColor(FrigyBrand.primaryDark)
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(FrigyBrand.text)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
