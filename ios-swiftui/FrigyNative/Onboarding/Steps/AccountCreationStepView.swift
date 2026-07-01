import SwiftUI

struct AccountCreationStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(AppRouter.self) private var router
    @Environment(LanguageManager.self) private var lang

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

                    Text(lang.t("Fortschritt speichern"))
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(FrigyBrand.text)

                    Text(lang.t("Erstelle ein Konto, um deinen Plan\nauch auf anderen Geräten zu nutzen."))
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
                                Text(lang.t("Mit Apple fortfahren"))
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
                                Text(lang.t("Mit Google fortfahren"))
                                    .font(.system(size: 16, weight: .semibold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Color(UIColor.systemBackground))
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
                            Text(lang.t("Mit E-Mail fortfahren"))
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(Color(UIColor.systemBackground))
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
                    Text(lang.t("Überspringen"))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(FrigyBrand.textMuted)
                        .underline()
                }

                // Legal notice
                Text(lang.t("Mit der Registrierung stimmst du unseren\nNutzungsbedingungen und Datenschutzrichtlinien zu."))
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
    @Environment(LanguageManager.self) private var lang

    let onSuccess: () -> Void

    enum Mode { case signIn, signUp }
    enum SheetPhase { case form, checkInbox }

    @State private var mode: Mode = .signUp
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var phase: SheetPhase = .form

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty && password.count >= 6 && !isLoading
    }

    var body: some View {
        NavigationStack {
            Group {
                if phase == .checkInbox {
                    checkInboxView
                } else {
                    formView
                }
            }
            .navigationTitle(phase == .checkInbox ? "" : mode == .signIn ? lang.t("Anmelden") : lang.t("Konto erstellen"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(lang.t("Abbrechen")) { dismiss() }
                }
            }
        }
    }

    // MARK: - Form

    private var formView: some View {
        VStack(spacing: 24) {
            Picker("", selection: $mode) {
                Text(lang.t("Anmelden")).tag(Mode.signIn)
                Text(lang.t("Registrieren")).tag(Mode.signUp)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 24)
            .padding(.top, 8)
            .onChange(of: mode) { _, _ in errorMessage = nil }

            VStack(spacing: 12) {
                TextField(lang.t("E-Mail-Adresse"), text: $email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .padding()
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                SecureField(lang.t("Passwort (min. 6 Zeichen)"), text: $password)
                    .textContentType(mode == .signUp ? .newPassword : .password)
                    .padding()
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(.horizontal, 24)

            if let err = errorMessage {
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
                        Text(mode == .signIn ? lang.t("Anmelden") : lang.t("Konto erstellen"))
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
    }

    // MARK: - Check inbox

    private var checkInboxView: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 28) {
                // Icon
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.14))
                        .frame(width: 96, height: 96)
                    Image(systemName: "envelope.badge.fill")
                        .font(.system(size: 38, weight: .semibold))
                        .foregroundStyle(FrigyBrand.buttonGradient)
                }

                VStack(spacing: 8) {
                    Text(lang.t("E-Mail gesendet"))
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(FrigyBrand.text)

                    Text(lang.t("Wir haben eine Bestätigungs-E-Mail an %@ gesendet.\n\nTippe auf den Link darin — du wirst direkt zur App weitergeleitet.").replacingOccurrences(of: "%@", with: email))
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)
                        .padding(.horizontal, 24)
                }

                if let err = errorMessage {
                    Text(err)
                        .font(.system(size: 13))
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                VStack(spacing: 12) {
                    // Primary: check if already confirmed (user clicked link on another device)
                    Button {
                        checkSessionManually()
                    } label: {
                        Group {
                            if isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text(lang.t("Ich habe bestätigt"))
                                    .font(.system(size: 16, weight: .semibold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(FrigyBrand.buttonGradient)
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                    }
                    .disabled(isLoading)

                    // Secondary: resend email
                    Button {
                        resendEmail()
                    } label: {
                        Text(lang.t("E-Mail erneut senden"))
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(FrigyBrand.primaryDeep)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .disabled(isLoading)
                }
                .padding(.horizontal, 24)
            }

            Spacer()
        }
    }

    // MARK: - Actions

    private func submit() {
        isLoading = true
        errorMessage = nil
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
                phase = .checkInbox
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func checkSessionManually() {
        isLoading = true
        errorMessage = nil
        Task {
            // Try signing in — if the user confirmed, this succeeds.
            if let _ = try? await router.authService.signInWithEmail(email: email, password: password) {
                dismiss()
                onSuccess()
            } else {
                errorMessage = lang.t("Noch nicht bestätigt. Bitte tippe zuerst auf den Link in deiner E-Mail.")
            }
            isLoading = false
        }
    }

    private func resendEmail() {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                _ = try await router.authService.signUpWithEmail(email: email, password: password)
                // If it somehow succeeded (auto-confirm on), proceed.
                dismiss()
                onSuccess()
            } catch AuthServiceError.emailVerificationRequired {
                // Good — branded email was re-sent.
                errorMessage = nil
            } catch {
                errorMessage = "\(lang.t("Fehler beim erneuten Senden:")) \(lang.t(error.localizedDescription))"
            }
            isLoading = false
        }
    }
}
