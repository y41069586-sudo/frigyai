import SwiftUI

/// Routes the current onboarding step to its dedicated screen view.
struct OnboardingSkeletonView: View {
    @Environment(AppRouter.self) private var router
    private var coordinator: OnboardingCoordinator { router.onboardingCoordinator }

    var body: some View {
        let step = coordinator.currentStep
        let progress = coordinator.progressFraction
        let canGoBack = coordinator.canGoBack

        Group {
            switch step {
            case .splash:
                SplashStepView(onNext: next)

            case .welcome:
                WelcomeStepView(onNext: next, onSignIn: { router.navigateToAuth() })

            case .goal, .motivation, .successStats, .tutorialTransition,
                 .fridgeIntro, .scanFeedback, .howItWorks, .tutorial, .trackerIntro,
                 .bodyBasics, .intro, .comparison, .transformation:
                GenericInfoStepView(
                    step: step,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .languageSelect:
                GenericInfoStepView(step: step, progress: progress, onBack: canGoBack ? back : nil, onNext: next)

            case .nameInput:
                NameInputStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .permissions, .notificationPrefs:
                PermissionsStepView(
                    step: step,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .gender:
                GenderStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .birthdate:
                BirthdateStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .weight:
                WeightStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .height:
                HeightStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .activity:
                ActivityStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .mainGoal:
                MainGoalStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .targetWeight:
                TargetWeightStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .goalPreview:
                GoalPreviewStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .speedSelect:
                SpeedSelectStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .healthGoals:
                HealthGoalsStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .dietaryPreferences:
                DietaryPreferencesStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .allergies:
                AllergiesStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .weeklyPlan:
                GenericInfoStepView(step: step, progress: progress, onBack: canGoBack ? back : nil, onNext: next)

            case .weeklyPlanPreview:
                WeeklyPlanPreviewStepView(
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .scanFridge:
                ScanFridgeStepView(
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .shoppingList:
                ShoppingListIntroStepView(
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .referralCode:
                ReferralCodeStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: { profile in
                        coordinator.userProfile = profile
                        coordinator.persistState()
                        next()
                    }
                )

            case .cookingTime, .cookingExperience, .planningSetup:
                GenericInfoStepView(step: step, progress: progress, onBack: canGoBack ? back : nil, onNext: next)

            case .analyzing:
                AnalyzingStepView(onNext: next)

            case .macroPreview:
                MacroPreviewStepView(
                    profile: coordinator.userProfile,
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .goalSelection:
                GoalSelectionStepView(
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .goalMode, .appModeChoice,
                 .spontanMode1, .spontanMode2,
                 .structuredMode1, .structuredMode2, .structuredMode3:
                GenericInfoStepView(step: step, progress: progress, onBack: canGoBack ? back : nil, onNext: next)

            case .saveProgress, .accountCreation:
                AccountCreationStepView(
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .profileSetup:
                ProfileSetupStepView(
                    progress: progress,
                    onBack: canGoBack ? back : nil,
                    onNext: next
                )

            case .premiumHint:
                GenericInfoStepView(step: step, progress: progress, onBack: canGoBack ? back : nil, onNext: next)

            case .paywall:
                PaywallStepView(onNext: next)

            case .celebration:
                CelebrationStepView(onNext: next)

            case .done:
                Color(hex: "#FBFFFD").ignoresSafeArea()
                    .onAppear { Task { await router.finishOnboardingFlow() } }
            }
        }
        .transition(.asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        ))
        .animation(.spring(duration: 0.35), value: step)
    }

    private func next() {
        router.onboardingNext()
    }

    private func back() {
        router.onboardingBack()
    }
}

#if DEBUG
#Preview {
    OnboardingSkeletonView()
        .environment(AppRouter())
}
#endif
