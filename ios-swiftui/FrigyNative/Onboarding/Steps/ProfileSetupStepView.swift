import SwiftUI

struct ProfileSetupStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let steps = [
        ("person.fill",      "Körperdaten",     "Gewicht, Größe & Alter"),
        ("target",           "Ziele",           "Was du erreichen möchtest"),
        ("fork.knife",       "Ernährung",       "Präferenzen & Allergien"),
        ("chart.bar.fill",   "Dein Plan",       "Wochenplan & Makros"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.15))
                            .frame(width: 88, height: 88)
                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 36, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }

                    Spacer().frame(height: 4)

                    Text("Jetzt dein Profil einrichten")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)

                    Text("Damit können wir deinen Plan perfekt auf dich abstimmen.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                }

                // Steps preview
                VStack(spacing: 10) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { idx, step in
                        HStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(FrigyBrand.selectedBg)
                                    .frame(width: 40, height: 40)
                                Image(systemName: step.0)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(FrigyBrand.primaryDark)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(step.1)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                Text(step.2)
                                    .font(.system(size: 13))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                            Spacer()
                            Text("\(idx + 1)")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(FrigyBrand.primaryDark)
                                .frame(width: 24, height: 24)
                                .background(FrigyBrand.primary.opacity(0.2))
                                .clipShape(Circle())
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color(UIColor.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.cardBorder, lineWidth: 1))
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton("Los geht's!", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
