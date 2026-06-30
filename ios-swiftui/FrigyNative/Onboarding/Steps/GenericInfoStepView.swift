import SwiftUI

/// Catch-all view for onboarding steps that don't yet have a dedicated UI.
struct GenericInfoStepView: View {
    let step: OnboardingStep
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(LanguageManager.self) private var lang

    private var title: String {
        switch step {
        case .welcome:          return lang.t("Willkommen bei Frigy!")
        case .goal:             return lang.t("Was ist dein Ziel?")
        case .motivation:       return lang.t("Was motiviert dich?")
        case .successStats:     return lang.t("Andere schaffen es — du auch!")
        case .tutorialTransition: return lang.t("So funktioniert Frigy")
        case .fridgeIntro:      return lang.t("Dein Kühlschrank")
        case .scanFeedback:     return lang.t("KI-Scan Feedback")
        case .howItWorks:       return lang.t("Wie es funktioniert")
        case .permissions:      return lang.t("Berechtigungen")
        case .notificationPrefs: return lang.t("Erinnerungen")
        case .weeklyPlan:       return lang.t("Dein Wochenplan")
        case .comparison:       return lang.t("Vergleich")
        case .transformation:   return lang.t("Deine Transformation")
        case .tutorial:         return lang.t("Kurzes Tutorial")
        case .trackerIntro:     return lang.t("Mahlzeiten tracken")
        case .bodyBasics:       return lang.t("Körperdaten")
        case .intro:            return lang.t("Einführung")
        case .weeklyPlanPreview: return lang.t("Dein Plan ist bereit")
        case .scanFridge:       return lang.t("Kühlschrank scannen")
        case .shoppingList:     return lang.t("Einkaufsliste")
        case .cookingTime:      return lang.t("Wie viel Zeit zum Kochen?")
        case .cookingExperience: return lang.t("Kochkenntnisse")
        case .planningSetup:    return lang.t("Planung einrichten")
        case .goalMode:         return lang.t("Ziel-Modus")
        case .goalSelection:    return lang.t("Zielauswahl")
        case .appModeChoice:    return lang.t("Modus wählen")
        case .spontanMode1, .spontanMode2: return lang.t("Spontan-Modus")
        case .structuredMode1, .structuredMode2, .structuredMode3: return lang.t("Strukturierter Modus")
        case .profileSetup:     return lang.t("Profil einrichten")
        case .premiumHint:      return lang.t("Frigy Premium")
        case .languageSelect:   return lang.t("Sprache wählen")
        default:                return step.rawValue.capitalized
        }
    }

    private var subtitle: String? {
        switch step {
        case .welcome:      return lang.t("Lass uns gemeinsam deine Ernährung verbessern.")
        case .successStats: return lang.t("Tausende Nutzer haben bereits ihr Ziel erreicht.")
        case .weeklyPlan, .weeklyPlanPreview: return lang.t("KI erstellt deinen personalisierten Wochenplan.")
        case .scanFridge:   return lang.t("Scanne deinen Kühlschrank und wir schlagen Rezepte vor.")
        default:            return nil
        }
    }

    private var iconName: String {
        switch step {
        case .welcome:          return "hand.wave.fill"
        case .goal:             return "target"
        case .motivation:       return "heart.fill"
        case .successStats:     return "chart.line.uptrend.xyaxis"
        case .howItWorks:       return "questionmark.circle.fill"
        case .weeklyPlan, .weeklyPlanPreview: return "calendar"
        case .scanFridge:       return "camera.viewfinder"
        case .shoppingList:     return "cart.fill"
        case .notificationPrefs: return "bell.fill"
        case .permissions:      return "lock.open.fill"
        default:                return "sparkles"
        }
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.primary.opacity(0.15))
                        .frame(width: 80, height: 80)
                    Image(systemName: iconName)
                        .font(.system(size: 30, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }

                VStack(spacing: 10) {
                    Text(title)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)

                    if let subtitle {
                        Text(subtitle)
                            .font(.system(size: 16))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 28)
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
