import SwiftUI

/// Minimal onboarding shell — validates coordinator + router only (no step UI polish).
struct OnboardingSkeletonView: View {
    @Environment(AppRouter.self) private var router

    private var coordinator: OnboardingCoordinator { router.onboardingCoordinator }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Onboarding Coordinator")
                        .font(.title2.bold())

                    Group {
                        LabeledContent("Step", value: coordinator.currentStep.rawValue)
                        LabeledContent("Authenticated", value: coordinator.context.isAuthenticated ? "yes" : "no")
                        LabeledContent("Premium", value: coordinator.context.isPremium ? "yes" : "no")
                        LabeledContent("Referral", value: coordinator.context.hasReferralCode ? "yes" : "no")
                        LabeledContent("Completed", value: "\(coordinator.context.completedSteps.count)")
                        ProgressView(value: coordinator.progressFraction)
                        if let ref = coordinator.userProfile.referralCode {
                            LabeledContent("Code", value: ref)
                        }
                        if coordinator.userProfile.dailyCalories > 0 {
                            LabeledContent("Kcal", value: "\(coordinator.userProfile.dailyCalories)")
                        }
                    }
                    .font(.footnote.monospaced())

                    HStack {
                        Button("Back") { router.onboardingBack() }
                            .disabled(!coordinator.canGoBack)
                        Button("Next") { router.onboardingNext() }
                            .buttonStyle(.borderedProminent)
                            .disabled(!coordinator.canGoNext)
                    }

                    #if DEBUG
                    OnboardingFlowDebugView(snapshot: coordinator.flowDebugSnapshot())

                    OnboardingFlowTelemetryView(
                        traces: coordinator.recentTraces,
                        onExport: { coordinator.exportTelemetryJSON() }
                    )

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Flow validation").font(.headline)
                        Button("Simulate referral deep link") {
                            router.handle(deepLink: .signup(referralCode: "TESTREF"))
                        }
                        Button("Mark authenticated (dev)") {
                            coordinator.setAuthenticatedForDevelopment(true)
                        }
                        Button("Jump to paywall") {
                            coordinator.jump(to: .paywall)
                            router.rootRoute = .onboarding(step: .paywall)
                        }
                        Button("Reset onboarding (dev)") {
                            coordinator.resetForDevelopment()
                            router.rootRoute = .onboarding(step: coordinator.currentStep)
                        }
                    }
                    .buttonStyle(.bordered)
                    #endif
                }
                .padding()
            }
            .navigationTitle("Onboarding")
        }
    }
}

#if DEBUG
#Preview {
    OnboardingSkeletonView()
        .environment(AppRouter())
}
#endif
