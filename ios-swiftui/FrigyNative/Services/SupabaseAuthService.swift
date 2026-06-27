import Foundation

struct UserSession: Equatable {
    let userId: String
    let email: String
}

struct AuthCallbackResult {
    let success: Bool
    let message: String
}

@MainActor
protocol AuthServiceProtocol {
    func restoreSession() async throws -> UserSession?
    func currentSession() async throws -> UserSession?
    func signInWithApple() async throws -> UserSession
    func signInWithGoogle() async throws
    func signOut() async throws
    func handleOAuthCallback(url: URL) async -> AuthCallbackResult?
    func signInWithEmail(email: String, password: String) async throws -> UserSession
    func signUpWithEmail(email: String, password: String) async throws -> UserSession
}

/// A purchasable subscription option with a store-localized price string.
struct SubscriptionPackage: Identifiable, Equatable {
    let id: String                      // RevenueCat package identifier
    let title: String                   // e.g. "Monatlich" / "Jährlich"
    let priceString: String             // store-localized total, e.g. "4,99 €"
    let pricePerMonthString: String?    // store-localized monthly breakdown, e.g. "3,33 €" for yearly
    let period: String                  // "Monat" / "Jahr"
    let isYearly: Bool
}

@MainActor
protocol SubscriptionServiceProtocol {
    func refreshPremiumState() async throws -> Bool
    func restorePurchases() async throws -> Bool
    /// Store-localized monthly/yearly packages (empty when billing isn't configured).
    func availablePackages() async -> [SubscriptionPackage]
    /// Purchase a package; returns true when the premium entitlement is active afterwards.
    func purchase(_ package: SubscriptionPackage) async throws -> Bool
    /// Link the current store identity to the given Supabase user ID. This MUST run
    /// before any purchase so the entitlement is attached to the Supabase user (not an
    /// anonymous store ID); otherwise the server, which looks up RevenueCat by Supabase
    /// user ID, will never see the purchase and premium features stay locked.
    func identify(userId: String) async
    /// Detach the current store identity (called on sign-out).
    func clearIdentity() async
    /// Opens the App Store's native "Offer Code einlösen" sheet (iOS 14+).
    func redeemOfferCode()
}

extension SubscriptionServiceProtocol {
    func identify(userId: String) async {}
    func clearIdentity() async {}
    func redeemOfferCode() {}
}

@MainActor
final class MockAuthService: AuthServiceProtocol {
    func restoreSession() async throws -> UserSession? { nil }
    func currentSession() async throws -> UserSession? { nil }
    func signInWithApple() async throws -> UserSession {
        UserSession(userId: "mock", email: "mock@frigy.app")
    }
    func signInWithGoogle() async throws {}
    func signOut() async throws {}
    func handleOAuthCallback(url: URL) async -> AuthCallbackResult? { nil }
    func signInWithEmail(email: String, password: String) async throws -> UserSession {
        UserSession(userId: "mock", email: email)
    }
    func signUpWithEmail(email: String, password: String) async throws -> UserSession {
        UserSession(userId: "mock", email: email)
    }
}

@MainActor
final class MockSubscriptionService: SubscriptionServiceProtocol {
    func refreshPremiumState() async throws -> Bool { false }
    func restorePurchases() async throws -> Bool { false }
    func availablePackages() async -> [SubscriptionPackage] {
        // Fallback prices shown only when RevenueCat isn't configured (e.g. simulator).
        [
            SubscriptionPackage(id: "monthly", title: "Monatlich", priceString: "4,99 €", pricePerMonthString: nil, period: "Monat", isYearly: false),
            SubscriptionPackage(id: "yearly", title: "Jährlich", priceString: "39,99 €", pricePerMonthString: "3,33 €", period: "Jahr", isYearly: true),
        ]
    }
    func purchase(_ package: SubscriptionPackage) async throws -> Bool { false }
}

#if canImport(Supabase)
import Supabase
import AuthenticationServices
import CryptoKit
import UIKit
import GoogleSignIn

@MainActor
final class SupabaseAuthService: AuthServiceProtocol {
    static let shared = SupabaseAuthService()

    private(set) var client: SupabaseClient
    private var currentNonce: String?
    private var webAuthSession: ASWebAuthenticationSession?
    private var appleSignInDelegate: AppleSignInDelegate?

    private init() {
        guard let url = SupabaseConfig.url, let anonKey = SupabaseConfig.anonKey else {
            fatalError("SupabaseAuthService requires valid SUPABASE_URL and SUPABASE_ANON_KEY")
        }
        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: anonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    redirectToURL: SupabaseConfig.oauthRedirectURL,
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }

    func restoreSession() async throws -> UserSession? {
        // Do NOT force-propagate the error from `client.auth.session`: the Supabase
        // SDK throws `sessionMissing` whenever there is no stored session (i.e. every
        // fresh install / logged-out launch). `currentSession()` already swallows that
        // case via `try?` and returns nil, so a new user proceeds into onboarding
        // instead of being wrongly bounced straight to the auth screen.
        return try await currentSession()
    }

    func currentSession() async throws -> UserSession? {
        let session = try? await client.auth.session
        guard let session else { return nil }
        return UserSession(
            userId: session.user.id.uuidString,
            email: session.user.email ?? ""
        )
    }

    func signInWithApple() async throws -> UserSession {
        let nonce = randomNonceString()
        currentNonce = nonce

        let appleIDCredential = try await performAppleSignIn(nonce: sha256(nonce))
        guard let tokenData = appleIDCredential.identityToken,
              let identityToken = String(data: tokenData, encoding: .utf8) else {
            throw AuthServiceError.missingAppleIdentityToken
        }

        let session = try await client.auth.signInWithIdToken(
            credentials: OpenIDConnectCredentials(
                provider: .apple,
                idToken: identityToken,
                nonce: nonce
            )
        )

        return UserSession(
            userId: session.user.id.uuidString,
            email: session.user.email ?? ""
        )
    }

    func signInWithGoogle() async throws {
        let clientID = "153158265512-8ookf1g41bc74527pqh66ufga6uatrlm.apps.googleusercontent.com"
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)

        let rootVC = AuthPresentationAnchor.current().rootViewController
            ?? UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }?
                .rootViewController
        guard let rootVC else { throw AuthServiceError.oauthStartFailed }

        // Nonce handshake: Google embeds the SHA256-hashed nonce in the id_token,
        // Supabase re-hashes the raw nonce we pass and compares. Both sides must
        // either supply a nonce or neither — otherwise Supabase rejects the token
        // with "passed nonce and nonce in id_token should either both exist or not".
        let rawNonce = randomNonceString()
        let hashedNonce = sha256(rawNonce)

        let result = try await GIDSignIn.sharedInstance.signIn(
            withPresenting: rootVC,
            hint: nil,
            additionalScopes: nil,
            nonce: hashedNonce
        )
        guard let idToken = result.user.idToken?.tokenString else {
            throw AuthServiceError.missingAppleIdentityToken
        }
        let accessToken = result.user.accessToken.tokenString

        _ = try await client.auth.signInWithIdToken(
            credentials: OpenIDConnectCredentials(
                provider: .google,
                idToken: idToken,
                accessToken: accessToken,
                nonce: rawNonce
            )
        )
    }

    func signInWithEmail(email: String, password: String) async throws -> UserSession {
        let session = try await client.auth.signIn(email: email, password: password)
        return UserSession(userId: session.user.id.uuidString, email: session.user.email ?? "")
    }

    func signUpWithEmail(email: String, password: String) async throws -> UserSession {
        // Create the account + send a single Frigy-branded confirmation email via
        // our edge function (which uses Resend). We deliberately do NOT call
        // client.auth.signUp here: it would create the user AND fire Supabase's own
        // plain email, after which the function's admin.generateLink("signup") fails
        // with "user already registered" and the branded email is never sent.
        // Routing creation through the function keeps it atomic and avoids the
        // duplicate / silently-dropped email.
        let result = await sendBrandedConfirmationEmail(email: email, password: password)
        guard result.ok else {
            // Surface the REAL reason on-screen (no Mac/device-log access needed).
            throw AuthServiceError.emailSendFailed(result.detail)
        }
        // Account exists but the email must still be confirmed via the link.
        throw AuthServiceError.emailVerificationRequired
    }

    /// Calls the send-email-confirmation edge function. Returns ok=true when the
    /// function reports the email was sent (HTTP 200). On failure, `detail` carries
    /// the real reason so it can be shown on-screen (no Mac/device logs required).
    private func sendBrandedConfirmationEmail(email: String, password: String) async -> (ok: Bool, detail: String) {
        guard SupabaseConfig.isConfigured else {
            return (false, "App-Konfiguration fehlt (SUPABASE_URL/ANON_KEY). Neuer Build nötig.")
        }
        guard let base = SupabaseConfig.urlString else {
            return (false, "SUPABASE_URL ist leer.")
        }
        guard let anonKey = SupabaseConfig.anonKey else {
            return (false, "SUPABASE_ANON_KEY ist leer.")
        }
        guard let url = URL(string: "\(base)/functions/v1/send-email-confirmation") else {
            return (false, "Ungültige Function-URL.")
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.timeoutInterval = 20
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["email": email, "password": password])
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else {
                return (false, "Keine gültige HTTP-Antwort.")
            }
            if http.statusCode == 200 { return (true, "") }
            let bodyStr = String(data: data, encoding: .utf8) ?? "(leer)"
            return (false, "HTTP \(http.statusCode): \(bodyStr)")
        } catch {
            return (false, "Netzwerkfehler: \(error.localizedDescription)")
        }
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func handleOAuthCallback(url: URL) async -> AuthCallbackResult? {
        guard isOAuthCallbackURL(url) else { return nil }

        do {
            _ = try await client.auth.session(from: url)
            return AuthCallbackResult(success: true, message: "OAuth session restored")
        } catch {
            return AuthCallbackResult(success: false, message: error.localizedDescription)
        }
    }

    // MARK: - Private

    private func isOAuthCallbackURL(_ url: URL) -> Bool {
        url.scheme?.lowercased() == SupabaseConfig.oauthRedirectScheme
            && url.host?.lowercased() == SupabaseConfig.oauthCallbackHost
    }

    private func startWebAuthenticationSession(url: URL) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: SupabaseConfig.oauthRedirectScheme
            ) { callbackURL, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let callbackURL else {
                    continuation.resume(throwing: AuthServiceError.oauthCancelled)
                    return
                }
                Task { @MainActor in
                    do {
                        _ = try await self.client.auth.session(from: callbackURL)
                        continuation.resume()
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }

            Task { @MainActor in
                session.presentationContextProvider = WebAuthContextProvider.shared
                session.prefersEphemeralWebBrowserSession = false
                self.webAuthSession = session
                if !session.start() {
                    continuation.resume(throwing: AuthServiceError.oauthStartFailed)
                }
            }
        }
    }

    private func performAppleSignIn(nonce: String) async throws -> ASAuthorizationAppleIDCredential {
        try await withCheckedThrowingContinuation { continuation in
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.email, .fullName]
            request.nonce = nonce

            let controller = ASAuthorizationController(authorizationRequests: [request])
            let delegate = AppleSignInDelegate { result in
                continuation.resume(with: result)
            }
            Task { @MainActor in
                self.appleSignInDelegate = delegate
                controller.delegate = delegate
                controller.presentationContextProvider = delegate
                controller.performRequests()
            }
        }
    }

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length

        while remaining > 0 {
            var random: UInt8 = 0
            let status = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
            if status != errSecSuccess { continue }
            if random < charset.count {
                result.append(charset[Int(random)])
                remaining -= 1
            }
        }
        return result
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashed = SHA256.hash(data: inputData)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }
}

enum AuthServiceError: LocalizedError {
    case missingAppleIdentityToken
    case oauthCancelled
    case oauthStartFailed
    case emailVerificationRequired
    case emailSendFailed(String)

    var errorDescription: String? {
        switch self {
        case .missingAppleIdentityToken: "Apple identity token missing."
        case .oauthCancelled: "Sign in was cancelled."
        case .oauthStartFailed: "Could not start OAuth browser session."
        case .emailVerificationRequired: "Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte klicke den Link darin."
        case .emailSendFailed(let detail): "E-Mail konnte nicht gesendet werden — \(detail)"
        }
    }
}

@MainActor
private enum AuthPresentationAnchor {
    static func current() -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let window = scenes.first(where: { $0.activationState == .foregroundActive })?.keyWindow {
            return window
        }
        if let window = scenes.first?.keyWindow {
            return window
        }
        if let scene = scenes.first {
            return ASPresentationAnchor(windowScene: scene)
        }
        fatalError("No UIWindowScene available for auth presentation.")
    }
}

private final class AppleSignInDelegate: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private let completion: (Result<ASAuthorizationAppleIDCredential, Error>) -> Void

    init(completion: @escaping (Result<ASAuthorizationAppleIDCredential, Error>) -> Void) {
        self.completion = completion
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            invokeCompletion(.failure(AuthServiceError.missingAppleIdentityToken))
            return
        }
        invokeCompletion(.success(credential))
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        invokeCompletion(.failure(error))
    }

    // ASAuthorizationController delivers delegate callbacks on the main queue, but these
    // methods are `nonisolated`. Hop onto the main actor before touching the
    // @MainActor-isolated `completion` so the project compiles under Swift 6.
    private nonisolated func invokeCompletion(
        _ result: Result<ASAuthorizationAppleIDCredential, Error>
    ) {
        if Thread.isMainThread {
            MainActor.assumeIsolated { completion(result) }
        } else {
            DispatchQueue.main.sync {
                MainActor.assumeIsolated { completion(result) }
            }
        }
    }

    nonisolated func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if Thread.isMainThread {
            return MainActor.assumeIsolated { AuthPresentationAnchor.current() }
        }
        return DispatchQueue.main.sync {
            MainActor.assumeIsolated { AuthPresentationAnchor.current() }
        }
    }
}

private final class WebAuthContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = WebAuthContextProvider()

    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        if Thread.isMainThread {
            return MainActor.assumeIsolated { AuthPresentationAnchor.current() }
        }
        return DispatchQueue.main.sync {
            MainActor.assumeIsolated { AuthPresentationAnchor.current() }
        }
    }
}

#else

@MainActor
final class SupabaseAuthService: AuthServiceProtocol {
    static let shared = SupabaseAuthService()
    private init() {}

    func restoreSession() async throws -> UserSession? { nil }
    func currentSession() async throws -> UserSession? { nil }
    func signInWithApple() async throws -> UserSession {
        throw AuthServiceError.oauthStartFailed
    }
    func signInWithGoogle() async throws { throw AuthServiceError.oauthStartFailed }
    func signOut() async throws {}
    func handleOAuthCallback(url: URL) async -> AuthCallbackResult? { nil }
    func signInWithEmail(email: String, password: String) async throws -> UserSession { throw AuthServiceError.oauthStartFailed }
    func signUpWithEmail(email: String, password: String) async throws -> UserSession { throw AuthServiceError.oauthStartFailed }
}

#endif
