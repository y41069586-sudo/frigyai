import Foundation

/// Daily macro targets for the calorie ring + macro chips.
struct MacroTargets {
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int

    static let `default` = MacroTargets(calories: 1900, protein: 130, carbs: 210, fat: 65)
}

/// Loads real tracking data (today's food entries + macro targets) from Supabase.
/// Falls back to empty meals + default targets when Supabase is not configured or
/// no session exists, so the UI always renders.
@MainActor
final class TrackerDataService {
    static let shared = TrackerDataService()
    private init() {}

    /// Local calendar date as `yyyy-MM-dd` — matches how the web app stores `food_entries.date`.
    static func todayString() -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    func loadToday() async -> (meals: [LoggedMeal], targets: MacroTargets) {
        #if canImport(Supabase)
        guard SupabaseConfig.isConfigured,
              let session = try? await SupabaseAuthService.shared.client.auth.session else {
            return ([], .default)
        }

        let client = SupabaseAuthService.shared.client
        let userId = session.user.id.uuidString
        let date = Self.todayString()

        var meals: [LoggedMeal] = []
        if let rows: [FoodEntryRow] = try? await client
            .from("food_entries")
            .select()
            .eq("user_id", value: userId)
            .eq("date", value: date)
            .order("created_at", ascending: true)
            .execute()
            .value {
            meals = rows.map { row in
                LoggedMeal(
                    name: row.name,
                    calories: Int(row.calories.rounded()),
                    protein: Int(row.protein.rounded()),
                    carbs: Int(row.carbs.rounded()),
                    fat: Int(row.fat.rounded()),
                    time: "",
                    category: MealCategory(mealTypeKey: row.meal_type)
                )
            }
        }

        var targets = MacroTargets.default
        if let settings: [TrackerSettingsRow] = try? await client
            .from("user_tracker_settings")
            .select()
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value, let row = settings.first {
            targets = MacroTargets(
                calories: Int((row.daily_calories ?? Double(MacroTargets.default.calories)).rounded()),
                protein: Int((row.daily_protein ?? Double(MacroTargets.default.protein)).rounded()),
                carbs: Int((row.daily_carbs ?? Double(MacroTargets.default.carbs)).rounded()),
                fat: Int((row.daily_fat ?? Double(MacroTargets.default.fat)).rounded())
            )
        }

        return (meals, targets)
        #else
        return ([], .default)
        #endif
    }
}

#if canImport(Supabase)
/// Decodable mirrors of the Supabase rows. Property names match the snake_case
/// JSON keys returned by PostgREST, so no custom CodingKeys are needed.
private struct FoodEntryRow: Decodable {
    let id: String
    let name: String
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let meal_type: String?
    let date: String
}

private struct TrackerSettingsRow: Decodable {
    let daily_calories: Double?
    let daily_protein: Double?
    let daily_carbs: Double?
    let daily_fat: Double?
}
#endif

extension MealCategory {
    /// Map the web app's `meal_type` keys (breakfast/lunch/dinner/snack) onto the
    /// native category enum. Unknown / nil types fall back to `.snack`.
    init(mealTypeKey: String?) {
        switch mealTypeKey?.lowercased() {
        case "breakfast": self = .breakfast
        case "lunch":     self = .lunch
        case "dinner":    self = .dinner
        default:          self = .snack
        }
    }
}
