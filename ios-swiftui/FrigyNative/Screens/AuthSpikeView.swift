import SwiftUI

struct AuthSpikeView: View {
    @Environment(AppRouter.self) private var router
    @State private var isLoading = false
    @State private var sessionLabel = "No session"

    var body: some View {
        List {
            Section("Session") {
                Text(sessionLabel)
                    .font(.footnote.monospaced())
                Button("Restore Session") {
                    Task { await refreshSessionLabel() }
                }
            }

            Section("Sign In") {
                Button {
                    Task { await signInApple() }
                } label: {
                    Label("Sign in with Apple", systemImage: "apple.logo")
                }
                .disabled(isLoading)

                Button {
                    Task { await signInGoogle() }
                } label: {
                    Label("Sign in with Google", systemImage: "globe")
                }
                .disabled(isLoading)
            }

            if let message = router.authStatusMessage {
                Section("Status") {
                    Text(message).font(.footnote)
                }
            }

            Section("Deep Link Tests") {
                deepLinkButton("Open Profile", link: .home(.profile))
                deepLinkButton("Open Shopping Tab", link: .tab(.shopping))
                deepLinkButton("Open Tracker", link: .openTracker)
                deepLinkButton("Subscription Success", link: .subscriptionSuccess)
            }
        }
        .navigationTitle("Sign In")
        .task { await refreshSessionLabel() }
    }

    private func deepLinkButton(_ title: String, link: AppDeepLink) -> some View {
        Button(title) {
            router.handle(deepLink: link)
        }
    }

    private func refreshSessionLabel() async {
        isLoading = true
        defer { isLoading = false }
        do {
            if let session = try await router.authService.currentSession() {
                sessionLabel = "\(session.email) (\(session.userId))"
            } else {
                sessionLabel = "No session"
            }
        } catch {
            sessionLabel = "Error: \(error.localizedDescription)"
        }
    }

    private func signInApple() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let session = try await router.authService.signInWithApple()
            sessionLabel = "\(session.email) (\(session.userId))"
            router.rootRoute = .main
        } catch {
            router.authStatusMessage = error.localizedDescription
        }
    }

    private func signInGoogle() async {
        isLoading = true
        defer { isLoading = false }
        do {
            try await router.authService.signInWithGoogle()
            router.authStatusMessage = "Complete sign-in in browser; callback returns to frigy://callback"
        } catch {
            router.authStatusMessage = error.localizedDescription
        }
    }
}
