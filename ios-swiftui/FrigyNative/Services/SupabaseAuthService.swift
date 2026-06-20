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
}

@MainActor
protocol SubscriptionServiceProtocol {
    func refreshPremiumState() async throws -> Bool
    func restorePurchases() async throws -> Bool
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
}

@MainActor
final class MockSubscriptionService: SubscriptionServiceProtocol {
    func refreshPremiumState() async throws -> Bool { false }
    func restorePurchases() async throws -> Bool { false }
}

#if canImport(Supabase)
import Supabase
import AuthenticationServices
import CryptoKit
import UIKit

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
        _ = try await client.auth.session
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
        let redirect = SupabaseConfig.oauthRedirectURL
        let url = try client.auth.getOAuthSignInURL(
            provider: .google,
            redirectTo: redirect
        )
        try await startWebAuthenticationSession(url: url)
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

    var errorDescription: String? {
        switch self {
        case .missingAppleIdentityToken: "Apple identity token missing."
        case .oauthCancelled: "Sign in was cancelled."
        case .oauthStartFailed: "Could not start OAuth browser session."
        }
    }
}

@MainActor
private enum AuthPresentationAnchor {
    static func current() -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow) {
            return window
        }
        if let window = scenes.first?.windows.first {
            return window
        }
        if let scene = scenes.first {
            return ASPresentationAnchor(windowScene: scene)
        }
        fatalError("No UIWindowScene available for auth presentation.")
    }
}

private final class AppleSignInDelegate: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private nonisolated(unsafe) let completion: @Sendable (Result<ASAuthorizationAppleIDCredential, Error>) -> Void

    nonisolated init(completion: @escaping @Sendable (Result<ASAuthorizationAppleIDCredential, Error>) -> Void) {
        self.completion = completion
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            completion(.failure(AuthServiceError.missingAppleIdentityToken))
            return
        }
        completion(.success(credential))
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        completion(.failure(error))
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
}

#endif
