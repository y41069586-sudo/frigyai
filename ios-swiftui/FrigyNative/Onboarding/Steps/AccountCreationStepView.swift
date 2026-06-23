import SwiftUI

struct AccountCreationStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(AppRouter.self) private var router

    @State private var isLoadingApple = false
    @State private var isLoadingGoogle = false
    @State private var errorMessage: String?

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                // Header
                VStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.15))
                            .frame(width: 72, height: 72)
                        Image(systemName: "person.crop.circle.badge.checkmark")
                            .font(.system(size: 30, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }

                    Text("Fortschritt speichern")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(FrigyBrand.text)

                    Text("Erstelle ein Konto, um deinen Plan\nauch auf anderen Geräten zu nutzen.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                }

                // Auth buttons
                VStack(spacing: 12) {
                    // Apple
                    Button {
                        signInWithApple()
                    } label: {
                        HStack(spacing: 10) {
                            if isLoadingApple {
                                ProgressView().progressViewStyle(.circular).tint(.white)
                            } else {
                                Image(systemName: "apple.logo")
                                    .font(.system(size: 18, weight: .semibold))
                                Text("Mit Apple fortfahren")
                                    .font(.system(size: 16, weight: .semibold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Color(hex: "#1A1A1A"))
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                    }
                    .disabled(isLoadingApple || isLoadingGoogle)

                    // Google
                    Button {
                        signInWithGoogle()
                    } label: {
                        HStack(spacing: 10) {
                            if isLoadingGoogle {
                                ProgressView().progressViewStyle(.circular).tint(FrigyBrand.text)
                            } else {
                                Image(systemName: "globe")
                                    .font(.system(size: 18, weight: .semibold))
                                Text("Mit Google fortfahren")
                                    .font(.system(size: 16, weight: .semibold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(.white)
                        .foregroundColor(FrigyBrand.text)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(FrigyBrand.cardBorder, lineWidth: 1.5)
                        )
                    }
                    .disabled(isLoadingApple || isLoadingGoogle)
                }
                .padding(.horizontal, 24)

                if let err = errorMessage {
                    Text(err)
                        .font(.system(size: 13))
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                // Skip
                Button {
                    onNext()
                } label: {
                    Text("Überspringen")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(FrigyBrand.textMuted)
                        .underline()
                }

                // Legal notice
                Text("Mit der Registrierung stimmst du unseren\nNutzungsbedingungen und Datenschutzrichtlinien zu.")
                    .font(.system(size: 11))
                    .foregroundColor(FrigyBrand.textMuted.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()
        }
    }

    private func signInWithApple() {
        isLoadingApple = true
        errorMessage = nil
        Task {
            do {
                _ = try await router.authService.signInWithApple()
                router.onboardingCoordinator.didAuthenticate()
                onNext()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoadingApple = false
        }
    }

    private func signInWithGoogle() {
        isLoadingGoogle = true
        errorMessage = nil
        Task {
            do {
                try await router.authService.signInWithGoogle()
                router.onboardingCoordinator.didAuthenticate()
                onNext()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoadingGoogle = false
        }
    }
}
