import SwiftUI

struct AuthSpikeView: View {
    @Environment(AppRouter.self) private var router
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var bob = false
    @State private var isReturning = UserDefaults.standard.bool(forKey: AuthSpikeView.returningKey)

    static let returningKey = "frigy.hasSignedInBefore"

    var body: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            // Back to onboarding start — top left
            VStack {
                HStack {
                    OnboardingBackButton(action: { router.navigateToOnboardingStart() })
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                Spacer()
            }

            VStack(spacing: 0) {
                Spacer()

                // Logo + headline
                VStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(
                                colors: [Color(hex: "#EAFFF4"), Color(hex: "#D6FBE7")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 132, height: 132)
                        Image("FrigyMascot")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 104, height: 104)
                            .offset(y: bob ? -4 : 4)
                    }
                    .shadow(color: FrigyBrand.primaryDark.opacity(0.28), radius: 26, y: 12)

                    VStack(spacing: 8) {
                        Text(isReturning ? "Willkommen zurück bei Frigy" : "Willkommen bei Frigy")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundColor(FrigyBrand.text)
                            .multilineTextAlignment(.center)
                        Text("Dein KI-Ernährungscoach")
                            .font(.system(size: 15))
                            .foregroundColor(FrigyBrand.textMuted)
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
                        .background(Color(hex: "#1A2B22"))
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .shadow(color: Color(hex: "#1A2B22").opacity(0.3), radius: 12, y: 6)
                    }
                    .disabled(isLoading)

                    Button {
                        Task { await signInGoogle() }
                    } label: {
                        HStack(spacing: 12) {
                            Image("GoogleLogo")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 20, height: 20)
                            Text("Mit Google anmelden")
                                .font(.system(size: 17, weight: .semibold))
                        }
                        .foregroundColor(FrigyBrand.text)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color(UIColor.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(FrigyBrand.cardBorder, lineWidth: 1.5)
                        )
                        .shadow(color: .black.opacity(0.06), radius: 8, y: 4)
                    }
                    .disabled(isLoading)

                    if let message = router.authStatusMessage, !message.isEmpty {
                        Text(message)
                            .font(.system(size: 12))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.top, 4)
                    }

                    Text("Mit der Anmeldung stimmst du unserer Datenschutzerklärung\nund den Nutzungsbedingungen zu.")
                        .font(.system(size: 11))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .padding(.top, 4)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 48)
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
                bob = true
            }
        }
    }

    private func markSignedIn() {
        UserDefaults.standard.set(true, forKey: AuthSpikeView.returningKey)
        isReturning = true
    }

    private func signInApple() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            _ = try await router.authService.signInWithApple()
            markSignedIn()
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
            // signInWithGoogle only returns once the OAuth session is established
            // (continuation resumes after auth.session(from:)), so navigate now —
            // matching the Apple path. Previously the user was left on this screen.
            markSignedIn()
            router.rootRoute = .main
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
