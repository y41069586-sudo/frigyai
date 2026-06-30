import SwiftUI

struct WeeklyPlanStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var appeared = false

    @Environment(LanguageManager.self) private var lang

    private var features: [(icon: String, color: Color, label: String)] {
        [
            ("sparkles",        Color(hex: "#75FBB2"), lang.t("KI wählt optimale Mahlzeiten")),
            ("heart.fill",      Color(hex: "#FF6B8A"), lang.t("Abgestimmt auf deine Präferenzen")),
            ("scalemass.fill",  Color(hex: "#75FBB2"), lang.t("Kalorienziel wird eingehalten")),
            ("arrow.clockwise", Color(hex: "#60B4FF"), lang.t("Jede Woche frisch generiert")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion(lang.t("Was erwartet dich bei Frigy?"))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            Spacer()

            VStack(spacing: 24) {
                // Hero icon
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.14))
                        .frame(width: 96, height: 96)
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.08))
                        .frame(width: 74, height: 74)
                    Image(systemName: "calendar")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }
                .scaleEffect(appeared ? 1 : 0.7)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.5, dampingFraction: 0.65).delay(0.15), value: appeared)

                // Title + subtitle
                VStack(spacing: 6) {
                    Text(lang.t("Dein Wochenplan"))
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t("Frigy erstellt dir einen vollständigen 7-Tage-Ernährungsplan – automatisch & personalisiert."))
                        .font(.system(size: 14))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 28)
                }
                .opacity(appeared ? 1 : 0)
                .animation(.easeOut(duration: 0.35).delay(0.25), value: appeared)

                // Feature rows
                VStack(spacing: 0) {
                    ForEach(Array(features.enumerated()), id: \.offset) { idx, feature in
                        featureRow(feature, delay: 0.35 + Double(idx) * 0.07)
                        if idx < features.count - 1 {
                            Divider()
                                .overlay(FrigyBrand.borderMint.opacity(0.4))
                                .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.white.opacity(0.85))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                        )
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.08), radius: 12, y: 4)
                )
                .padding(.horizontal, 20)
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(action: onNext)
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, max(20, 16))
                    .background(FrigyBrand.bg)
            }
        }
        .onAppear { appeared = true }
    }

    private func featureRow(_ feature: (icon: String, color: Color, label: String), delay: Double) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(feature.color.opacity(0.15))
                    .frame(width: 40, height: 40)
                Image(systemName: feature.icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(feature.color == Color(hex: "#75FBB2") ? FrigyBrand.primaryDark : feature.color)
            }
            Text(feature.label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(FrigyBrand.text)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .opacity(appeared ? 1 : 0)
        .offset(x: appeared ? 0 : 20)
        .animation(.spring(response: 0.4, dampingFraction: 0.7).delay(delay), value: appeared)
    }
}
