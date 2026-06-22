import Foundation
#if canImport(Supabase)
import Supabase
#endif

/// Daily macro targets for the calorie ring + macro chips.
struct MacroTargets {
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int

    static let `default` = MacroTargets(calories: 1900, protein: 130, carbs: 210, fat: 65)
}

/// A weight measurement for the progress chart.
struct WeightPoint: Identifiable {
    let id = UUID()
    let date: Date
    let kg: Double
}

/// An earned achievement badge.
struct EarnedBadge: Identifiable {
    let id: String
    let name: String
    let type: String
    let earnedAt: Date
}

/// One chat turn for the KI-Coach.
struct ChatTurn: Codable {
    let role: String      // "user" | "assistant"
    let content: String
}

/// Central data layer for the native app. Talks to Supabase (PostgREST + Edge
/// Functions) with safe fallbacks so every screen renders even when Supabase is
/// not configured or there is no session.
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

    // MARK: - Home dashboard

    func loadToday() async -> (meals: [LoggedMeal], targets: MacroTargets) {
        #if canImport(Supabase)
        guard let ctx = await context() else { return ([], .default) }
        let date = Self.todayString()

        var meals: [LoggedMeal] = []
        if let rows: [FoodEntryRow] = try? await ctx.client
            .from("food_entries")
            .select()
            .eq("user_id", value: ctx.userId)
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
        if let settings: [TrackerSettingsRow] = try? await ctx.client
            .from("user_tracker_settings")
            .select()
            .eq("user_id", value: ctx.userId)
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

    // MARK: - Tracker (log a meal)

    /// Persist a food entry for today. Returns true on success.
    @discardableResult
    func addFoodEntry(name: String, calories: Int, protein: Int, carbs: Int, fat: Int,
                      portion: String?, category: MealCategory) async -> Bool {
        #if canImport(Supabase)
        guard let ctx = await context() else { return false }
        let payload = FoodEntryInsert(
            user_id: ctx.userId,
            name: name,
            calories: Double(calories),
            protein: Double(protein),
            carbs: Double(carbs),
            fat: Double(fat),
            portion: portion,
            meal_type: category.mealTypeKey,
            date: Self.todayString()
        )
        do {
            try await ctx.client.from("food_entries").insert(payload).execute()
            return true
        } catch {
            return false
        }
        #else
        return false
        #endif
    }

    // MARK: - Weight progress

    func loadWeightEntries(limit: Int = 30) async -> [WeightPoint] {
        #if canImport(Supabase)
        guard let ctx = await context() else { return [] }
        guard let rows: [WeightEntryRow] = try? await ctx.client
            .from("weight_entries")
            .select()
            .eq("user_id", value: ctx.userId)
            .order("recorded_at", ascending: true)
            .limit(limit)
            .execute()
            .value else { return [] }

        let parser = ISO8601DateFormatter()
        parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        return rows.map { row in
            let date = parser.date(from: row.recorded_at)
                ?? fallback.date(from: row.recorded_at)
                ?? Date()
            return WeightPoint(date: date, kg: row.weight)
        }
        #else
        return []
        #endif
    }

    /// Record a new weight measurement.
    @discardableResult
    func addWeightEntry(kg: Double) async -> Bool {
        #if canImport(Supabase)
        guard let ctx = await context() else { return false }
        let payload = WeightInsert(user_id: ctx.userId, weight: kg, recorded_at: ISO8601DateFormatter().string(from: Date()))
        do {
            try await ctx.client.from("weight_entries").insert(payload).execute()
            return true
        } catch {
            return false
        }
        #else
        return false
        #endif
    }

    // MARK: - Badges

    func loadBadges() async -> [EarnedBadge] {
        #if canImport(Supabase)
        guard let ctx = await context() else { return [] }
        guard let rows: [BadgeRow] = try? await ctx.client
            .from("user_badges")
            .select()
            .eq("user_id", value: ctx.userId)
            .order("earned_at", ascending: false)
            .execute()
            .value else { return [] }

        let parser = ISO8601DateFormatter()
        return rows.map { row in
            EarnedBadge(
                id: row.id,
                name: row.badge_name,
                type: row.badge_type,
                earnedAt: parser.date(from: row.earned_at) ?? Date()
            )
        }
        #else
        return []
        #endif
    }

    // MARK: - KI-Coach chat (ai-chat edge function)

    /// Send a message to the ai-chat edge function. Returns the assistant reply,
    /// or nil if the call fails (caller shows a friendly fallback).
    func sendChatMessage(_ message: String, history: [ChatTurn]) async -> String? {
        #if canImport(Supabase)
        guard SupabaseConfig.isConfigured,
              let base = SupabaseConfig.urlString,
              let anonKey = SupabaseConfig.anonKey,
              let session = try? await SupabaseAuthService.shared.client.auth.session,
              let url = URL(string: "\(base)/functions/v1/ai-chat") else {
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        guard let body = try? JSONEncoder().encode(ChatRequest(message: message, history: history)) else {
            return nil
        }
        request.httpBody = body

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let reply = try JSONDecoder().decode(ChatReply.self, from: data)
            return reply.message
        } catch {
            return nil
        }
        #else
        return nil
        #endif
    }

    // MARK: - Private

    #if canImport(Supabase)
    private struct Context {
        let client: SupabaseClient
        let userId: String
    }

    private func context() async -> Context? {
        guard SupabaseConfig.isConfigured,
              let session = try? await SupabaseAuthService.shared.client.auth.session else {
            return nil
        }
        return Context(client: SupabaseAuthService.shared.client, userId: session.user.id.uuidString)
    }
    #endif
}

#if canImport(Supabase)
// Decodable mirrors of Supabase rows. Property names match the snake_case JSON
// keys returned by PostgREST, so no custom CodingKeys are needed.
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

private struct WeightEntryRow: Decodable {
    let id: String
    let weight: Double
    let recorded_at: String
}

private struct BadgeRow: Decodable {
    let id: String
    let badge_name: String
    let badge_type: String
    let earned_at: String
}

private struct FoodEntryInsert: Encodable {
    let user_id: String
    let name: String
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let portion: String?
    let meal_type: String
    let date: String
}

private struct WeightInsert: Encodable {
    let user_id: String
    let weight: Double
    let recorded_at: String
}

private struct ChatRequest: Encodable {
    let message: String
    let history: [ChatTurn]
}

private struct ChatReply: Decodable {
    let message: String
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

    /// The web app's storage key for this category.
    var mealTypeKey: String {
        switch self {
        case .breakfast: "breakfast"
        case .lunch:     "lunch"
        case .dinner:    "dinner"
        case .snack:     "snack"
        }
    }
}
