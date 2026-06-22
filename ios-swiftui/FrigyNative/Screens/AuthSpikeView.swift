import SwiftUI

struct AuthSpikeView: View {
    @Environment(AppRouter.self) private var router
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#EDFFF6"), Color(hex: "#FBFFFD")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo + headline
                VStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(
                                colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 96, height: 96)
                        Image(systemName: "leaf.fill")
                            .font(.system(size: 46, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .shadow(color: Color(hex: "#39D47F").opacity(0.30), radius: 24, y: 10)

                    VStack(spacing: 8) {
                        Text("Willkommen bei Frigy")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text("Dein KI-Ernährungscoach")
                            .font(.system(size: 15))
                            .foregroundColor(Color(hex: "#6B7280"))
                    }
                }

                Spacer()

                // Error
                if let errorMessage {
                    Text(errorMessage)
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#EF4444"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .padding(.bottom, 16)
                }

                // Sign-in buttons
                VStack(spacing: 12) {
                    Button {
                        Task { await signInApple() }
                    } label: {
                        HStack(spacing: 12) {
                            if isLoading {
                                ProgressView().tint(.white).frame(width: 20, height: 20)
                            } else {
                                Image(systemName: "apple.logo")
                                    .font(.system(size: 19, weight: .semibold))
                                Text("Mit Apple anmelden")
                                    .font(.system(size: 17, weight: .semibold))
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color(hex: "#1F2937"))
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .shadow(color: Color(hex: "#1F2937").opacity(0.18), radius: 12, y: 6)
                    }
                    .disabled(isLoading)

                    Button {
                        Task { await signInGoogle() }
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "globe")
                                .font(.system(size: 19, weight: .semibold))
                            Text("Mit Google anmelden")
                                .font(.system(size: 17, weight: .semibold))
                        }
                        .foregroundColor(Color(hex: "#374151"))
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(Color(hex: "#E5E7EB"), lineWidth: 1.5)
                        )
                        .shadow(color: .black.opacity(0.06), radius: 8, y: 4)
                    }
                    .disabled(isLoading)

                    if let message = router.authStatusMessage, !message.isEmpty {
                        Text(message)
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#9CA3AF"))
                            .multilineTextAlignment(.center)
                            .padding(.top, 4)
                    }

                    Text("Mit der Anmeldung stimmst du unserer Datenschutzerklärung\nund den Nutzungsbedingungen zu.")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                        .multilineTextAlignment(.center)
                        .padding(.top, 4)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 48)
            }
        }
        .navigationBarHidden(true)
    }

    private func signInApple() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            _ = try await router.authService.signInWithApple()
            router.rootRoute = .main
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func signInGoogle() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await router.authService.signInWithGoogle()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
