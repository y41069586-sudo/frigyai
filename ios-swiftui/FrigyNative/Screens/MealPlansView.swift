import SwiftUI
import UIKit
import PhotosUI

// MARK: - Model

struct DayPlan: Identifiable, Codable {
    let id: UUID
    let weekday: String
    let shortDay: String
    let isToday: Bool
    var meals: [PlannedMeal]
    var totalCal: Int { meals.reduce(0) { $0 + $1.calories } }
    init(id: UUID = UUID(), weekday: String, shortDay: String, isToday: Bool, meals: [PlannedMeal]) {
        self.id = id; self.weekday = weekday; self.shortDay = shortDay
        self.isToday = isToday; self.meals = meals
    }
}

struct PlannedMeal: Identifiable, Codable {
    let id: UUID
    let category: MealCategory
    let name: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let duration: Int
    let tags: [String]
    init(id: UUID = UUID(), category: MealCategory, name: String, calories: Int, protein: Int, carbs: Int, fat: Int, duration: Int, tags: [String]) {
        self.id = id; self.category = category; self.name = name
        self.calories = calories; self.protein = protein; self.carbs = carbs
        self.fat = fat; self.duration = duration; self.tags = tags
    }
}

// MARK: - View
//
// Faithful native port of the web `MealPlansPage.tsx` (Plan tab):
//   - light mint page background (#F2FFF8)
//   - sticky "Frigy" header with back arrow
//   - stacked day cards, each with a green weekday header and its meals
//   - each meal: type label + kcal (right), name, P/K/F macros, "Gegessen" button
// Web tokens: --primary = #75FBB2, macros = red-400/amber-400/blue-400.

private let weekPlanKey = "frigy.weekPlan.v1"

struct MealPlansView: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    @State private var weekPlan: [DayPlan] = Self.loadSavedPlan()
    @State private var isGenerating = false
    @State private var bannerMessage: String?
    @State private var bannerIsError = false
    @State private var eatenMealIDs: Set<UUID> = []
    @State private var toastMessage: String?
    @State private var selectedTemplate: FoodTemplate?
    @State private var showFridgeScan = false
    @ObservedObject private var healthKit = HealthKitService.shared

    private static func loadSavedPlan() -> [DayPlan] {
        if let data = UserDefaults.standard.data(forKey: weekPlanKey),
           let saved = try? JSONDecoder().decode([DayPlan].self, from: data),
           !saved.isEmpty {
            return alignToCurrentWeek(saved)
        }
        return makeDemoWeek()
    }

    private static func alignToCurrentWeek(_ saved: [DayPlan]) -> [DayPlan] {
        let fresh = makeDemoWeek()
        return fresh.enumerated().map { (i, day) in
            let meals = i < saved.count ? saved[i].meals : []
            return DayPlan(weekday: day.weekday, shortDay: day.shortDay, isToday: day.isToday, meals: meals)
        }
    }

    private func savePlan() {
        if let data = try? JSONEncoder().encode(weekPlan) {
            UserDefaults.standard.set(data, forKey: weekPlanKey)
        }
    }

    /// Loads the user's onboarding/profile draft so the meal plan can respect
    /// their dietary preferences and allergies.
    private static func loadProfileDraft() -> UserProfileDraft? {
        guard let data = UserDefaults.standard.data(forKey: "onboardingPersistedState"),
              let state = try? JSONDecoder().decode(OnboardingPersistedState.self, from: data) else {
            return nil
        }
        return state.context.userProfile
    }

    private let proteinClr = Color(hex: "#F87171")
    private let carbsClr   = Color(hex: "#FBBF24")
    private let fatClr     = Color(hex: "#60A5FA")

    var body: some View {
        VStack(spacing: 0) {
            header

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    generateButton
                        .padding(.top, 8)

                    if let msg = bannerMessage {
                        Text(msg)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(bannerIsError ? Color(hex: "#B91C1C") : FrigyBrand.primaryDark)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(bannerIsError ? Color(hex: "#FEF2F2") : FrigyBrand.selectedBg)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    ForEach(weekPlan) { day in
                        dayCard(day)
                    }

                    planTemplatesSection
                        .padding(.top, 8)

                    Spacer().frame(height: 100)
                }
                .padding(.horizontal, 12)
                .padding(.top, 16)
                .frame(maxWidth: 700)
                .frame(maxWidth: .infinity)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .bottom) {
            if let toast = toastMessage {
                Text(toast)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Capsule().fill(Color(hex: "#1A2B22").opacity(0.92)))
                    .shadow(radius: 8, y: 4)
                    .padding(.bottom, 100)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: toastMessage)
        .overlay {
            if isGenerating {
                PlanGeneratingOverlay()
                    .transition(.opacity.animation(.easeInOut(duration: 0.25)))
            }
        }
        .sheet(item: $selectedTemplate) { tpl in
            FoodTemplateDetailSheet(template: tpl, category: .lunch) { }
        }
        .sheet(isPresented: $showFridgeScan) {
            FridgeScanSheet(weekMeals: weekPlan.flatMap { $0.meals })
        }
    }

    // MARK: - Templates section

    private var planTemplatesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Mahlzeit-Vorlagen")
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(FrigyBrand.text)
            Text("Tippe auf eine Vorlage, um das Rezept und Nährwerte zu sehen.")
                .font(.system(size: 12))
                .foregroundColor(FrigyBrand.textMuted)

            LazyVGrid(
                columns: [GridItem(.flexible()), GridItem(.flexible())],
                spacing: 10
            ) {
                ForEach(FoodTemplate.all) { tpl in
                    Button { selectedTemplate = tpl } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(tpl.emoji)
                                .font(.system(size: 24))
                            Text(tpl.name)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(FrigyBrand.text)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                            Text("\(tpl.calories) kcal")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(FrigyBrand.primary.opacity(0.9))
                            Text("P \(tpl.protein)g · K \(tpl.carbs)g · F \(tpl.fat)g")
                                .font(.system(size: 9))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color(UIColor.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12)
                            .stroke(FrigyBrand.primary.opacity(0.25), lineWidth: 1))
                        .shadow(color: .black.opacity(0.03), radius: 4, y: 2)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
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
                        .foregroundColor(FrigyBrand.text)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)

                Text("Frigy")
                    .font(.system(size: 19, weight: .black))
                    .tracking(-0.8)
                    .foregroundColor(FrigyBrand.text)

                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)

            Divider().overlay(FrigyBrand.primary.opacity(0.15))
        }
        .background(Color(UIColor.systemBackground).opacity(0.92))
    }

    // MARK: - Action buttons row

    private var generateButton: some View {
        HStack(spacing: 10) {
            // Wochenplan erstellen
            Button {
                Task { await generatePlan() }
            } label: {
                HStack(spacing: 7) {
                    if isGenerating {
                        ProgressView().tint(Color(hex: "#082013")).scaleEffect(0.85)
                        Text("Wird erstellt…")
                    } else {
                        Image(systemName: "sparkles")
                        Text("Wochenplan erstellen")
                    }
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(Color(hex: "#082013"))
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(isGenerating ? AnyShapeStyle(FrigyBrand.buttonDisabledGradient) : AnyShapeStyle(FrigyBrand.buttonGradient))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(.plain)
            .disabled(isGenerating)
            .opacity(isGenerating ? 0.7 : 1)

            // Zutaten erkennen
            Button { showFridgeScan = true } label: {
                HStack(spacing: 7) {
                    Image(systemName: "camera.viewfinder")
                    Text("Zutaten erkennen")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDark)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(FrigyBrand.primaryDark.opacity(0.1))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(FrigyBrand.primaryDark.opacity(0.4), lineWidth: 1.5)
                        )
                )
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Day card (web Card: weekday header + stacked meals)

    private func dayCard(_ day: DayPlan) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(day.weekday)
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(FrigyBrand.primary)

            if day.meals.isEmpty {
                Text("Noch kein Plan für diesen Tag")
                    .font(.system(size: 13))
                    .foregroundColor(FrigyBrand.textMuted)
                    .padding(.vertical, 8)
            } else {
                ForEach(day.meals) { meal in
                    mealTile(meal)
                }
                if day.isToday && healthKit.activeCaloriesToday > 0 {
                    HStack(spacing: 6) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#F97316"))
                        Text("+\(healthKit.activeCaloriesToday) kcal Aktivitätsbonus")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.horizontal, 4)
                    .padding(.top, 4)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(UIColor.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(FrigyBrand.primary.opacity(day.isToday ? 0.35 : 0.2), lineWidth: day.isToday ? 2 : 1)
        )
        .shadow(color: .black.opacity(0.03), radius: 6, y: 2)
    }

    // MARK: - Meal tile (web inner meal: type+kcal, name, P/K/F, Gegessen)

    private func mealTile(_ meal: PlannedMeal) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(meal.category.rawValue)
                    .font(.system(size: 11))
                    .foregroundColor(FrigyBrand.textMuted)
                    .lineLimit(1)
                Spacer()
                Text("\(meal.calories)")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(FrigyBrand.primary)
            }

            Text(meal.name)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
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
                .foregroundColor(eatenMealIDs.contains(meal.id) ? FrigyBrand.primaryDark : FrigyBrand.text)
                .frame(maxWidth: .infinity)
                .frame(height: 32)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(eatenMealIDs.contains(meal.id) ? FrigyBrand.primary.opacity(0.15) : Color.clear)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(FrigyBrand.primary.opacity(0.3), lineWidth: 1))
                )
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.top, 2)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(FrigyBrand.selectedBg.opacity(0.18)))
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
            NotificationCenter.default.post(name: .trackerDidAddEntry, object: nil)
            toastMessage = "✓ \(meal.name) geloggt"
            Task {
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                toastMessage = nil
            }
        } else {
            toastMessage = "Fehler beim Speichern – bitte anmelden"
            Task {
                try? await Task.sleep(nanoseconds: 2_500_000_000)
                toastMessage = nil
            }
        }
    }

    private func generatePlan() async {
        isGenerating = true
        bannerMessage = nil
        let targets = await TrackerDataService.shared.loadTargets()
        let profile = Self.loadProfileDraft()
        if let generatedDays = await TrackerDataService.shared.generateMealPlan(
            calories: targets.calories,
            protein: targets.protein,
            carbs: targets.carbs,
            fat: targets.fat,
            dietaryPreferences: profile?.dietaryPreferences ?? [],
            allergies: profile?.allergies ?? [],
            healthGoals: profile?.healthGoals ?? []
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
            savePlan()
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

// MARK: - Plan generating overlay

private struct PlanGeneratingOverlay: View {
    @State private var rotation: Double = 0
    private let tips = [
        "Deine Ernährungsziele werden berücksichtigt…",
        "Proteinreiche Mahlzeiten werden ausgewählt…",
        "Mahlzeiten werden auf die Woche verteilt…",
        "Nährwerte werden berechnet…",
    ]
    @State private var tipIndex: Int = 0

    var body: some View {
        ZStack {
            Color.black.opacity(0.45)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                ZStack {
                    Circle()
                        .stroke(FrigyBrand.primary.opacity(0.2), lineWidth: 4)
                        .frame(width: 72, height: 72)
                    Circle()
                        .trim(from: 0, to: 0.7)
                        .stroke(
                            AngularGradient(
                                colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 4, lineCap: .round)
                        )
                        .frame(width: 72, height: 72)
                        .rotationEffect(.degrees(rotation))
                        .onAppear {
                            withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                                rotation = 360
                            }
                        }
                    Image(systemName: "sparkles")
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundColor(FrigyBrand.primary)
                }

                VStack(spacing: 8) {
                    Text("Wochenplan wird erstellt")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                    Text(tips[tipIndex])
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.75))
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 260)
                        .id(tipIndex)
                        .transition(.opacity.animation(.easeInOut(duration: 0.5)))
                }
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .stroke(FrigyBrand.primary.opacity(0.25), lineWidth: 1)
                    )
            )
            .padding(.horizontal, 40)
        }
        .task {
            // Rotates the tip text every 2.5s. `.task` is auto-cancelled when the
            // overlay disappears, so no manual Timer/invalidation is needed.
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 2_500_000_000)
                guard !Task.isCancelled else { return }
                withAnimation {
                    tipIndex = (tipIndex + 1) % tips.count
                }
            }
        }
    }
}

// MARK: - Notification names

extension Notification.Name {
    static let trackerDidAddEntry = Notification.Name("frigy.trackerDidAddEntry")
}

// MARK: - Demo data

private func makeDemoWeek() -> [DayPlan] {
    let calendar = Calendar.current
    let today = Date()
    let weekday = calendar.component(.weekday, from: today)
    let startOfWeek = calendar.date(byAdding: .day, value: -(weekday - 2), to: today) ?? today

    let dayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    let shortNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

    let weekMeals: [[PlannedMeal]] = [
        // Montag
        [
            PlannedMeal(category: .breakfast, name: "Haferflocken mit Beeren", calories: 320, protein: 12, carbs: 52, fat: 8, duration: 5, tags: ["Vegan"]),
            PlannedMeal(category: .lunch, name: "Hähnchen-Quinoa Bowl", calories: 520, protein: 42, carbs: 48, fat: 16, duration: 20, tags: ["High Protein"]),
            PlannedMeal(category: .snack, name: "Griechischer Joghurt", calories: 130, protein: 15, carbs: 9, fat: 4, duration: 0, tags: ["Proteinreich"]),
            PlannedMeal(category: .dinner, name: "Lachs mit Ofengemüse", calories: 480, protein: 38, carbs: 22, fat: 26, duration: 25, tags: ["Omega-3"]),
        ],
        // Dienstag
        [
            PlannedMeal(category: .breakfast, name: "Rührei mit Vollkornbrot", calories: 290, protein: 18, carbs: 28, fat: 12, duration: 10, tags: ["Low Carb"]),
            PlannedMeal(category: .lunch, name: "Linsensuppe mit Brot", calories: 410, protein: 22, carbs: 58, fat: 8, duration: 15, tags: ["Vegan"]),
            PlannedMeal(category: .snack, name: "Apfel mit Mandelbutter", calories: 180, protein: 4, carbs: 24, fat: 9, duration: 0, tags: ["Vegan"]),
            PlannedMeal(category: .dinner, name: "Hähnchen mit Süßkartoffeln", calories: 510, protein: 40, carbs: 44, fat: 14, duration: 30, tags: ["High Protein"]),
        ],
        // Mittwoch
        [
            PlannedMeal(category: .breakfast, name: "Smoothie Bowl mit Granola", calories: 340, protein: 10, carbs: 56, fat: 10, duration: 5, tags: ["Vegan"]),
            PlannedMeal(category: .lunch, name: "Caesar Salad mit Hähnchen", calories: 420, protein: 34, carbs: 18, fat: 22, duration: 10, tags: ["Low Carb"]),
            PlannedMeal(category: .snack, name: "Proteinriegel", calories: 200, protein: 20, carbs: 22, fat: 6, duration: 0, tags: ["High Protein"]),
            PlannedMeal(category: .dinner, name: "Pasta mit Tomatensoße", calories: 560, protein: 18, carbs: 82, fat: 12, duration: 20, tags: []),
        ],
        // Donnerstag
        [
            PlannedMeal(category: .breakfast, name: "Avocado-Toast mit Ei", calories: 370, protein: 16, carbs: 32, fat: 20, duration: 10, tags: []),
            PlannedMeal(category: .lunch, name: "Buddha Bowl mit Tofu", calories: 450, protein: 24, carbs: 50, fat: 18, duration: 15, tags: ["Vegan"]),
            PlannedMeal(category: .snack, name: "Hüttenkäse mit Beeren", calories: 140, protein: 16, carbs: 12, fat: 3, duration: 0, tags: ["Low Fat"]),
            PlannedMeal(category: .dinner, name: "Forelle mit Quinoa", calories: 470, protein: 36, carbs: 38, fat: 16, duration: 25, tags: ["Omega-3"]),
        ],
        // Freitag
        [
            PlannedMeal(category: .breakfast, name: "Pancakes mit Ahornsirup", calories: 380, protein: 10, carbs: 62, fat: 12, duration: 15, tags: []),
            PlannedMeal(category: .lunch, name: "Chicken Wrap mit Salat", calories: 490, protein: 36, carbs: 46, fat: 16, duration: 10, tags: ["High Protein"]),
            PlannedMeal(category: .snack, name: "Hummus mit Gemüsesticks", calories: 150, protein: 6, carbs: 18, fat: 6, duration: 0, tags: ["Vegan"]),
            PlannedMeal(category: .dinner, name: "Lachs-Teriyaki mit Reis", calories: 540, protein: 38, carbs: 52, fat: 18, duration: 20, tags: ["Omega-3"]),
        ],
    ]

    return (0..<7).map { i in
        let date = calendar.date(byAdding: .day, value: i, to: startOfWeek) ?? today
        let isToday = calendar.isDateInToday(date)
        let meals: [PlannedMeal] = i < weekMeals.count ? weekMeals[i] : []
        return DayPlan(weekday: dayNames[i], shortDay: shortNames[i], isToday: isToday, meals: meals)
    }
}

// MARK: - Fridge Scan Sheet

/// Scan one OR many fridge photos. Each photo is analyzed in sequence, the
/// detected ingredients are merged (deduped), and what the week plan still needs
/// is offered for the shopping list.
struct FridgeScanSheet: View {
    @Environment(\.dismiss) private var dismiss
    let weekMeals: [PlannedMeal]

    @State private var images: [UIImage] = []
    @State private var cameraImage: UIImage?
    @State private var pickerItems: [PhotosPickerItem] = []
    @State private var showCamera = false

    @State private var isAnalyzing = false
    @State private var analyzeIndex = 0          // 1-based progress while analyzing
    @State private var hasAnalyzed = false
    @State private var detectedItems: [String] = []
    @State private var missingItems: [String] = []
    @State private var analysisError: String?
    @State private var addedToListCount: Int?

    // Keywords extracted from meal plan meal names
    private var requiredIngredients: [String] {
        let stopWords = Set(["mit", "und", "auf", "von", "zum", "der", "die", "das", "für",
                             "nach", "bowl", "salad", "aus", "beim", "oder"])
        let words = weekMeals.flatMap {
            $0.name.components(separatedBy: CharacterSet(charactersIn: " -"))
        }
        return Array(Set(
            words.filter { $0.count > 3 && !stopWords.contains($0.lowercased()) }
        )).sorted()
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    imagesStrip
                    if images.isEmpty { introText }
                    actionButtons
                    if !images.isEmpty && !isAnalyzing { analyzeButton }
                    if isAnalyzing { progressView }
                    resultsSection
                    Spacer().frame(height: 40)
                }
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .sheet(isPresented: $showCamera) {
            ImagePickerView(image: $cameraImage, sourceType: .camera)
        }
        .onChange(of: cameraImage) { _, new in
            guard let new else { return }
            images.append(new)
            resetResults()
            cameraImage = nil
        }
        .onChange(of: pickerItems) { _, items in
            guard !items.isEmpty else { return }
            Task { await loadPickerItems(items) }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Button("Schließen") { dismiss() }
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(FrigyBrand.primaryDark)
            Spacer()
            Text("Kühlschrank scannen")
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(FrigyBrand.text)
            Spacer()
            Color.clear.frame(width: 80, height: 1)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }

    private var introText: some View {
        Text("Mache ein oder mehrere Fotos deines Kühlschranks oder wähle sie aus der Galerie. Die KI erkennt automatisch alle vorhandenen Zutaten und zeigt, was für deinen Wochenplan noch fehlt.")
            .font(.system(size: 13))
            .foregroundColor(FrigyBrand.textMuted)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 24)
    }

    // MARK: - Images strip (thumbnails + remove)

    @ViewBuilder private var imagesStrip: some View {
        if images.isEmpty {
            ZStack {
                RoundedRectangle(cornerRadius: 18)
                    .fill(FrigyBrand.bg)
                    .frame(height: 160)
                VStack(spacing: 10) {
                    Image(systemName: "refrigerator.fill")
                        .font(.system(size: 44))
                        .foregroundColor(FrigyBrand.primary)
                    Text("Noch keine Fotos")
                        .font(.system(size: 14))
                        .foregroundColor(FrigyBrand.textMuted)
                }
            }
            .padding(.horizontal, 20)
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Array(images.enumerated()), id: \.offset) { idx, img in
                        thumbnail(img, index: idx)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }

    private func thumbnail(_ img: UIImage, index: Int) -> some View {
        Image(uiImage: img)
            .resizable()
            .scaledToFill()
            .frame(width: 110, height: 140)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(alignment: .topTrailing) {
                Button {
                    images.remove(at: index)
                    resetResults()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.white, Color.black.opacity(0.5))
                        .padding(5)
                }
                .buttonStyle(.plain)
            }
    }

    // MARK: - Camera / Gallery

    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button { showCamera = true } label: {
                Label(images.isEmpty ? "Kamera" : "Foto hinzufügen", systemImage: "camera.fill")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: "#082013"))
                    .frame(maxWidth: .infinity)
                    .frame(height: 46)
                    .background(
                        LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 13))
            }
            .buttonStyle(.plain)

            PhotosPicker(selection: $pickerItems, maxSelectionCount: 0, matching: .images) {
                Label("Galerie", systemImage: "photo.on.rectangle")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
                    .frame(maxWidth: .infinity)
                    .frame(height: 46)
                    .background(
                        RoundedRectangle(cornerRadius: 13)
                            .stroke(FrigyBrand.primaryDark, lineWidth: 1.5)
                    )
            }
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Analyze button

    private var analyzeButton: some View {
        let title = hasAnalyzed
            ? "Erneut analysieren (\(images.count))"
            : "\(images.count) Foto\(images.count == 1 ? "" : "s") analysieren"
        return Button {
            Task { await analyzeAll() }
        } label: {
            HStack(spacing: 7) {
                Image(systemName: "sparkles")
                Text(title)
            }
            .font(.system(size: 15, weight: .bold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(LinearGradient(
                        colors: [FrigyBrand.primaryDark, FrigyBrand.primaryDeep],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 20)
    }

    private var progressView: some View {
        VStack(spacing: 8) {
            ProgressView().scaleEffect(1.3)
            Text("Bild \(analyzeIndex) von \(images.count) wird analysiert…")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .padding(.vertical, 24)
    }

    // MARK: - Results

    @ViewBuilder private var resultsSection: some View {
        if !isAnalyzing {
            if !detectedItems.isEmpty { detectedCard }
            if !missingItems.isEmpty { missingCard }
            if hasAnalyzed && detectedItems.isEmpty && missingItems.isEmpty && analysisError == nil {
                Text("Es wurden keine Zutaten erkannt. Versuche ein deutlicheres Foto.")
                    .font(.system(size: 13))
                    .foregroundColor(FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
            if let error = analysisError {
                Text(error)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(Color(hex: "#B91C1C"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
    }

    private var detectedCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Vorhanden (\(detectedItems.count))", systemImage: "checkmark.circle.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(FrigyBrand.primaryDark)
            ForEach(detectedItems, id: \.self) { item in
                ingredientRow(item, color: FrigyBrand.primaryDark)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(FrigyBrand.selectedBg)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 20)
    }

    private var missingCard: some View {
        let red = Color(hex: "#EF4444")
        return VStack(alignment: .leading, spacing: 10) {
            Label("Fehlend – kaufen (\(missingItems.count))", systemImage: "cart.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(red)
            ForEach(missingItems, id: \.self) { item in
                ingredientRow(item, color: red)
            }
            addToListButton
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#FEE2E2"))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 20)
    }

    private func ingredientRow(_ item: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(item.prefix(1).uppercased() + item.dropFirst())
                .font(.system(size: 14))
                .foregroundColor(FrigyBrand.text)
        }
    }

    private var addToListButton: some View {
        let done = addedToListCount != nil
        let bg: Color = done ? FrigyBrand.primaryDark : Color(hex: "#EF4444")
        let label = done ? "\(addedToListCount ?? 0) hinzugefügt" : "Einkaufsliste erstellen"
        return Button {
            let added = ShoppingListStore.add(names: missingItems, category: .other)
            addedToListCount = added
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { dismiss() }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: done ? "checkmark" : "cart.badge.plus")
                Text(label)
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 44)
            .background(RoundedRectangle(cornerRadius: 12).fill(bg))
        }
        .buttonStyle(.plain)
        .disabled(done)
        .padding(.top, 4)
    }

    // MARK: - Logic

    private func resetResults() {
        hasAnalyzed = false
        detectedItems = []
        missingItems = []
        analysisError = nil
        addedToListCount = nil
    }

    private func loadPickerItems(_ items: [PhotosPickerItem]) async {
        var loaded: [UIImage] = []
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let img = UIImage(data: data) {
                loaded.append(img)
            }
        }
        if !loaded.isEmpty {
            images.append(contentsOf: loaded)
            resetResults()
        }
        pickerItems = []
    }

    private func analyzeAll() async {
        guard !images.isEmpty else { return }
        isAnalyzing = true
        analysisError = nil
        detectedItems = []
        missingItems = []
        addedToListCount = nil
        analyzeIndex = 0

        var merged = Set<String>()
        var lastError: String?

        for (idx, image) in images.enumerated() {
            analyzeIndex = idx + 1
            guard let jpeg = image.jpegData(compressionQuality: 0.6) else { continue }
            let dataURL = "data:image/jpeg;base64,\(jpeg.base64EncodedString())"
            let result = await TrackerDataService.shared.analyzeIngredients(imageDataURL: dataURL)
            if let err = result.errorMessage {
                lastError = err
            }
            for ing in result.ingredients { merged.insert(ing.lowercased()) }
            // Progressive reveal so the user sees ingredients accumulate.
            detectedItems = merged.sorted()
        }

        isAnalyzing = false
        hasAnalyzed = true
        detectedItems = merged.sorted()

        if detectedItems.isEmpty {
            // Only surface an error if a real failure happened; otherwise the
            // "no ingredients detected" hint in resultsSection covers it.
            analysisError = lastError
            return
        }

        let req = requiredIngredients.map { $0.lowercased() }
        missingItems = req.filter { reqWord in
            !detectedItems.contains { det in
                det.contains(reqWord) || reqWord.contains(det)
            }
        }
    }
}
