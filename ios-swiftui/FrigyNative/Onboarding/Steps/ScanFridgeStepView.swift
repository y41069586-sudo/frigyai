import SwiftUI

struct ScanFridgeStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var scanPulse = false

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                // Animated scan icon
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.12))
                        .frame(width: 120, height: 120)
                        .scaleEffect(scanPulse ? 1.15 : 1.0)
                        .animation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true), value: scanPulse)

                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.22))
                        .frame(width: 88, height: 88)

                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }
                .onAppear { scanPulse = true }

                VStack(spacing: 8) {
                    Text("Kühlschrank scannen")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)

                    Text("Frigy erkennt deine Zutaten automatisch und schlägt passende Rezepte vor.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    featureRow("camera.fill",        "Foto aufnehmen oder hochladen")
                    featureRow("sparkles",           "KI erkennt Lebensmittel")
                    featureRow("fork.knife",         "Passende Rezepte werden vorgeschlagen")
                    featureRow("cart.badge.plus",    "Fehlende Zutaten ergänzen")
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton("Verstanden", action: onNext)
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
