import SwiftUI

struct GoalPreviewStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private var diffKg: Double { profile.weightKg - profile.targetWeightKg }

    private var goalTitle: String {
        switch profile.goalMode {
        case "lose":     return "Abnehmen"
        case "gain":     return "Zunehmen"
        default:         return "Gewicht halten"
        }
    }

    private var weeksEstimate: Int {
        guard profile.weeklyGoalKg > 0, abs(diffKg) > 0 else { return 0 }
        return Int(ceil(abs(diffKg) / profile.weeklyGoalKg))
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                OnboardingQuestion(text: "Dein Ziel")

                VStack(spacing: 12) {
                    statCard("Startgewicht", value: String(format: "%.1f kg", profile.weightKg), icon: "scalemass.fill")
                    statCard("Zielgewicht", value: String(format: "%.1f kg", profile.targetWeightKg), icon: "target")
                    if weeksEstimate > 0 {
                        statCard("Geschätzte Dauer", value: "\(weeksEstimate) Wochen", icon: "calendar.badge.clock")
                    }
                    statCard("Tempo", value: String(format: "%.2f kg / Woche", profile.weeklyGoalKg), icon: "speedometer")
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton("Klingt gut!", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func statCard(_ label: String, value: String, icon: String) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDark)
                .frame(width: 28)
            Text(label)
                .font(.system(size: 15))
                .foregroundColor(FrigyBrand.textMuted)
            Spacer()
            Text(value)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
