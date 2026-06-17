import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        switch appState.route {
        case .loading:
            ProgressView("Loading...")
                .progressViewStyle(.circular)

        case .onboarding:
            OnboardingContainerView()

        case .auth:
            AuthContainerView()

        case .main:
            MainShellView()
        }
    }
}

struct OnboardingContainerView: View {
    var body: some View {
        NavigationStack {
            Text("Onboarding (SwiftUI)")
                .navigationTitle("Welcome")
        }
    }
}

struct AuthContainerView: View {
    var body: some View {
        NavigationStack {
            Text("Auth (SwiftUI)")
                .navigationTitle("Sign In")
        }
    }
}
