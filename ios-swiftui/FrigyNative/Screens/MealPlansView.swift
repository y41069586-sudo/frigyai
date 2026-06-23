import SwiftUI

// MARK: - Model

struct DayPlan: Identifiable {
    let id = UUID()
    let weekday: String
    let shortDay: String
    let isToday: Bool
    var meals: [PlannedMeal]
    var totalCal: Int { meals.reduce(0) { $0 + $1.calories } }
}

struct PlannedMeal: Identifiable {
    let id = UUID()
    let category: MealCategory
    let name: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let duration: Int // minutes
    let tags: [String]
}

// MARK: - View
//
// Faithful native port of the web `MealPlansPage.tsx` (Plan tab):
//   - light mint page background (#F2FFF8)
//   - sticky "Frigy" header with back arrow
//   - stacked day cards, each with a green weekday header and its meals
//   - each meal: type label + kcal (right), name, P/K/F macros, "Gegessen" button
// Web tokens: --primary = #75FBB2, macros = red-400/amber-400/blue-400.

struct MealPlansView: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    @State private var weekPlan: [DayPlan] = makeDemoWeek()
    @State private var isGenerating = false
    @State private var bannerMessage: String?
    @State private var bannerIsError = false
    @State private var eatenMealIDs: Set<UUID> = []

    // Web tokens
    private let pageBg     = Color(hex: "#F2FFF8")
    private let primary    = Color(hex: "#75FBB2")
    private let foreground = Color(hex: "#1F2937")
    private let muted      = Color(hex: "#6B7280")
    private let proteinClr = Color(hex: "#F87171") // red-400
    private let carbsClr   = Color(hex: "#FBBF24") // amber-400
    private let fatClr     = Color(hex: "#60A5FA") // blue-400

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    generateButton

                    if let msg = bannerMessage {
                        Text(msg)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(bannerIsError ? Color(hex: "#B91C1C") : Color(hex: "#39D47F"))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(bannerIsError ? Color(hex: "#FEF2F2") : Color(hex: "#DCFEEF"))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    ForEach(weekPlan) { day in
                        dayCard(day)
                    }

                    Spacer().frame(height: 100)
                }
                .padding(.horizontal, 12)
                .padding(.top, 16)
            }
        }
        .background(pageBg.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }

    // MARK: - Header (web sticky top bar: back arrow + "Frigy")

    private var header: some View {
        VStack(spacing: 0) {
            HStack(spacing: 4) {
                Button {
                    tabCoordinator.selectedTab = .home
                } label: {
                    Image(systemName: "arrow.left")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(foreground)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)

                Text("Frigy")
                    .font(.system(size: 19, weight: .black))
                    .tracking(-0.8)
                    .foregroundColor(foreground)

                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)

            Divider().overlay(primary.opacity(0.15))
        }
        .background(.regularMaterial)
    }

    // MARK: - Generate button (web gradient pill, dark text)

    private var generateButton: some View {
        Button {
            Task { await generatePlan() }
        } label: {
            HStack(spacing: 8) {
                if isGenerating {
                    ProgressView().tint(Color(hex: "#082013"))
                    Text("Wird erstellt…")
                } else {
                    Image(systemName: "sparkles")
                    Text("Wochenplan erstellen")
                }
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(Color(hex: "#082013"))
            .frame(maxWidth: .infinity)
            .frame(height: 44)
            .background(
                LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        .disabled(isGenerating)
        .opacity(isGenerating ? 0.7 : 1)
    }

    // MARK: - Day card (web Card: weekday header + stacked meals)

    private func dayCard(_ day: DayPlan) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(day.weekday)
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(primary)

            if day.meals.isEmpty {
                Text("Noch kein Plan für diesen Tag")
                    .font(.system(size: 13))
                    .foregroundColor(muted)
                    .padding(.vertical, 8)
            } else {
                ForEach(day.meals) { meal in
                    mealTile(meal)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(primary.opacity(day.isToday ? 0.35 : 0.2), lineWidth: day.isToday ? 2 : 1)
        )
        .shadow(color: .black.opacity(0.03), radius: 6, y: 2)
    }

    // MARK: - Meal tile (web inner meal: type+kcal, name, P/K/F, Gegessen)

    private func mealTile(_ meal: PlannedMeal) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(meal.category.rawValue)
                    .font(.system(size: 11))
                    .foregroundColor(muted)
                    .lineLimit(1)
                Spacer()
                Text("\(meal.calories)")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(primary)
            }

            Text(meal.name)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(foreground)
                .lineLimit(2)

            HStack(spacing: 8) {
                Text("\(meal.protein)P").foregroundColor(proteinClr)
                Text("\(meal.carbs)K").foregroundColor(carbsClr)
                Text("\(meal.fat)F").foregroundColor(fatClr)
            }
            .font(.system(size: 11))

            // "Gegessen" button — logs the meal to today's tracker
            Button {
                Task { await markEaten(meal) }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: eatenMealIDs.contains(meal.id) ? "checkmark.circle.fill" : "checkmark")
                        .font(.system(size: 11, weight: .bold))
                    Text(eatenMealIDs.contains(meal.id) ? "Gegessen ✓" : "Gegessen")
                        .font(.system(size: 12, weight: .medium))
                }
                .foregroundColor(eatenMealIDs.contains(meal.id) ? Color(hex: "#39D47F") : foreground)
                .frame(maxWidth: .infinity)
                .frame(height: 32)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(eatenMealIDs.contains(meal.id) ? primary.opacity(0.15) : Color.clear)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(primary.opacity(0.3), lineWidth: 1))
                )
            }
            .buttonStyle(.plain)
            .padding(.top, 2)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(pageBg.opacity(0.6)))
    }

    // MARK: - Actions

    private func markEaten(_ meal: PlannedMeal) async {
        let ok = await TrackerDataService.shared.addFoodEntry(
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            portion: nil,
            category: meal.category
        )
        if ok {
            eatenMealIDs.insert(meal.id)
        }
    }

    private func generatePlan() async {
        isGenerating = true
        bannerMessage = nil
        let targets = MacroTargets.default
        if let generatedDays = await TrackerDataService.shared.generateMealPlan(
            calories: targets.calories,
            protein: targets.protein,
            carbs: targets.carbs,
            fat: targets.fat
        ) {
            weekPlan = weekPlan.enumerated().map { (i, existing) in
                guard i < generatedDays.count else { return existing }
                let genDay = generatedDays[i]
                let meals = genDay.meals.map { m in
                    PlannedMeal(
                        category: MealCategory(mealTypeKey: m.type),
                        name: m.name,
                        calories: m.calories ?? 0,
                        protein: m.protein ?? 0,
                        carbs: m.carbs ?? 0,
                        fat: m.fat ?? 0,
                        duration: m.prepTime ?? 0,
                        tags: m.allergenTags ?? []
                    )
                }
                return DayPlan(weekday: existing.weekday, shortDay: existing.shortDay,
                               isToday: existing.isToday, meals: meals)
            }
            eatenMealIDs = []
            bannerIsError = false
            bannerMessage = "Plan erfolgreich erstellt!"
            Task {
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                bannerMessage = nil
            }
        } else {
            bannerIsError = true
            bannerMessage = "Plan konnte nicht erstellt werden. Premium erforderlich oder Verbindung prüfen."
        }
        isGenerating = false
    }
}

// MARK: - Demo data

private func makeDemoWeek() -> [DayPlan] {
    let calendar = Calendar.current
    let today = Date()
    let weekday = calendar.component(.weekday, from: today)
    let startOfWeek = calendar.date(byAdding: .day, value: -(weekday - 2), to: today) ?? today

    let dayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    let shortNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

    return (0..<7).map { i in
        let date = calendar.date(byAdding: .day, value: i, to: startOfWeek) ?? today
        let isToday = calendar.isDateInToday(date)

        let meals: [PlannedMeal] = i < 5 ? [
            PlannedMeal(category: .breakfast, name: "Haferflocken mit Beeren", calories: 320, protein: 12, carbs: 52, fat: 8, duration: 5, tags: ["Vegan"]),
            PlannedMeal(category: .lunch, name: "Hähnchen-Quinoa Bowl", calories: 520, protein: 42, carbs: 48, fat: 16, duration: 20, tags: ["High Protein"]),
            PlannedMeal(category: .snack, name: "Griechischer Joghurt", calories: 130, protein: 15, carbs: 9, fat: 4, duration: 0, tags: ["Proteinreich"]),
            PlannedMeal(category: .dinner, name: "Lachs mit Gemüse", calories: 480, protein: 38, carbs: 22, fat: 26, duration: 25, tags: ["Omega-3"]),
        ] : []

        return DayPlan(weekday: dayNames[i], shortDay: shortNames[i], isToday: isToday, meals: meals)
    }
}
