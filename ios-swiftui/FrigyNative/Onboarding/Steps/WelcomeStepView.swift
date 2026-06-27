import SwiftUI

struct WelcomeStepView: View {
    let onNext: () -> Void
    let onSignIn: () -> Void

    @State private var opacity = 0.0
    @State private var offsetY = 24.0

    var body: some View {
        ZStack {
            FrigyBrand.bg.ignoresSafeArea()

            // Subtle mint radial glow at top
            VStack {
                RadialGradient(
                    colors: [FrigyBrand.primary.opacity(0.22), .clear],
                    center: .top,
                    startRadius: 0,
                    endRadius: 320
                )
                .frame(height: 340)
                .ignoresSafeArea()
                Spacer()
            }

            VStack(spacing: 0) {
                Spacer()

                // Logo
                VStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.18))
                            .frame(width: 88, height: 88)
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.30))
                            .frame(width: 66, height: 66)
                        Image(systemName: "leaf.fill")
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDeep)
                    }
                    Text("Frigy")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.primaryDark)
                        .tracking(1)
                }

                Spacer().frame(height: 36)

                // Headline
                VStack(spacing: 4) {
                    Text("Iss smarter.")
                        .font(.system(size: 42, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                    Text("Leb leichter.")
                        .font(.system(size: 42, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                Spacer().frame(height: 18)

                // Subline
                Text("Generiere Wochenpläne, scanne deinen Kühlschrank und bekomme automatisch deine Einkaufsliste.")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 36)

                // Feature bullets
                VStack(spacing: 12) {
                    featureRow("sparkles",        "KI-generierte Wochenpläne")
                    featureRow("barcode.viewfinder", "Barcode & Kühlschrank scannen")
                    featureRow("cart.fill",       "Automatische Einkaufsliste")
                }
                .padding(.horizontal, 40)

                Spacer()

                // CTA
                VStack(spacing: 14) {
                    OnboardingContinueButton("Loslegen", action: onNext)
                        .padding(.horizontal, 24)

                    Button(action: onSignIn) {
                        Text("Bereits ein Konto? ")
                            .foregroundColor(FrigyBrand.textMuted)
                        + Text("Anmelden")
                            .foregroundColor(FrigyBrand.primaryDark)
                            .bold()
                    }
                    .font(.system(size: 14))
                }
                .padding(.bottom, 44)
            }
        }
        .opacity(opacity)
        .offset(y: offsetY)
        .onAppear {
            withAnimation(.easeOut(duration: 0.5)) {
                opacity = 1
                offsetY = 0
            }
        }
    }

    private func featureRow(_ icon: String, _ label: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(FrigyBrand.primary.opacity(0.18))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(FrigyBrand.text)
            Spacer()
        }
    }
}
