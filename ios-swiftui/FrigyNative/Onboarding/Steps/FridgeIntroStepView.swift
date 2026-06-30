import SwiftUI

struct FridgeIntroStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var doorOpen = false

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.12))
                        .frame(width: 110, height: 110)
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.22))
                        .frame(width: 82, height: 82)
                    Image(systemName: "refrigerator.fill")
                        .font(.system(size: 34, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                        .scaleEffect(doorOpen ? 1.05 : 1.0)
                        .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: doorOpen)
                }
                .onAppear { doorOpen = true }

                VStack(spacing: 8) {
                    Text(lang.t("Dein Kühlschrank"))
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t("Scanne deinen Kühlschrank und lass Frigy den Rest erledigen."))
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    featureRow("camera.viewfinder",  lang.t("Foto aufnehmen"))
                    featureRow("brain.head.profile",  lang.t("KI erkennt Lebensmittel"))
                    featureRow("fork.knife.circle.fill", lang.t("Rezepte aus deinen Zutaten"))
                    featureRow("leaf.fill",           lang.t("Weniger Lebensmittelverschwendung"))
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
            Image(systemName: "checkmark")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(FrigyBrand.primaryDark)
        }
    }
}
