import SwiftUI

/// Full-screen celebration shown right after a successful purchase / restore so
/// the user gets clear confirmation that Premium is now active before continuing.
struct PremiumCelebrationView: View {
    var isYearly: Bool
    let onContinue: () -> Void

    @State private var appear = false
    @State private var burst = false

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            // Soft radial glow behind the crown
            Circle()
                .fill(RadialGradient(
                    colors: [FrigyBrand.primary.opacity(0.45), .clear],
                    center: .center, startRadius: 10, endRadius: 220
                ))
                .frame(width: 440, height: 440)
                .scaleEffect(burst ? 1 : 0.4)
                .opacity(burst ? 1 : 0)

            // Simple confetti
            ForEach(0..<14, id: \.self) { i in
                confettiPiece(index: i)
            }

            VStack(spacing: 24) {
                Spacer()

                ZStack {
                    Circle()
                        .fill(Color(hex: "#FFFBEB"))
                        .frame(width: 120, height: 120)
                        .overlay(Circle().stroke(Color(hex: "#FCD34D"), lineWidth: 2))
                    Image(systemName: "crown.fill")
                        .font(.system(size: 56))
                        .foregroundColor(Color(hex: "#F59E0B"))
                        .scaleEffect(appear ? 1 : 0.3)
                        .rotationEffect(.degrees(appear ? 0 : -25))
                }
                .scaleEffect(appear ? 1 : 0.5)

                VStack(spacing: 10) {
                    Text(lang.t("Willkommen bei\nFrigy Premium! 🎉"))
                        .font(.system(size: 26, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)

                    Text(isYearly
                         ? lang.t("Dein Jahresabo ist aktiv. Du hast jetzt vollen Zugriff auf alle Premium-Funktionen.")
                         : lang.t("Deine Testphase läuft. Du hast jetzt vollen Zugriff auf alle Premium-Funktionen."))
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 36)
                }
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 16)

                VStack(spacing: 12) {
                    featureLine(lang.t("KI-Mahlzeitenpläne ohne Limit"), "sparkles")
                    featureLine(lang.t("Barcode- & Foto-Scan"), "camera.fill")
                    featureLine(lang.t("KI-Coach & erweiterte Statistiken"), "brain.head.profile")
                }
                .padding(.top, 4)
                .opacity(appear ? 1 : 0)

                Spacer()

                Button(action: onContinue) {
                    Text(lang.t("Los geht's"))
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(
                            RoundedRectangle(cornerRadius: 18)
                                .fill(LinearGradient(
                                    colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ))
                                .shadow(color: FrigyBrand.primaryDeep.opacity(0.35), radius: 14, y: 6)
                        )
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 28)
                .padding(.bottom, 28)
                .opacity(appear ? 1 : 0)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.55, dampingFraction: 0.6)) { appear = true }
            withAnimation(.easeOut(duration: 0.7)) { burst = true }
        }
    }

    private func featureLine(_ text: String, _ icon: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDark)
                .frame(width: 22)
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(FrigyBrand.text)
            Spacer()
        }
        .padding(.horizontal, 44)
    }

    private func confettiPiece(index: Int) -> some View {
        let colors: [Color] = [FrigyBrand.primary, FrigyBrand.primaryDark, Color(hex: "#F59E0B"), Color(hex: "#60A5FA"), Color(hex: "#F87171")]
        let xs: [CGFloat] = [-150, -110, -70, -40, -10, 30, 60, 90, 120, 150, -130, 100, -80, 40]
        let delays: [Double] = [0, 0.05, 0.1, 0.15, 0.08, 0.02, 0.12, 0.06, 0.14, 0.04, 0.09, 0.11, 0.03, 0.07]
        let x = xs[index % xs.count]
        return RoundedRectangle(cornerRadius: 2)
            .fill(colors[index % colors.count])
            .frame(width: 8, height: 14)
            .rotationEffect(.degrees(burst ? Double(index * 47) : 0))
            .offset(x: x, y: burst ? 320 : -120)
            .opacity(burst ? 0 : 1)
            .animation(.easeOut(duration: 1.1).delay(delays[index % delays.count]), value: burst)
    }
}
