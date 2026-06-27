import SwiftUI

/// Catch-all view for onboarding steps that don't yet have a dedicated UI.
struct GenericInfoStepView: View {
    let step: OnboardingStep
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private var title: String {
        switch step {
        case .welcome:          return "Willkommen bei Frigy!"
        case .goal:             return "Was ist dein Ziel?"
        case .motivation:       return "Was motiviert dich?"
        case .successStats:     return "Andere schaffen es — du auch!"
        case .tutorialTransition: return "So funktioniert Frigy"
        case .fridgeIntro:      return "Dein Kühlschrank"
        case .scanFeedback:     return "KI-Scan Feedback"
        case .howItWorks:       return "Wie es funktioniert"
        case .permissions:      return "Berechtigungen"
        case .notificationPrefs: return "Erinnerungen"
        case .weeklyPlan:       return "Dein Wochenplan"
        case .comparison:       return "Vergleich"
        case .transformation:   return "Deine Transformation"
        case .tutorial:         return "Kurzes Tutorial"
        case .trackerIntro:     return "Mahlzeiten tracken"
        case .bodyBasics:       return "Körperdaten"
        case .intro:            return "Einführung"
        case .weeklyPlanPreview: return "Dein Plan ist bereit"
        case .scanFridge:       return "Kühlschrank scannen"
        case .shoppingList:     return "Einkaufsliste"
        case .cookingTime:      return "Wie viel Zeit zum Kochen?"
        case .cookingExperience: return "Kochkenntnisse"
        case .planningSetup:    return "Planung einrichten"
        case .goalMode:         return "Ziel-Modus"
        case .goalSelection:    return "Zielauswahl"
        case .appModeChoice:    return "Modus wählen"
        case .spontanMode1, .spontanMode2: return "Spontan-Modus"
        case .structuredMode1, .structuredMode2, .structuredMode3: return "Strukturierter Modus"
        case .profileSetup:     return "Profil einrichten"
        case .premiumHint:      return "Frigy Premium"
        case .languageSelect:   return "Sprache wählen"
        default:                return step.rawValue.capitalized
        }
    }

    private var subtitle: String? {
        switch step {
        case .welcome:      return "Lass uns gemeinsam deine Ernährung verbessern."
        case .successStats: return "Tausende Nutzer haben bereits ihr Ziel erreicht."
        case .weeklyPlan, .weeklyPlanPreview: return "KI erstellt deinen personalisierten Wochenplan."
        case .scanFridge:   return "Scanne deinen Kühlschrank und wir schlagen Rezepte vor."
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
