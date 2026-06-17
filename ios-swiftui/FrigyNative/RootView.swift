import SwiftUI

struct RootView: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        switch router.rootRoute {
        case .loading:
            ProgressView("Loading...")
                .progressViewStyle(.circular)

        case .onboarding:
            OnboardingSkeletonView()

        case .auth:
            AuthContainerView()

        case .main:
            MainShellView()
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
