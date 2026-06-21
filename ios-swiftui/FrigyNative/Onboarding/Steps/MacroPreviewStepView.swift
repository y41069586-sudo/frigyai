import SwiftUI

struct MacroPreviewStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private var computed: UserProfileDraft {
        var p = profile
        p.recalculateMacrosIfPossible()
        return p
    }

    var body: some View {
        let p = computed

        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 32) {
                    Spacer().frame(height: 16)

                    OnboardingQuestion(text: "Dein täglicher\nErnährungsplan")

                    // Calorie ring
                    ZStack {
                        Circle()
                            .stroke(FrigyBrand.borderMint.opacity(0.3), lineWidth: 10)
                            .frame(width: 140, height: 140)
                        Circle()
                            .trim(from: 0, to: 0.75)
                            .stroke(FrigyBrand.buttonGradient, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                            .frame(width: 140, height: 140)
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 2) {
                            Text("\(p.dailyCalories)")
                                .font(.system(size: 28, weight: .black, design: .rounded))
                                .foregroundColor(FrigyBrand.text)
                            Text("kcal")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                    }

                    // Macros
                    HStack(spacing: 12) {
                        macroCard(label: "Protein", value: p.dailyProtein, unit: "g", color: Color(hex: "#FF6B6B"))
                        macroCard(label: "Kohlenhydrate", value: p.dailyCarbs, unit: "g", color: Color(hex: "#FFD93D"))
                        macroCard(label: "Fett", value: p.dailyFat, unit: "g", color: FrigyBrand.primary)
                    }
                    .padding(.horizontal, 24)

                    // Info pill
                    HStack(spacing: 8) {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(FrigyBrand.primaryDark)
                        Text("Basierend auf deinen Angaben personalisiert")
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(FrigyBrand.selectedBg)
                    .clipShape(Capsule())
                    .padding(.horizontal, 24)

                    Spacer().frame(height: 100)
                }
            }
            .overlay(alignment: .bottom) {
                VStack(spacing: 0) {
                    LinearGradient(colors: [FrigyBrand.bg.opacity(0), FrigyBrand.bg], startPoint: .top, endPoint: .bottom)
                        .frame(height: 32)
                    OnboardingContinueButton("Plan starten", action: onNext)
                        .padding(.horizontal, 24)
                        .padding(.bottom, 40)
                        .background(FrigyBrand.bg)
                }
            }
        }
    }

    private func macroCard(label: String, value: Int, unit: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Text("\(value)\(unit)")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(FrigyBrand.text)
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
                .multilineTextAlignment(.center)
            Rectangle()
                .fill(color)
                .frame(height: 3)
                .clipShape(Capsule())
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(FrigyBrand.cardBorder, lineWidth: 1)
        )
    }
}
