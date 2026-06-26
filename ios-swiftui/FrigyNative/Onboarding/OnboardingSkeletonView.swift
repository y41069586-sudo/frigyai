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

// MARK: - Cinematic transition

private struct OnboardingInsertModifier: ViewModifier {
    let active: Bool
    let dir: CGFloat  // +1 forward, -1 back

    func body(content: Content) -> some View {
        content
            // Incoming: travels further (70pt) + floats up 10pt + mild blur.
            // The greater travel distance vs the outgoing screen's 28pt retreat
            // creates genuine parallax depth — it feels like a layer coming
            // forward from behind rather than a flat page flip.
            .offset(x: active ? 70 * dir : 0, y: active ? 10 : 0)
            .scaleEffect(active ? 0.93 : 1)
            .opacity(active ? 0 : 1)
            .blur(radius: active ? 4 : 0)
    }
}

private struct OnboardingRemoveModifier: ViewModifier {
    let active: Bool
    let dir: CGFloat

    func body(content: Content) -> some View {
        content
            // Outgoing: retreats only 28pt (parallax — it "falls behind" slowly),
            // scales down more, very gentle blur. This asymmetry is the key to
            // the depth illusion: the new card accelerates past the old one.
            .offset(x: active ? -28 * dir : 0, y: 0)
            .scaleEffect(active ? 0.96 : 1)
            .opacity(active ? 0 : 1)
            .blur(radius: active ? 2 : 0)
    }
}

private extension AnyTransition {
    /// Parallax cinematic transition: new screen travels further and from a
    /// vertical float, old screen recedes slowly — creates genuine z-depth.
    /// Consistent physics across every step change, both directions.
    static func onboardingSlide(forward: Bool) -> AnyTransition {
        let dir: CGFloat = forward ? 1 : -1
        return .asymmetric(
            insertion: .modifier(
                active: OnboardingInsertModifier(active: true,  dir: dir),
                identity: OnboardingInsertModifier(active: false, dir: dir)
            ),
            removal: .modifier(
                active: OnboardingRemoveModifier(active: true,  dir: dir),
                identity: OnboardingRemoveModifier(active: false, dir: dir)
            )
        )
    }
}

#if DEBUG
#Preview {
    OnboardingSkeletonView()
        .environment(AppRouter())
}
#endif
