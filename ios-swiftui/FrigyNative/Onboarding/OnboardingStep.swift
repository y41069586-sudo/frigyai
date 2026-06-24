import Foundation

/// Mirrors `OnboardingStep` in `src/components/onboarding/types.ts` (all known steps).
enum OnboardingStep: String, CaseIterable, Codable, Hashable, Identifiable {
    case splash
    case intro
    case languageSelect = "language-select"
    case nameInput = "name-input"
    case welcome
    case goal
    case motivation
    case successStats = "success-stats"
    case tutorialTransition = "tutorial-transition"
    case fridgeIntro = "fridge-intro"
    case scanFeedback = "scan-feedback"
    case howItWorks = "how-it-works"
    case permissions
    case notificationPrefs = "notification-prefs"
    case weeklyPlan = "weekly-plan"
    case comparison
    case transformation
    case tutorial
    case trackerIntro = "tracker-intro"
    case bodyBasics = "body-basics"
    case gender
    case birthdate
    case weight
    case height
    case activity
    case mainGoal = "main-goal"
    case goalPreview = "goal-preview"
    case goalMode = "goal-mode"
    case targetWeight = "target-weight"
    case speedSelect = "speed-select"
    case healthGoals = "health-goals"
    case dietaryPreferences = "dietary-preferences"
    case allergies
    case weeklyPlanPreview = "weekly-plan-preview"
    case scanFridge = "scan-fridge"
    case cameraPermission = "camera-permission"
    case shoppingList = "shopping-list"
    case referralCode = "referral-code"
    case cookingTime = "cooking-time"
    case cookingExperience = "cooking-experience"
    case planningSetup = "planning-setup"
    case analyzing
    case macroPreview = "macro-preview"
    // Native-only immersive "experience" screens woven through the flow.
    case holdExperience = "hold-experience"
    case energySwipe = "energy-swipe"
    case momentumReveal = "momentum-reveal"
    case appModeChoice = "app-mode-choice"
    case spontanMode1 = "spontan-mode-1"
    case spontanMode2 = "spontan-mode-2"
    case structuredMode1 = "structured-mode-1"
    case structuredMode2 = "structured-mode-2"
    case structuredMode3 = "structured-mode-3"
    case saveProgress = "save-progress"
    case accountCreation = "account-creation"
    case profileSetup = "profile-setup"
    case goalSelection = "goal-selection"
    case paywall
    case premiumHint = "premium-hint"
    case celebration
    case done

    var id: String { rawValue }
}

/// Production onboarding order from `onboardingSteps` in `types.ts`.
enum OnboardingFlow {
    /// Macro-level entry managed by `DefaultOnboardingRulesEngine`.
    static let macroEntryStep: OnboardingStep = .splash

    /// Body/profile data collection (entered from `.profileSetup`).
    static let detailedProfileSteps: [OnboardingStep] = [
        .gender,
        .birthdate,
        .weight,
        .height,
        .activity,
        .mainGoal,
        .targetWeight,
        .goalPreview,
        .speedSelect,
        .healthGoals,
        .dietaryPreferences,
        .allergies,
        .weeklyPlanPreview,
        .scanFridge,
        .cameraPermission,
        .shoppingList,
        .notificationPrefs,
        .referralCode,
        .analyzing,
        .macroPreview,
    ]

    /// Legacy full linear flow (splash-based) — kept for backwards-compatible persistence.
    static let activeSteps: [OnboardingStep] = [.splash] + detailedProfileSteps + [.saveProgress, .paywall]

    static func isDetailedProfileStep(_ step: OnboardingStep) -> Bool {
        detailedProfileSteps.contains(step)
    }

    static func index(of step: OnboardingStep) -> Int? {
        if let idx = detailedProfileSteps.firstIndex(of: step) { return idx }
        if step == .profileSetup { return 0 }
        if step == .goalSelection { return detailedProfileSteps.count }
        return activeSteps.firstIndex(of: step)
    }

    static func next(after step: OnboardingStep) -> OnboardingStep? {
        if let index = detailedProfileSteps.firstIndex(of: step), index + 1 < detailedProfileSteps.count {
            return detailedProfileSteps[index + 1]
        }
        if step == .macroPreview { return .accountCreation }
        guard let index = activeSteps.firstIndex(of: step), index + 1 < activeSteps.count else { return nil }
        return activeSteps[index + 1]
    }

    static func back(before step: OnboardingStep) -> OnboardingStep? {
        if let index = detailedProfileSteps.firstIndex(of: step), index > 0 {
            return detailedProfileSteps[index - 1]
        }
        if step == .accountCreation { return .macroPreview }
        guard let index = activeSteps.firstIndex(of: step), index > 0 else { return nil }
        return activeSteps[index - 1]
    }
}
