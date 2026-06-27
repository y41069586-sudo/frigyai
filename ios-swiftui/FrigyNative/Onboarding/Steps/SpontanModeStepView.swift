import SwiftUI

struct SpontanModeStepView: View {
    let step: OnboardingStep
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private var isStep2: Bool { step == .spontanMode2 }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 88, height: 88)
                    Image(systemName: isStep2 ? "bolt.circle.fill" : "bolt.fill")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 8) {
                    Text("Spontan-Modus")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(isStep2
                         ? "So trackst du täglich flexibel deine Mahlzeiten."
                         : "Iss was du möchtest – tracke einfach & flexibel.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                if isStep2 {
                    VStack(spacing: 10) {
                        featureRow("barcode.viewfinder", "Barcode scannen")
                        featureRow("magnifyingglass",    "Gericht suchen & hinzufügen")
                        featureRow("fork.knife",         "Portion anpassen")
                        featureRow("chart.bar.fill",     "Tagesübersicht kontrollieren")
                    }
                    .padding(.horizontal, 24)
                } else {
                    VStack(spacing: 10) {
                        featureRow("checkmark.circle",  "Kein fixer Wochenplan notwendig")
                        featureRow("clock",             "Tracke wann & was du möchtest")
                        featureRow("heart.fill",        "Bleib trotzdem in deinem Ziel")
                    }
                    .padding(.horizontal, 24)
                }
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
