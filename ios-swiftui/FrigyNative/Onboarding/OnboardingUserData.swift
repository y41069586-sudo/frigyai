import Foundation

/// Subset of `UserData` from `src/components/onboarding/types.ts` — enough for persistence + macro preview.
struct OnboardingUserData: Codable, Equatable {
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

    static let `default` = OnboardingUserData()

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

struct OnboardingPersistedState: Codable, Equatable {
    var currentStep: OnboardingStep
    var userData: OnboardingUserData
    var updatedAt: Date
}

protocol OnboardingPersistenceProtocol {
    func load() -> OnboardingPersistedState?
    func save(_ state: OnboardingPersistedState)
    func clear()
    func isMarkedComplete() -> Bool
    func markComplete()
}

struct UserDefaultsOnboardingPersistence: OnboardingPersistenceProtocol {
    private let stateKey = "onboardingPersistedState"
    private let completeKey = "onboardingComplete"

    func load() -> OnboardingPersistedState? {
        guard let data = UserDefaults.standard.data(forKey: stateKey) else { return nil }
        return try? JSONDecoder().decode(OnboardingPersistedState.self, from: data)
    }

    func save(_ state: OnboardingPersistedState) {
        guard let data = try? JSONEncoder().encode(state) else { return }
        UserDefaults.standard.set(data, forKey: stateKey)
    }

    func clear() {
        UserDefaults.standard.removeObject(forKey: stateKey)
        UserDefaults.standard.removeObject(forKey: completeKey)
    }

    func isMarkedComplete() -> Bool {
        UserDefaults.standard.bool(forKey: completeKey)
    }

    func markComplete() {
        UserDefaults.standard.set(true, forKey: completeKey)
        UserDefaults.standard.removeObject(forKey: stateKey)
    }
}
