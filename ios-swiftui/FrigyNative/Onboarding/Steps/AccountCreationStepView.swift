import SwiftUI

struct AccountCreationStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(AppRouter.self) private var router

    @State private var isLoadingApple = false
    @State private var isLoadingGoogle = false
    @State private var showEmailSheet = false
    @State private var errorMessage: String?

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack, showProgress: false) {
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
                                Image("GoogleLogo")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 20, height: 20)
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

                    // Email
                    Button {
                        showEmailSheet = true
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "envelope.fill")
                                .font(.system(size: 16, weight: .semibold))
                            Text("Mit E-Mail fortfahren")
                                .font(.system(size: 16, weight: .semibold))
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
        .sheet(isPresented: $showEmailSheet) {
            EmailAuthSheet {
                router.onboardingCoordinator.didAuthenticate()
                onNext()
            }
            .environment(router)
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

// MARK: - Email auth sheet

private struct EmailAuthSheet: View {
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss

    let onSuccess: () -> Void

    enum Mode { case signIn, signUp }

    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showVerificationNote = false

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty && password.count >= 6 && !isLoading
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Picker("", selection: $mode) {
                    Text("Anmelden").tag(Mode.signIn)
                    Text("Registrieren").tag(Mode.signUp)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 24)
                .padding(.top, 8)
                .onChange(of: mode) { _, _ in
                    errorMessage = nil
                    showVerificationNote = false
                }

                VStack(spacing: 12) {
                    TextField("E-Mail-Adresse", text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 14))

                    SecureField("Passwort (min. 6 Zeichen)", text: $password)
                        .textContentType(mode == .signUp ? .newPassword : .password)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 24)

                if showVerificationNote {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "envelope.badge.fill")
                            .foregroundColor(FrigyBrand.primaryDark)
                        Text("Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte klicke den Link darin und melde dich dann an.")
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    .padding(14)
                    .background(FrigyBrand.primary.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 24)
                } else if let err = errorMessage {
                    Text(err)
                        .font(.system(size: 13))
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                Button {
                    submit()
                } label: {
                    Group {
                        if isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text(mode == .signIn ? "Anmelden" : "Konto erstellen")
                                .font(.system(size: 16, weight: .semibold))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(canSubmit ? FrigyBrand.primaryDark : FrigyBrand.primaryDark.opacity(0.4))
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                }
                .disabled(!canSubmit)
                .padding(.horizontal, 24)

                Spacer()
            }
            .navigationTitle(mode == .signIn ? "Anmelden" : "Konto erstellen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }

    private func submit() {
        isLoading = true
        errorMessage = nil
        showVerificationNote = false
        let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
        Task {
            do {
                if mode == .signIn {
                    _ = try await router.authService.signInWithEmail(email: trimmedEmail, password: password)
                } else {
                    _ = try await router.authService.signUpWithEmail(email: trimmedEmail, password: password)
                }
                dismiss()
                onSuccess()
            } catch AuthServiceError.emailVerificationRequired {
                showVerificationNote = true
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
