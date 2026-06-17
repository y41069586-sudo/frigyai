import SwiftUI

struct RootView: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        switch router.rootRoute {
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
    @Environment(AppRouter.self) private var router

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("Onboarding (SwiftUI)")
                    .font(.title2.bold())
                Text("OnboardingCoordinator lands in Phase 3.")
                    .foregroundStyle(.secondary)
                Button("Mark onboarding complete (dev)") {
                    router.completeOnboarding()
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .navigationTitle("Welcome")
        }
    }
}

struct AuthContainerView: View {
    var body: some View {
        NavigationStack {
            AuthSpikeView()
        }
    }
}
