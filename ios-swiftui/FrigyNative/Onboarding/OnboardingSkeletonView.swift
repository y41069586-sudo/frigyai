import SwiftUI

/// Routes the current onboarding step to its dedicated screen view.
struct OnboardingSkeletonView: View {
    @Environment(AppRouter.self) private var router
    private var coordinator: OnboardingCoordinator { router.onboardingCoordinator }

    var body: some View {
        let step = coordinator.currentStep
        let goingForward = coordinator.transitionDirection == .forward

        ZStack {
            stepContent(
                step: step,
                progress: coordinator.progressFraction,
                canGoBack: coordinator.canGoBack
            )
            .id(step)
            .transition(.onboardingSlide(forward: goingForward))
        }
        .animation(.spring(response: 0.46, dampingFraction: 0.88), value: step)
    }

    // MARK: - Step routing

    @ViewBuilder
    private func stepContent(step: OnboardingStep, progress: Double, canGoBack: Bool) -> some View {
        switch step {
        case .splash:
            SplashStepView(onNext: next, onSignIn: { router.navigateToAuth() })

        case .welcome:
            WelcomeStepView(onNext: next, onSignIn: { router.navigateToAuth() })

        case .goal:
            GoalStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .motivation:
            MotivationStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .successStats:
            SuccessStatsStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .tutorialTransition:
            TutorialTransitionStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .fridgeIntro:
            FridgeIntroStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .scanFeedback:
            ScanFeedbackStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .howItWorks:
            HowItWorksStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .tutorial:
            TutorialStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .trackerIntro:
            TrackerIntroStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .bodyBasics:
            BodyBasicsStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .intro:
            IntroStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .comparison:
            ComparisonStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .transformation:
            TransformationStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .languageSelect:
            LanguageSelectStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

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
            WeeklyPlanStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

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

        case .cameraPermission:
            // Permission is now requested inline in ScanFridgeStepView — auto-advance.
            Color.clear
                .onAppear { next() }

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

        case .cookingTime:
            CookingTimeStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .cookingExperience:
            CookingExperienceStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .planningSetup:
            PlanningSetupStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .analyzing:
            AnalyzingStepView(onNext: next)

        case .macroPreview:
            MacroPreviewStepView(
                profile: coordinator.userProfile,
                progress: progress,
                onBack: canGoBack ? back : nil,
                onNext: { edited in
                    coordinator.userProfile = edited
                    coordinator.persistState()
                    next()
                }
            )

        case .holdExperience:
            HoldToContinueStepView(onBack: canGoBack ? back : nil, onNext: next)

        case .energySwipe:
            EnergySwipeStepView(onBack: canGoBack ? back : nil, onNext: next)

        case .momentumReveal:
            MomentumRevealStepView(onBack: canGoBack ? back : nil, onNext: next)

        case .goalSelection:
            GoalSelectionStepView(
                progress: progress,
                onBack: canGoBack ? back : nil,
                onNext: next
            )

        case .goalMode:
            GoalModeStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .appModeChoice:
            AppModeChoiceStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .spontanMode1, .spontanMode2:
            SpontanModeStepView(step: step, progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .structuredMode1, .structuredMode2, .structuredMode3:
            StructuredModeStepView(step: step, progress: progress, onBack: canGoBack ? back : nil, onNext: next)

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
            PremiumHintStepView(progress: progress, onBack: canGoBack ? back : nil, onNext: next)

        case .paywall:
            PaywallStepView(onBack: canGoBack ? back : nil, onNext: next)

        case .celebration:
            CelebrationStepView(onNext: next)

        case .themeChoice:
            ThemeChoiceView(onContinue: next)

        case .done:
            Color(hex: "#FBFFFD").ignoresSafeArea()
                .onAppear { Task { await router.finishOnboardingFlow() } }
        }
    }

    private func next() {
        router.onboardingNext()
    }

    private func back() {
        router.onboardingBack()
    }
}

// MARK: - Transition

private extension AnyTransition {
    static func onboardingSlide(forward: Bool) -> AnyTransition {
        let insertEdge: Edge = forward ? .trailing : .leading
        let removeEdge: Edge  = forward ? .leading  : .trailing
        return .asymmetric(
            insertion: .move(edge: insertEdge).combined(with: .scale(scale: 0.93)),
            removal: .move(edge: removeEdge).combined(with: .scale(scale: 0.97))
        )
    }
}

#if DEBUG
#Preview {
    OnboardingSkeletonView()
        .environment(AppRouter())
}
#endif
