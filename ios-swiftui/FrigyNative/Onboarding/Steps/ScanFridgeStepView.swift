import SwiftUI

struct ScanFridgeStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var pulseScale: CGFloat = 1.0
    @State private var floatOffset: CGFloat = 0

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question with mint highlight
            Group {
                Text("Erkenne deine ") +
                Text("Zutaten")
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .underline(color: FrigyBrand.primary)
            }
            .font(.system(size: 19, weight: .semibold))
            .foregroundColor(FrigyBrand.text)
            .tracking(-0.5)
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 4)

            // Subtitle
            Text("Scanne später deinen Kühlschrank — Frigy erkennt, was du hast und was für deinen Plan noch fehlt.")
                .font(.system(size: 15))
                .foregroundColor(Color(hex: "#7C9388"))
                .lineSpacing(3)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

            Spacer()

            // Camera hero illustration
            cameraHero

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                pulseScale = 1.08
            }
            withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) {
                floatOffset = -4
            }
        }
    }

    private var cameraHero: some View {
        ZStack {
            // Outer glow ring
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "#6EECC0").opacity(0.25), Color(hex: "#6EECC0").opacity(0)],
                        center: .center, startRadius: 0, endRadius: 100
                    )
                )
                .frame(width: 200, height: 200)
                .scaleEffect(pulseScale)

            // Floor shadow
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "#4AE896").opacity(0.25), .clear],
                        center: .center, startRadius: 0, endRadius: 80
                    )
                )
                .frame(width: 180, height: 22)
                .blur(radius: 2)
                .offset(y: 78)

            // Camera box (floating)
            ZStack {
                RoundedRectangle(cornerRadius: 40)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#FBFFFD"), FrigyBrand.primary],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 140, height: 140)
                    .shadow(
                        color: Color(hex: "#4AE896").opacity(0.55),
                        radius: 28, y: 10
                    )

                Image(systemName: "camera")
                    .font(.system(size: 56, weight: .light))
                    .foregroundColor(.white)
            }
            .offset(y: floatOffset)
        }
        .frame(width: 200, height: 200)
        .frame(maxWidth: .infinity)
    }
}
