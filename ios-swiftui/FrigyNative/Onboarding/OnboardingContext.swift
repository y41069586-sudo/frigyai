import Foundation

/// Draft profile collected during onboarding — maps to `UserData` in React.
struct UserProfileDraft: Codable, Equatable {
    var name: String = ""
    var referralCode: String?
    var heightCm: Double = 170
    var weightKg: Double = 70
    var age: Int = 25
    var gender: String?
    var goalMode: String = "lose"
    var targetWeightKg: Double = 65
    var weeklyGoalKg: Double = 0.5
    var activityLevel: String?
    var dietaryPreferences: [String] = []
    var healthGoals: [String] = []
    var allergies: [String] = []
    var dailyCalories: Int = 0
    var dailyProtein: Int = 0
    var dailyCarbs: Int = 0
    var dailyFat: Int = 0

    static let empty = UserProfileDraft()

    mutating func recalculateMacrosIfPossible() {
        guard age >= MacroCalculator.minOnboardingAge else { return }

        let parsedGender: MacroCalculator.Gender = switch gender {
        case "female": .female
        case "non-binary": .nonBinary
        default: .male
        }

        let activity: MacroCalculator.ActivityLevel = switch activityLevel {
        case "low": .low
        case "high": .high
        default: .medium
        }

        let mode: MacroCalculator.GoalMode = switch goalMode {
        case "maintain": .maintain
        case "gain": .gain
        default: .lose
        }

        let result = MacroCalculator.calculateMacros(
            MacroCalculator.Input(
                weightKg: weightKg,
                heightCm: heightCm,
                age: age,
                gender: parsedGender,
                activityLevel: activity,
                goalMode: mode,
                weeklyGoalKg: weeklyGoalKg,
                targetWeightKg: targetWeightKg
            )
        )

        dailyCalories = result.dailyCalories
        dailyProtein = result.dailyProtein
        dailyCarbs = result.dailyCarbs
        dailyFat = result.dailyFat
    }
}

/// External auth/subscription/referral signals (injected from AppRouter).
@MainActor
protocol OnboardingExternalGate {
    func isAuthenticated() async -> Bool
    func isPremium() async -> Bool
    func fetchReferral() -> String?
}

@MainActor
struct LiveOnboardingExternalGate: OnboardingExternalGate {
    let authService: AuthServiceProtocol
    let subscriptionService: SubscriptionServiceProtocol

    func isAuthenticated() async -> Bool {
        (try? await authService.currentSession()) != nil
    }

    func isPremium() async -> Bool {
        (try? await subscriptionService.refreshPremiumState()) ?? false
    }

    func fetchReferral() -> String? {
        let pending = UserDefaults.standard.string(forKey: "pendingReferralCode")
        return pending?.isEmpty == false ? pending : nil
    }
}

@MainActor
struct StaticOnboardingExternalGate: OnboardingExternalGate {
    var authenticated: Bool = false
    var premium: Bool = false
    var referral: String?

    func isAuthenticated() async -> Bool { authenticated }
    func isPremium() async -> Bool { premium }
    func fetchReferral() -> String? { referral }
}
