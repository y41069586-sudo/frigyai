import SwiftUI

struct PlanningSetupStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var setupProgress = 0.0

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 88, height: 88)
                    Image(systemName: "gearshape.2.fill")
                        .font(.system(size: 34, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 8) {
                    Text("Planung einrichten")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("Dein persönlicher Ernährungsplan wird jetzt vorbereitet.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 10) {
                    setupRow("person.fill",         "Profildaten übernommen",      true)
                    setupRow("target",              "Ziele gesetzt",               true)
                    setupRow("fork.knife",          "Ernährungspräferenzen",       true)
                    setupRow("calendar.badge.plus", "Wochenplan wird erstellt",    false)
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton("Weiter", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func setupRow(_ icon: String, _ label: String, _ done: Bool) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(done ? FrigyBrand.primary.opacity(0.2) : FrigyBrand.selectedBg.opacity(0.5))
                    .frame(width: 38, height: 38)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(done ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
            }
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(done ? FrigyBrand.text : FrigyBrand.textMuted)
            Spacer()
            if done {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(FrigyBrand.primaryDark)
                    .font(.system(size: 18))
            } else {
                ProgressView()
                    .scaleEffect(0.8)
                    .tint(FrigyBrand.primaryDark)
            }
        }
        .padding(12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(done ? FrigyBrand.borderMint : FrigyBrand.cardBorder, lineWidth: 1))
    }
}
