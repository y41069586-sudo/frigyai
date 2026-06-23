import SwiftUI

// MARK: - Model

struct LoggedMeal: Identifiable {
    var id: UUID
    var entryId: String   // Supabase food_entries.id — used for deletion
    var name: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var time: String
    var category: MealCategory

    init(entryId: String = "", name: String, calories: Int, protein: Int,
         carbs: Int, fat: Int, time: String = "", category: MealCategory) {
        self.id = UUID()
        self.entryId = entryId
        self.name = name
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.time = time
        self.category = category
    }
}

enum MealCategory: String, CaseIterable {
    case breakfast = "Frühstück"
    case lunch     = "Mittagessen"
    case dinner    = "Abendessen"
    case snack     = "Snack"

    var icon: String {
        switch self {
        case .breakfast: "sunrise.fill"
        case .lunch:     "sun.max.fill"
        case .dinner:    "moon.stars.fill"
        case .snack:     "leaf.fill"
        }
    }
}

// MARK: - Main View

struct HomeDashboardView: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator
    @Environment(AppRouter.self) private var router

    @State private var meals: [LoggedMeal] = []
    // Macro targets loaded from Supabase (user_tracker_settings); default until loaded.
    @State private var targets = MacroTargets.default
    @State private var waterGlasses: Int = 0
    private let waterGoal = 8
    private let waterKey = "frigy.water.glasses"
    private let waterDateKey = "frigy.water.date"

    private var targetCalories: Int { targets.calories }
    private var targetProtein:  Int { targets.protein }
    private var targetCarbs:    Int { targets.carbs }
    private var targetFat:      Int { targets.fat }

    private func reload() async {
        let result = await TrackerDataService.shared.loadToday()
        meals = result.meals
        targets = result.targets
    }

    private func deleteMeal(_ meal: LoggedMeal) {
        guard !meal.entryId.isEmpty else { return }
        withAnimation { meals.removeAll { $0.id == meal.id } }
        Task {
            await TrackerDataService.shared.deleteFoodEntry(id: meal.entryId)
            await reload()
        }
    }

    private var consumed: (kcal: Int, protein: Int, carbs: Int, fat: Int) {
        (
            meals.reduce(0) { $0 + $1.calories },
            meals.reduce(0) { $0 + $1.protein },
            meals.reduce(0) { $0 + $1.carbs },
            meals.reduce(0) { $0 + $1.fat }
        )
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12:  return "Guten Morgen"
        case 12..<17: return "Guten Tag"
        case 17..<22: return "Guten Abend"
        default:      return "Hallo"
        }
    }

    private var dateText: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EEEE, d. MMMM"
        return f.string(from: Date())
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                // Header
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(greeting)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(Color(hex: "#6B7280"))
                        Text("Frigy")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text(dateText)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(Color(hex: "#9CA3AF"))
                    }
                    Spacer()
                    LiquidGlassCircleButton(systemImage: "person.fill", size: 44, iconSize: 18) {
                        tabCoordinator.pushHome(.profile)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)

                // Calorie ring card
                CalorieRingCard(
                    consumed: consumed.kcal,
                    target: targetCalories,
                    protein: (consumed: consumed.protein, target: targetProtein),
                    carbs: (consumed: consumed.carbs, target: targetCarbs),
                    fat: (consumed: consumed.fat, target: targetFat)
                )
                .padding(.horizontal, 20)

                // Quick actions
                HStack(spacing: 12) {
                    quickAction("Mahlzeit tracken", icon: "plus.circle.fill", color: Color(hex: "#75FBB2")) {
                        tabCoordinator.openTracker()
                    }
                    quickAction("Gewicht", icon: "scalemass.fill", color: Color(hex: "#A5B4FC")) {
                        tabCoordinator.pushHome(.weightProgress)
                    }
                    quickAction("KI-Coach", icon: "bubble.left.and.bubble.right.fill", color: Color(hex: "#FCA5A5")) {
                        tabCoordinator.pushHome(.chatbot)
                    }
                }
                .padding(.horizontal, 20)

                // Meals today
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Heute")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Spacer()
                        Button {
                            tabCoordinator.openTracker()
                        } label: {
                            Label("Hinzufügen", systemImage: "plus")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(FrigyBrand.primaryDark)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(
                                    Capsule()
                                        .fill(.ultraThinMaterial)
                                        .overlay(Capsule().stroke(FrigyBrand.primary.opacity(0.5), lineWidth: 1.5))
                                )
                        }
                        .buttonStyle(.plain)
                    }

                    if meals.isEmpty {
                        EmptyMealsCard {
                            tabCoordinator.openTracker()
                        }
                    } else {
                        ForEach(MealCategory.allCases, id: \.self) { category in
                            let categoryMeals = meals.filter { $0.category == category }
                            if !categoryMeals.isEmpty {
                                MealCategorySection(
                                    category: category,
                                    meals: categoryMeals,
                                    onDelete: deleteMeal
                                )
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)

                waterWidget
                    .padding(.horizontal, 20)

                Spacer().frame(height: 100)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await reload(); loadWater() }
        .refreshable { await reload() }
        .onChange(of: tabCoordinator.showTrackerSheet) { _, isShowing in
            if !isShowing { Task { await reload() } }
        }
    }

    private func loadWater() {
        let today = Calendar.current.startOfDay(for: Date()).timeIntervalSince1970
        let storedDate = UserDefaults.standard.double(forKey: waterDateKey)
        if storedDate == today {
            waterGlasses = UserDefaults.standard.integer(forKey: waterKey)
        } else {
            waterGlasses = 0
            UserDefaults.standard.set(today, forKey: waterDateKey)
            UserDefaults.standard.set(0, forKey: waterKey)
        }
    }

    private func setWater(_ v: Int) {
        waterGlasses = max(0, min(waterGoal, v))
        UserDefaults.standard.set(waterGlasses, forKey: waterKey)
    }

    private var waterWidget: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(hex: "#BFDBFE").opacity(0.5))
                        .frame(width: 36, height: 36)
                    Image(systemName: "drop.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(hex: "#3B82F6"))
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("WASSER")
                        .font(.system(size: 9, weight: .bold)).tracking(1.5)
                        .foregroundColor(FrigyBrand.textMuted)
                    Text("\(waterGlasses) / \(waterGoal) Gläser")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                }
                Spacer()
                HStack(spacing: 6) {
                    Button { setWater(waterGlasses - 1) } label: {
                        Image(systemName: "minus")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(waterGlasses > 0 ? Color(hex: "#3B82F6") : Color(hex: "#D1D5DB"))
                            .frame(width: 32, height: 32)
                            .background(Circle().fill(Color(hex: "#EFF6FF")))
                    }
                    .buttonStyle(.plain).disabled(waterGlasses == 0)

                    Button { setWater(waterGlasses + 1) } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(waterGlasses < waterGoal ? .white : Color(hex: "#D1D5DB"))
                            .frame(width: 32, height: 32)
                            .background(Circle().fill(waterGlasses < waterGoal ? Color(hex: "#3B82F6") : Color(hex: "#E0F2FE")))
                    }
                    .buttonStyle(.plain).disabled(waterGlasses >= waterGoal)
                }
            }

            HStack(spacing: 6) {
                ForEach(0..<waterGoal, id: \.self) { i in
                    Image(systemName: i < waterGlasses ? "drop.fill" : "drop")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(i < waterGlasses ? Color(hex: "#3B82F6") : Color(hex: "#BFDBFE"))
                        .frame(maxWidth: .infinity)
                        .animation(.spring(duration: 0.3), value: waterGlasses)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(hex: "#BFDBFE").opacity(0.4)).frame(height: 6)
                    Capsule()
                        .fill(LinearGradient(
                            colors: [Color(hex: "#93C5FD"), Color(hex: "#3B82F6")],
                            startPoint: .leading, endPoint: .trailing
                        ))
                        .frame(width: max(6, geo.size.width * Double(waterGlasses) / Double(waterGoal)), height: 6)
                        .animation(.spring(duration: 0.4), value: waterGlasses)
                }
            }
            .frame(height: 6)

            if waterGlasses >= waterGoal {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill").foregroundColor(Color(hex: "#3B82F6"))
                    Text("Tagesziel erreicht! Super!")
                        .font(.system(size: 13, weight: .semibold)).foregroundColor(Color(hex: "#3B82F6"))
                }
            } else {
                Text("\(waterGoal - waterGlasses) Gläser bis zum Tagesziel")
                    .font(.system(size: 12, weight: .medium)).foregroundColor(FrigyBrand.textMuted)
            }
        }
        .padding(16)
        .frigyCard(cornerRadius: 22)
    }

    private func quickAction(_ label: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(.ultraThinMaterial)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(color.opacity(0.35), lineWidth: 1)
                        )
                        .shadow(color: color.opacity(0.15), radius: 6, y: 3)
                        .frame(width: 52, height: 52)
                    Image(systemName: icon)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(color == Color(hex: "#75FBB2") ? FrigyBrand.primaryDark : color.opacity(0.9))
                }
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(hex: "#6B7280"))
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Calorie Ring Card

struct CalorieRingCard: View {
    let consumed: Int
    let target: Int
    let protein: (consumed: Int, target: Int)
    let carbs: (consumed: Int, target: Int)
    let fat: (consumed: Int, target: Int)

    private var fraction: Double {
        target > 0 ? min(1, Double(consumed) / Double(target)) : 0
    }

    private var remaining: Int { max(0, target - consumed) }

    var body: some View {
        HStack(spacing: 20) {
            // Ring
            ZStack {
                Circle()
                    .stroke(Color(hex: "#BCFDDC").opacity(0.5), lineWidth: 10)
                    .frame(width: 100, height: 100)
                Circle()
                    .trim(from: 0, to: fraction)
                    .stroke(
                        LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")], startPoint: .topLeading, endPoint: .bottomTrailing),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .frame(width: 100, height: 100)
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(duration: 0.6), value: fraction)

                VStack(spacing: 1) {
                    Text("\(consumed)")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(Color(hex: "#1F2937"))
                    Text("kcal")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(hex: "#6B7280"))
                }
            }

            // Stats
            VStack(alignment: .leading, spacing: 10) {
                statRow("Ziel", value: "\(target) kcal", color: Color(hex: "#9CA3AF"))
                statRow("Verbraucht", value: "\(consumed) kcal", color: Color(hex: "#39D47F"))
                statRow("Verbleibend", value: "\(remaining) kcal", color: Color(hex: "#6B7280"))

                HStack(spacing: 8) {
                    macroChip("P", value: protein.consumed, target: protein.target, color: Color(hex: "#F87171"))
                    macroChip("K", value: carbs.consumed, target: carbs.target, color: Color(hex: "#FBBF24"))
                    macroChip("F", value: fat.consumed, target: fat.target, color: Color(hex: "#60A5FA"))
                }
            }
        }
        .padding(18)
        .frigyCard(cornerRadius: 22)
    }

    private func statRow(_ label: String, value: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(Color(hex: "#9CA3AF"))
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(color)
        }
    }

    private func macroChip(_ letter: String, value: Int, target: Int, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(letter)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(color)
            Text("\(value)g")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(hex: "#1F2937"))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 5)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Empty state

struct EmptyMealsCard: View {
    let onAdd: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "fork.knife.circle")
                .font(.system(size: 40))
                .foregroundColor(Color(hex: "#BCFDDC"))

            VStack(spacing: 4) {
                Text("Noch keine Mahlzeiten")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(hex: "#1F2937"))
                Text("Tippe auf + um deine erste Mahlzeit hinzuzufügen.")
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#6B7280"))
                    .multilineTextAlignment(.center)
            }

            Button(action: onAdd) {
                Label("Mahlzeit hinzufügen", systemImage: "plus")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(
                        Capsule()
                            .fill(LinearGradient(
                                colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ))
                            .overlay(Capsule().stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                    )
                    .shadow(color: Color(hex: "#39D47F").opacity(0.28), radius: 10, y: 5)
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .frigyCard(cornerRadius: 20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color(hex: "#BCFDDC").opacity(0.6), lineWidth: 1))
    }
}

// MARK: - Meal category section

struct MealCategorySection: View {
    let category: MealCategory
    let meals: [LoggedMeal]
    var onDelete: ((LoggedMeal) -> Void)? = nil

    private var totalCal: Int { meals.reduce(0) { $0 + $1.calories } }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label(category.rawValue, systemImage: category.icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: "#6B7280"))
                Spacer()
                Text("\(totalCal) kcal")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(Color(hex: "#9CA3AF"))
            }

            VStack(spacing: 6) {
                ForEach(meals) { meal in
                    MealRow(meal: meal, onDelete: onDelete != nil ? { onDelete?(meal) } : nil)
                }
            }
        }
    }
}

struct MealRow: View {
    let meal: LoggedMeal
    var onDelete: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: "#F2FFF8"))
                    .frame(width: 40, height: 40)
                Image(systemName: meal.category.icon)
                    .font(.system(size: 16))
                    .foregroundColor(Color(hex: "#39D47F"))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(meal.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: "#1F2937"))
                if meal.protein > 0 || meal.carbs > 0 || meal.fat > 0 {
                    Text("P \(meal.protein)g · K \(meal.carbs)g · F \(meal.fat)g")
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                }
            }

            Spacer()

            Text("\(meal.calories) kcal")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(hex: "#6B7280"))
        }
        .padding(12)
        .frigyCard(cornerRadius: 14)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            if let onDelete {
                Button(role: .destructive, action: onDelete) {
                    Label("Löschen", systemImage: "trash")
                }
            }
        }
    }
}
