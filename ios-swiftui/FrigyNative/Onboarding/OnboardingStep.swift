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
    case themeChoice = "theme-choice"
    case done

    var id: String { rawValue }
}

/// Production onboarding order from `onboardingSteps` in `types.ts`.
enum OnboardingFlow {
    /// Macro-level entry managed by `DefaultOnboardingRulesEngine`.
    static let macroEntryStep: OnboardingStep = .splash

    /// The main onboarding sequence (entered from `.splash` / `.profileSetup`).
    ///
    /// Deliberate 4-phase structure (value-first onboarding):
    /// 1. **Hook** — show what Frigy DOES before asking for anything. Users decide
    ///    within seconds whether an app is worth their data; leading with the
    ///    feature showcases (previously buried at positions 13–16) earns the
    ///    right to ask the 12 personalization questions that follow.
    /// 2. **Personalization** — the body/goal questions, now framed by the value
    ///    the user just saw ("so the plan fits YOU").
    /// 3. **Permissions & referral** — system prompts sit late and in context,
    ///    right before the features that need them go live. Never up front:
    ///    context-free permission prompts get denied and cannot be re-asked.
    /// 4. **Payoff** — analyzing + plan reveal, then account/paywall (macro flow).
    static let detailedProfileSteps: [OnboardingStep] = [
        // ── Phase 1 · Hook: features first ──
        .weeklyPlan,        // KI-Wochenplan: hero + value rows ("Was erwartet dich bei Frigy?")
        .scanFridge,        // Zutaten-/Kühlschrank-Scan showcase (pure showcase, no permission)
        .shoppingList,      // automatische Einkaufsliste
        // ── Phase 2 · Personalization ──
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
        // ── Phase 3 · Permissions & referral, in context ──
        .cameraPermission,  // real screen again (request moved out of scanFridge)
        .notificationPrefs,
        .referralCode,
        // ── Phase 4 · Payoff ──
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
