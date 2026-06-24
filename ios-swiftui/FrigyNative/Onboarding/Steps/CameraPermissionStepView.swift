import SwiftUI
import AVFoundation

struct CameraPermissionStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var pulseScale: CGFloat = 1.0
    @State private var ringOpacity: Double = 0.3

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            VStack(spacing: 0) {
                Text("Kamera-Zugriff")
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundColor(FrigyBrand.text)
                    .tracking(-0.5)
                    .padding(.horizontal, 20)
                    .padding(.top, 4)
                    .padding(.bottom, 4)

                Text("Für den Kühlschrank-Scan und Barcode-Scanner braucht Frigy deine Kamera.")
                    .font(.system(size: 15))
                    .foregroundColor(FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 12)
            }

            Spacer()

            cameraIllustration

            Spacer()

            VStack(spacing: 16) {
                featureRow("camera.viewfinder", "Kühlschrank scannen", "KI erkennt alle Zutaten per Foto")
                featureRow("barcode.viewfinder", "Barcode-Scanner", "Nährwerte direkt aus dem Barcode")
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton("Kamera erlauben") {
                    requestAndContinue()
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)

                Button("Überspringen") { onNext() }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(FrigyBrand.textMuted)
                    .padding(.top, 12)
                    .padding(.bottom, max(20, 16))
            }
            .background(FrigyBrand.bg)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) {
                pulseScale = 1.12
                ringOpacity = 0.08
            }
        }
    }

    private var cameraIllustration: some View {
        ZStack {
            Circle()
                .fill(FrigyBrand.primary.opacity(ringOpacity))
                .frame(width: 180, height: 180)
                .scaleEffect(pulseScale)

            Circle()
                .fill(FrigyBrand.primary.opacity(0.12))
                .frame(width: 140, height: 140)

            ZStack {
                RoundedRectangle(cornerRadius: 32)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#FBFFFD"), FrigyBrand.primary],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 110, height: 110)
                    .shadow(color: Color(hex: "#4AE896").opacity(0.50), radius: 24, y: 10)

                Image(systemName: "camera.fill")
                    .font(.system(size: 44, weight: .light))
                    .foregroundColor(.white)
            }
        }
        .frame(width: 180, height: 180)
        .frame(maxWidth: .infinity)
    }

    private func featureRow(_ icon: String, _ title: String, _ subtitle: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(FrigyBrand.primary.opacity(0.18))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(FrigyBrand.text)
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundColor(FrigyBrand.textMuted)
            }
            Spacer()
        }
        .padding(14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }

    private func requestAndContinue() {
        Task {
            _ = await AVCaptureDevice.requestAccess(for: .video)
            await MainActor.run { onNext() }
        }
    }
}
