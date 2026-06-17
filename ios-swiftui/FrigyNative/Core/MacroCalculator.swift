import Foundation

/// Port of `src/components/onboarding/utils.ts` — Mifflin-St Jeor macro calculation.
enum MacroCalculator {
    static let minOnboardingAge = 13

    enum Gender: String {
        case male
        case female
        case nonBinary = "non-binary"
    }

    enum ActivityLevel: String {
        case low
        case medium
        case high
    }

    enum GoalMode: String {
        case lose
        case maintain
        case gain
    }

    struct Input {
        var weightKg: Double
        var heightCm: Double
        var age: Int
        var gender: Gender
        var activityLevel: ActivityLevel
        var goalMode: GoalMode
        var weeklyGoalKg: Double
        var targetWeightKg: Double
    }

    struct Result: Equatable {
        var dailyCalories: Int
        var dailyProtein: Int
        var dailyCarbs: Int
        var dailyFat: Int
    }

    static func minCaloriesForAge(_ age: Int) -> Int {
        if age < 25 { return 1500 }
        if age < 40 { return 1400 }
        return 1300
    }

    static func calculateMacros(_ input: Input) -> Result {
        let genderConstant: Double = switch input.gender {
        case .female: -161
        case .nonBinary: -78
        case .male: 5
        }

        let bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * Double(input.age) + genderConstant

        let activityMultiplier: Double = switch input.activityLevel {
        case .low: 1.2
        case .medium: 1.55
        case .high: 1.9
        }

        let tdee = bmr * activityMultiplier
        let dailyCalorieChange = input.weeklyGoalKg * 1100

        var dailyCalories: Double = switch input.goalMode {
        case .maintain: tdee
        case .lose: tdee - dailyCalorieChange
        case .gain: tdee + dailyCalorieChange
        }

        dailyCalories = max(dailyCalories, Double(minCaloriesForAge(input.age)))
        let roundedCalories = Int(dailyCalories.rounded())

        let dailyProtein = Int((input.weightKg * 2).rounded())
        let dailyFat = Int((input.weightKg * 0.9).rounded())
        let proteinCalories = dailyProtein * 4
        let fatCalories = dailyFat * 9
        let remainingCalories = roundedCalories - proteinCalories - fatCalories
        let dailyCarbs = max(50, Int((Double(remainingCalories) / 4).rounded()))

        return Result(
            dailyCalories: roundedCalories,
            dailyProtein: dailyProtein,
            dailyCarbs: dailyCarbs,
            dailyFat: dailyFat
        )
    }

    static func weeksToGoal(_ input: Input) -> Int {
        if input.goalMode == .maintain { return 0 }
        guard input.weeklyGoalKg > 0 else { return .max }

        let weightDiff = abs(input.targetWeightKg - input.weightKg)
        return Int(ceil(weightDiff / input.weeklyGoalKg))
    }
}
