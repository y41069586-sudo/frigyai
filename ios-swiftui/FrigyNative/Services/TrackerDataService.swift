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

/// One ingredient line from a generated meal.
struct GeneratedIngredient: Decodable {
    let name: String
    let amount: String
}

/// A single meal from a generated week plan.
struct GeneratedMeal: Decodable {
    let type: String
    let name: String
    let prepTime: Int?
    let calories: Int?
    let protein: Int?
    let carbs: Int?
    let fat: Int?
    let allergenTags: [String]?
    let ingredients: [GeneratedIngredient]?
}

/// One day from a generated week plan.
struct GeneratedDayPlan: Decodable {
    let day: String
    let meals: [GeneratedMeal]
}

/// A unique food previously logged by the user — drives the tracker's recent-foods list.
struct RecentFood: Identifiable {
    let id: String   // Supabase food_entries.id of the most-recent logged occurrence
    let name: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
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

    // MARK: - Macro targets cache

    private let targetsKey = "frigy.cachedTargets.v1"

    private struct CachedTargets: Codable {
        let calories: Int; let protein: Int; let carbs: Int; let fat: Int
    }

    private func cachedTargets() -> MacroTargets? {
        guard let data = UserDefaults.standard.data(forKey: targetsKey),
              let c = try? JSONDecoder().decode(CachedTargets.self, from: data) else { return nil }
        return MacroTargets(calories: c.calories, protein: c.protein, carbs: c.carbs, fat: c.fat)
    }

    private func persistTargets(_ t: MacroTargets) {
        if let data = try? JSONEncoder().encode(CachedTargets(calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat)) {
            UserDefaults.standard.set(data, forKey: targetsKey)
        }
    }

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
                    entryId: row.id,
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

        var targets = cachedTargets() ?? MacroTargets.default
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
            persistTargets(targets)
        }

        return (meals, targets)
        #else
        return ([], .default)
        #endif
    }

    /// Current logging streak: consecutive days (ending today, or yesterday if
    /// nothing logged yet today) on which at least one food entry exists.
    func loadStreak() async -> Int {
        #if canImport(Supabase)
        guard let ctx = await context() else { return 0 }
        guard let rows: [FoodEntryRow] = try? await ctx.client
            .from("food_entries")
            .select("id,name,calories,protein,carbs,fat,meal_type,date")
            .eq("user_id", value: ctx.userId)
            .order("date", ascending: false)
            .limit(400)
            .execute()
            .value else { return 0 }

        let loggedDays = Set(rows.map(\.date))
        guard !loggedDays.isEmpty else { return 0 }

        let cal = Calendar(identifier: .gregorian)
        let formatter = DateFormatter()
        formatter.calendar = cal
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"

        // Start counting from today; if today isn't logged, allow the streak to
        // still be "alive" from yesterday rather than resetting to 0.
        var cursor = cal.startOfDay(for: Date())
        if !loggedDays.contains(formatter.string(from: cursor)) {
            guard let yesterday = cal.date(byAdding: .day, value: -1, to: cursor),
                  loggedDays.contains(formatter.string(from: yesterday)) else { return 0 }
            cursor = yesterday
        }

        var streak = 0
        while loggedDays.contains(formatter.string(from: cursor)) {
            streak += 1
            guard let prev = cal.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = prev
        }
        return streak
        #else
        return 0
        #endif
    }

    /// Resolve the user's current daily macro targets without loading meals.
    /// Reads `user_tracker_settings` (persisting to cache), falling back to the
    /// last cached value, then the static default. Used by the meal-plan
    /// generator so plans match the user's real goal — not hardcoded numbers.
    func loadTargets() async -> MacroTargets {
        #if canImport(Supabase)
        guard let ctx = await context() else { return cachedTargets() ?? .default }
        if let settings: [TrackerSettingsRow] = try? await ctx.client
            .from("user_tracker_settings")
            .select()
            .eq("user_id", value: ctx.userId)
            .limit(1)
            .execute()
            .value, let row = settings.first {
            let targets = MacroTargets(
                calories: Int((row.daily_calories ?? Double(MacroTargets.default.calories)).rounded()),
                protein: Int((row.daily_protein ?? Double(MacroTargets.default.protein)).rounded()),
                carbs: Int((row.daily_carbs ?? Double(MacroTargets.default.carbs)).rounded()),
                fat: Int((row.daily_fat ?? Double(MacroTargets.default.fat)).rounded())
            )
            persistTargets(targets)
            return targets
        }
        return cachedTargets() ?? .default
        #else
        return cachedTargets() ?? .default
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

    // MARK: - Recent foods (for tracker autocomplete)

    func loadRecentFoods() async -> [RecentFood] {
        #if canImport(Supabase)
        guard let ctx = await context() else { return [] }
        guard let rows: [FoodEntryRow] = try? await ctx.client
            .from("food_entries")
            .select()
            .eq("user_id", value: ctx.userId)
            .order("created_at", ascending: false)
            .limit(100)
            .execute()
            .value else { return [] }

        var seen = Set<String>()
        var result: [RecentFood] = []
        for row in rows {
            let key = row.name.lowercased().trimmingCharacters(in: .whitespaces)
            guard !seen.contains(key) else { continue }
            seen.insert(key)
            result.append(RecentFood(
                id: row.id,
                name: row.name,
                calories: Int(row.calories.rounded()),
                protein: Int(row.protein.rounded()),
                carbs: Int(row.carbs.rounded()),
                fat: Int(row.fat.rounded())
            ))
            if result.count >= 20 { break }
        }
        return result
        #else
        return []
        #endif
    }

    /// Delete a food entry by its Supabase row ID. Only deletes the current user's entries.
    @discardableResult
    func deleteFoodEntry(id: String) async -> Bool {
        #if canImport(Supabase)
        guard let ctx = await context() else { return false }
        do {
            try await ctx.client
                .from("food_entries")
                .delete()
                .eq("id", value: id)
                .eq("user_id", value: ctx.userId)
                .execute()
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

    // MARK: - Shopping list

    /// Fetch the user's shopping list from Supabase. Returns nil if not authenticated or on error.
    func loadShoppingItems() async -> [ShoppingItem]? {
        #if canImport(Supabase)
        guard let ctx = await context() else { return nil }
        guard let rows: [ShoppingItemRecord] = try? await ctx.client
            .from("shopping_items")
            .select()
            .eq("user_id", value: ctx.userId)
            .order("created_at", ascending: true)
            .execute()
            .value else { return nil }
        return rows.compactMap { row in
            guard let id = UUID(uuidString: row.id),
                  let category = ShoppingCategory(rawValue: row.category) else { return nil }
            return ShoppingItem(id: id, name: row.name, amount: row.amount,
                                category: category, isChecked: row.is_checked, price: row.price)
        }
        #else
        return nil
        #endif
    }

    /// Replace the user's shopping list in Supabase (delete-then-insert). Returns true on success.
    @discardableResult
    func saveShoppingItems(_ items: [ShoppingItem]) async -> Bool {
        #if canImport(Supabase)
        guard let ctx = await context() else { return false }
        do {
            try await ctx.client.from("shopping_items").delete().eq("user_id", value: ctx.userId).execute()
            if !items.isEmpty {
                let rows = items.map { item in
                    ShoppingItemInsert(
                        id: item.id.uuidString,
                        user_id: ctx.userId,
                        name: item.name,
                        amount: item.amount,
                        category: item.category.rawValue,
                        is_checked: item.isChecked,
                        price: item.price
                    )
                }
                try await ctx.client.from("shopping_items").insert(rows).execute()
            }
            return true
        } catch {
            return false
        }
        #else
        return false
        #endif
    }

    // MARK: - Account deletion

    /// Permanently delete the user's account and all server-side data via the
    /// `delete-user` edge function (uses the service role to remove the auth
    /// user + DB rows). Returns true on success.
    func deleteAccount() async -> Bool {
        #if canImport(Supabase)
        guard SupabaseConfig.isConfigured,
              let base = SupabaseConfig.urlString,
              let anonKey = SupabaseConfig.anonKey,
              let session = try? await SupabaseAuthService.shared.client.auth.session,
              let url = URL(string: "\(base)/functions/v1/delete-user") else { return false }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = Data("{}".utf8)

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            return (200..<300).contains(status)
        } catch {
            return false
        }
        #else
        return false
        #endif
    }

    // MARK: - Meal plan generation

    /// Calls the `generate-meal-plan` edge function. Returns parsed 7-day plan on success, nil on failure.
    /// Passes the user's dietary preferences, allergies and health goals so the plan
    /// respects them (a vegan never gets meat; an allergic user never gets unsafe meals).
    func generateMealPlan(calories: Int, protein: Int, carbs: Int, fat: Int,
                          mealsPerDay: Int = 4,
                          dietaryPreferences: [String] = [], allergies: [String] = [],
                          healthGoals: [String] = [],
                          mealPlanPreferences: MealPlanPrefsPayload? = nil) async -> [GeneratedDayPlan]? {
        #if canImport(Supabase)
        guard SupabaseConfig.isConfigured,
              let base = SupabaseConfig.urlString,
              let anonKey = SupabaseConfig.anonKey,
              let session = try? await SupabaseAuthService.shared.client.auth.session,
              let url = URL(string: "\(base)/functions/v1/generate-meal-plan") else { return nil }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONEncoder().encode(MealPlanRequest(
            dailyCalories: calories, dailyProtein: protein,
            dailyCarbs: carbs, dailyFat: fat, mealsPerDay: mealsPerDay,
            dietaryPreferences: dietaryPreferences, allergies: allergies, healthGoals: healthGoals,
            mealPlanPreferences: mealPlanPreferences
        ))

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
            let decoded = try JSONDecoder().decode(MealPlanResponse.self, from: data)
            return decoded.mealPlan
        } catch {
            return nil
        }
        #else
        return nil
        #endif
    }

    // MARK: - Food analysis (analyze-food edge function — OpenAI + Open Food Facts)

    /// Analyze a food by text query, barcode, or photo via the `analyze-food`
    /// Supabase edge function (the app's own OpenAI-backed API). Returns a
    /// `RecentFood` with per-portion macros, or nil on failure.
    func analyzeFood(query: String? = nil, imageBase64: String? = nil) async -> RecentFood? {
        #if canImport(Supabase)
        guard SupabaseConfig.isConfigured,
              let base = SupabaseConfig.urlString,
              let anonKey = SupabaseConfig.anonKey,
              let url = URL(string: "\(base)/functions/v1/analyze-food") else { return nil }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 25
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        if let session = try? await SupabaseAuthService.shared.client.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        } else {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        }

        // Send only the provided field (the edge function's schema rejects nulls).
        var body: [String: String] = [:]
        if let query, !query.isEmpty { body["food"] = query }
        if let imageBase64, !imageBase64.isEmpty { body["imageBase64"] = imageBase64 }
        guard !body.isEmpty,
              let payload = try? JSONSerialization.data(withJSONObject: body) else { return nil }
        request.httpBody = payload

        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let decoded = try? JSONDecoder().decode(AnalyzeFoodResponse.self, from: data),
              !decoded.name.isEmpty else { return nil }

        return RecentFood(
            id: UUID().uuidString,
            name: decoded.name,
            calories: Int((decoded.calories ?? 0).rounded()),
            protein: Int((decoded.protein ?? 0).rounded()),
            carbs: Int((decoded.carbs ?? 0).rounded()),
            fat: Int((decoded.fat ?? 0).rounded())
        )
        #else
        return nil
        #endif
    }

    // MARK: - Barcode lookup (OpenFoodFacts — no API key required)

    /// Looks a product barcode up directly against the free public OpenFoodFacts
    /// API. This deliberately does NOT go through the OpenAI-backed analyze-food
    /// edge function: barcodes resolve to a real database entry, so no AI (and no
    /// OPENAI_API_KEY) is needed. Values are per 100 g, which the manual-entry
    /// sheet then lets the user scale to their actual serving.
    func lookupBarcodeOpenFoodFacts(_ barcode: String) async -> RecentFood? {
        let trimmed = barcode.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              let url = URL(string: "https://world.openfoodfacts.org/api/v2/product/\(trimmed).json?fields=product_name,product_name_de,generic_name,brands,nutriments") else {
            return nil
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 15
        // OpenFoodFacts asks every client to send an identifying User-Agent.
        request.setValue("Frigy/1.0 (support@frigy.app)", forHTTPHeaderField: "User-Agent")

        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              (json["status"] as? Int) == 1,
              let product = json["product"] as? [String: Any] else {
            return nil
        }

        // Prefer a localized name, fall back through the generic name / brand.
        let name = firstNonEmpty([
            product["product_name_de"] as? String,
            product["product_name"] as? String,
            product["generic_name"] as? String,
            product["brands"] as? String,
        ]) ?? trimmed

        let nutriments = product["nutriments"] as? [String: Any] ?? [:]

        // kcal may be reported directly, or only as kJ ("energy_100g") — convert.
        let kcal: Double = {
            if let v = doubleValue(nutriments["energy-kcal_100g"]) { return v }
            if let kj = doubleValue(nutriments["energy_100g"]) { return kj / 4.184 }
            return 0
        }()

        let food = RecentFood(
            id: UUID().uuidString,
            name: name,
            calories: Int(kcal.rounded()),
            protein: Int((doubleValue(nutriments["proteins_100g"]) ?? 0).rounded()),
            carbs: Int((doubleValue(nutriments["carbohydrates_100g"]) ?? 0).rounded()),
            fat: Int((doubleValue(nutriments["fat_100g"]) ?? 0).rounded())
        )

        // A hit with a usable name is valid even if some macros are missing.
        return food.name.isEmpty ? nil : food
    }

    private func firstNonEmpty(_ candidates: [String?]) -> String? {
        for case let value? in candidates {
            let t = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if !t.isEmpty { return t }
        }
        return nil
    }

    /// OpenFoodFacts returns numeric nutriment values sometimes as numbers and
    /// sometimes as strings — accept both.
    private func doubleValue(_ any: Any?) -> Double? {
        if let d = any as? Double { return d }
        if let i = any as? Int { return Double(i) }
        if let s = any as? String { return Double(s.replacingOccurrences(of: ",", with: ".")) }
        return nil
    }

    // MARK: - Ingredient analysis (analyze-ingredients edge function)

    /// Outcome of a single fridge-photo scan. `errorMessage` is non-nil only when
    /// the scan could not run at all (premium required, auth, network) — that lets
    /// the UI explain why nothing was detected instead of silently going blank.
    struct IngredientScanResult {
        let ingredients: [String]
        let errorMessage: String?

        static func success(_ items: [String]) -> IngredientScanResult {
            IngredientScanResult(ingredients: items, errorMessage: nil)
        }
        static func failure(_ message: String) -> IngredientScanResult {
            IngredientScanResult(ingredients: [], errorMessage: message)
        }
    }

    func analyzeIngredients(imageDataURL: String) async -> IngredientScanResult {
        #if canImport(Supabase)
        guard SupabaseConfig.isConfigured,
              let base = SupabaseConfig.urlString,
              let anonKey = SupabaseConfig.anonKey,
              let url = URL(string: "\(base)/functions/v1/analyze-ingredients") else {
            return .failure("Keine Verbindung zum Server.")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        if let session = try? await SupabaseAuthService.shared.client.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        } else {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        }

        let body: [String: Any] = ["image": imageDataURL, "isOnboarding": false]
        guard let payload = try? JSONSerialization.data(withJSONObject: body) else {
            return .failure("Bild konnte nicht gesendet werden.")
        }
        request.httpBody = payload

        guard let (data, response) = try? await URLSession.shared.data(for: request) else {
            return .failure("Keine Verbindung – bitte Internet prüfen.")
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard status == 200 else {
            switch status {
            case 401:      return .failure("Bitte melde dich an, um Zutaten zu erkennen.")
            case 403:      return .failure("Zutaten-Erkennung ist eine Premium-Funktion.")
            case 429:      return .failure("Zu viele Anfragen – bitte kurz warten und erneut versuchen.")
            default:       return .failure("Erkennung fehlgeschlagen (Fehler \(status)).")
            }
        }

        struct IngredientsResponse: Decodable { let ingredients: [String] }
        guard let decoded = try? JSONDecoder().decode(IngredientsResponse.self, from: data) else {
            return .failure("Antwort konnte nicht gelesen werden.")
        }
        return .success(decoded.ingredients)
        #else
        return .failure("Nicht verfügbar.")
        #endif
    }

    // MARK: - Referral code validation

    struct ReferralValidationResult {
        let valid: Bool
        let code: String?
        let influencerName: String?
        let error: String?
    }

    func validateReferralCode(_ code: String) async -> ReferralValidationResult {
        #if canImport(Supabase)
        guard SupabaseConfig.isConfigured,
              let base = SupabaseConfig.urlString,
              let anonKey = SupabaseConfig.anonKey,
              let url = URL(string: "\(base)/functions/v1/validate-referral-code") else {
            return ReferralValidationResult(valid: false, code: nil, influencerName: nil, error: "Nicht verbunden")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        let body: [String: Any] = ["code": code]
        guard let payload = try? JSONSerialization.data(withJSONObject: body) else {
            return ReferralValidationResult(valid: false, code: nil, influencerName: nil, error: "Fehler")
        }
        request.httpBody = payload
        guard let (data, _) = try? await URLSession.shared.data(for: request) else {
            return ReferralValidationResult(valid: false, code: nil, influencerName: nil, error: "Keine Verbindung")
        }
        struct Resp: Decodable { let valid: Bool; let code: String?; let influencer_name: String?; let error: String? }
        guard let decoded = try? JSONDecoder().decode(Resp.self, from: data) else {
            return ReferralValidationResult(valid: false, code: nil, influencerName: nil, error: "Unbekannter Fehler")
        }
        return ReferralValidationResult(valid: decoded.valid, code: decoded.code, influencerName: decoded.influencer_name, error: decoded.error)
        #else
        return ReferralValidationResult(valid: false, code: nil, influencerName: nil, error: "Nicht unterstützt")
        #endif
    }

    // MARK: - User settings

    func loadUserEmail() async -> String? {
        #if canImport(Supabase)
        return try? await SupabaseAuthService.shared.client.auth.session.user.email
        #else
        return nil
        #endif
    }

    @discardableResult
    func saveTargets(_ targets: MacroTargets) async -> Bool {
        #if canImport(Supabase)
        guard let ctx = await context() else { return false }
        let payload = TrackerSettingsUpsert(
            user_id: ctx.userId,
            daily_calories: Double(targets.calories),
            daily_protein: Double(targets.protein),
            daily_carbs: Double(targets.carbs),
            daily_fat: Double(targets.fat)
        )
        do {
            try await ctx.client
                .from("user_tracker_settings")
                .upsert(payload, onConflict: "user_id")
                .execute()
            persistTargets(targets)
            return true
        } catch {
            return false
        }
        #else
        return false
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

    func hasActiveSession() async -> Bool {
        #if canImport(Supabase)
        return (try? await SupabaseAuthService.shared.client.auth.session) != nil
        #else
        return false
        #endif
    }
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

private struct TrackerSettingsUpsert: Encodable {
    let user_id: String
    let daily_calories: Double
    let daily_protein: Double
    let daily_carbs: Double
    let daily_fat: Double
}

private struct WeightInsert: Encodable {
    let user_id: String
    let weight: Double
    let recorded_at: String
}

private struct MealPlanRequest: Encodable {
    let dailyCalories: Int
    let dailyProtein: Int
    let dailyCarbs: Int
    let dailyFat: Int
    let mealsPerDay: Int
    let dietaryPreferences: [String]
    let allergies: [String]
    let healthGoals: [String]
    let mealPlanPreferences: MealPlanPrefsPayload?
}

/// Mirrors `MealPlanPrefsInput` in `supabase/functions/generate-meal-plan/mealPlanPrefs.ts`.
struct MealPlanPrefsPayload: Encodable {
    let cuisines: [String]
    let maxPrepTime: String
    let cookFrequency: String
    let budget: String
    let variety: String
}

private struct MealPlanResponse: Decodable {
    let mealPlan: [GeneratedDayPlan]
}

private struct AnalyzeFoodResponse: Decodable {
    let name: String
    let calories: Double?
    let protein: Double?
    let carbs: Double?
    let fat: Double?
}

private struct ChatRequest: Encodable {
    let message: String
    let history: [ChatTurn]
}

private struct ChatReply: Decodable {
    let message: String
}

private struct ShoppingItemRecord: Decodable {
    let id: String
    let name: String
    let amount: String
    let category: String
    let is_checked: Bool
    let price: Double
}

private struct ShoppingItemInsert: Encodable {
    let id: String
    let user_id: String
    let name: String
    let amount: String
    let category: String
    let is_checked: Bool
    let price: Double
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

    /// Best-guess category from the current time of day, used when the user
    /// logs a meal without explicitly choosing a slot.
    static func current(at date: Date = Date()) -> MealCategory {
        switch Calendar.current.component(.hour, from: date) {
        case 5..<11:  return .breakfast
        case 11..<15: return .lunch
        case 17..<22: return .dinner
        default:      return .snack
        }
    }
}
