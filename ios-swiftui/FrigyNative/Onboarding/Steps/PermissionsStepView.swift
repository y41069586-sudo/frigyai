import SwiftUI
import UserNotifications
import AVFoundation
#if canImport(HealthKit)
import HealthKit
#endif

struct PermissionsStepView: View {
    let step: OnboardingStep
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var requested = false

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 80, height: 80)
                    Image(systemName: "bell.badge.fill")
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 10) {
                    Text(lang.t("Bleib am Ball"))
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t("Aktiviere Erinnerungen, damit du deine Mahlzeiten nicht vergisst und dein Ziel erreichst."))
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 8)
                }

                VStack(spacing: 10) {
                    permissionRow(lang.t("Mahlzeit-Erinnerungen"), icon: "fork.knife")
                    permissionRow(lang.t("Fortschritts-Updates"), icon: "chart.line.uptrend.xyaxis")
                    permissionRow(lang.t("Kamera & Barcode-Scan"), icon: "camera.fill")
                    permissionRow(lang.t("Gesundheits-App verbinden"), icon: "heart.fill")
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            VStack(spacing: 12) {
                OnboardingContinueButton(lang.t("Benachrichtigungen erlauben")) {
                    requestAndContinue()
                }
                .padding(.horizontal, 24)

                Button(lang.t("Überspringen")) { onNext() }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(FrigyBrand.textMuted)
            }
            .padding(.bottom, 40)
        }
    }

    private func permissionRow(_ label: String, icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDark)
                .frame(width: 28)
            Text(label)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(FrigyBrand.text)
            Spacer()
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(FrigyBrand.primary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(UIColor.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }

    private func requestAndContinue() {
        Task {
            _ = try? await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
            _ = await AVCaptureDevice.requestAccess(for: .video)
            await HealthKitService.shared.requestAuthorization()
            await MainActor.run { onNext() }
        }
    }
}
