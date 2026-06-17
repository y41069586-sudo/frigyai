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

/// Runtime flags that drive the rules engine.
struct OnboardingContext: Codable, Equatable {
    var hasAccount: Bool
    var isAuthenticated: Bool
    var hasReferralCode: Bool
    var isPremium: Bool
    var completedSteps: Set<OnboardingStep>
    var userProfile: UserProfileDraft?

    static let initial = OnboardingContext(
        hasAccount: false,
        isAuthenticated: false,
        hasReferralCode: false,
        isPremium: false,
        completedSteps: [],
        userProfile: .empty
    )

    mutating func syncReferralFlag() {
        hasReferralCode = !(userProfile?.referralCode?.isEmpty ?? true)
    }
}

// MARK: - Codable for Set<OnboardingStep>

extension OnboardingContext {
    private enum CodingKeys: String, CodingKey {
        case hasAccount
        case isAuthenticated
        case hasReferralCode
        case isPremium
        case completedSteps
        case userProfile
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        hasAccount = try container.decode(Bool.self, forKey: .hasAccount)
        isAuthenticated = try container.decode(Bool.self, forKey: .isAuthenticated)
        hasReferralCode = try container.decode(Bool.self, forKey: .hasReferralCode)
        isPremium = try container.decode(Bool.self, forKey: .isPremium)
        let rawSteps = try container.decode([String].self, forKey: .completedSteps)
        completedSteps = Set(rawSteps.compactMap(OnboardingStep.init(rawValue:)))
        userProfile = try container.decodeIfPresent(UserProfileDraft.self, forKey: .userProfile)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(hasAccount, forKey: .hasAccount)
        try container.encode(isAuthenticated, forKey: .isAuthenticated)
        try container.encode(hasReferralCode, forKey: .hasReferralCode)
        try container.encode(isPremium, forKey: .isPremium)
        try container.encode(completedSteps.map(\.rawValue).sorted(), forKey: .completedSteps)
        try container.encodeIfPresent(userProfile, forKey: .userProfile)
    }
}

/// External auth/subscription/referral signals (injected from AppRouter).
protocol OnboardingExternalGate {
    func isAuthenticated() async -> Bool
    func isPremium() async -> Bool
    func fetchReferral() -> String?
}

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

struct StaticOnboardingExternalGate: OnboardingExternalGate {
    var authenticated: Bool = false
    var premium: Bool = false
    var referral: String?

    func isAuthenticated() async -> Bool { authenticated }
    func isPremium() async -> Bool { premium }
    func fetchReferral() -> String? { referral }
}
