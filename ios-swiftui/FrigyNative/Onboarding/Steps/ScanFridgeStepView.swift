import SwiftUI
import AVFoundation

struct ScanFridgeStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var pulseScale: CGFloat = 1.0
    @State private var floatOffset: CGFloat = 0
    @State private var appeared = false

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion(lang.t("Erkenne deine Zutaten."))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 4)

            Text(lang.t("Scanne später deinen Kühlschrank — Frigy erkennt, was du hast und was für deinen Plan noch fehlt."))
                .font(.system(size: 14))
                .foregroundColor(FrigyBrand.textMuted)
                .lineSpacing(3)
                .multilineTextAlignment(.leading)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)
                .opacity(appeared ? 1 : 0)
                .animation(.easeOut(duration: 0.4).delay(0.3), value: appeared)

            Spacer()

            cameraHero
                .scaleEffect(appeared ? 1 : 0.8)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.55, dampingFraction: 0.7).delay(0.15), value: appeared)

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton {
                    Task {
                        _ = await AVCaptureDevice.requestAccess(for: .video)
                        await MainActor.run { onNext() }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear {
            appeared = true
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                pulseScale = 1.08
            }
            withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) {
                floatOffset = -6
            }
        }
    }

    private var cameraHero: some View {
        ZStack {
            // Outer glow ring
            Circle()
                .fill(
                    RadialGradient(
                        colors: [FrigyBrand.primary.opacity(0.22), FrigyBrand.primary.opacity(0)],
                        center: .center, startRadius: 0, endRadius: 110
                    )
                )
                .frame(width: 220, height: 220)
                .scaleEffect(pulseScale)

            // Floor shadow
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "#4AE896").opacity(0.2), .clear],
                        center: .center, startRadius: 0, endRadius: 80
                    )
                )
                .frame(width: 180, height: 22)
                .blur(radius: 3)
                .offset(y: 82)

            // Camera box (floating)
            ZStack {
                RoundedRectangle(cornerRadius: 40)
                    .fill(Color(UIColor.systemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 40)
                            .stroke(FrigyBrand.cardBorder, lineWidth: 1.5)
                    )
                    .frame(width: 148, height: 148)
                    .shadow(color: Color(hex: "#4AE896").opacity(0.45), radius: 28, y: 12)

                Image(systemName: "camera.fill")
                    .font(.system(size: 54, weight: .light))
                    .foregroundStyle(FrigyBrand.buttonGradient)
            }
            .offset(y: floatOffset)
        }
        .frame(width: 220, height: 210)
        .frame(maxWidth: .infinity)
    }
}
