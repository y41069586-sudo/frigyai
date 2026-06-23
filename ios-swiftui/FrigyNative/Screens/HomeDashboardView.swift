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

    var emoji: String {
        switch self {
        case .breakfast: "🍳"
        case .lunch:     "🥗"
        case .dinner:    "🍝"
        case .snack:     "🍎"
        }
    }

    var shortLabel: String {
        switch self {
        case .breakfast: "Frühstück"
        case .lunch:     "Mittag"
        case .dinner:    "Abend"
        case .snack:     "Snack"
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

    private var consumed: (kcal: Int, protein: Int, carbs: Int, fat: Int) {
        (
            meals.reduce(0) { $0 + $1.calories },
            meals.reduce(0) { $0 + $1.protein },
            meals.reduce(0) { $0 + $1.carbs },
            meals.reduce(0) { $0 + $1.fat }
        )
    }

    private var remaining: Int { max(0, targets.calories - consumed.kcal) }
    private var caloriePct: Int {
        targets.calories > 0 ? min(100, Int(Double(consumed.kcal) / Double(targets.calories) * 100)) : 0
    }

    private var loggedCategories: Set<MealCategory> { Set(meals.map(\.category)) }

    private var weekdayText: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EEEE"
        return f.string(from: Date())
    }

    private func reload() async {
        let result = await TrackerDataService.shared.loadToday()
        meals = result.meals
        targets = result.targets
    }

    private func fmt(_ value: Int) -> String {
        value.formatted(.number.grouping(.automatic).locale(Locale(identifier: "de_DE")))
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 22) {
                header
                calorieCard
                mealSlotsSection
                weeklyPlanCard
                Spacer().frame(height: 110)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await reload() }
        .refreshable { await reload() }
        .onChange(of: tabCoordinator.showTrackerSheet) { _, isShowing in
            if !isShowing { Task { await reload() } }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 0) {
            Text("Frigy")
                .font(.system(size: 26, weight: .black, design: .rounded))
                .foregroundColor(FrigyBrand.primaryDark)

            Spacer()

            HStack(spacing: 16) {
                headerIcon("scalemass.fill", color: FrigyBrand.primaryDark) {
                    tabCoordinator.pushHome(.weightProgress)
                }
                Button { tabCoordinator.pushHome(.badges) } label: {
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(Color(hex: "#FB923C"))
                        Text("\(loggedCategories.isEmpty ? 0 : 1)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(hex: "#1F2937"))
                    }
                }
                .buttonStyle(.plain)
                headerIcon("bubble.left.and.bubble.right.fill", color: FrigyBrand.primaryDark) {
                    tabCoordinator.pushHome(.chatbot)
                }
                headerIcon("gearshape.fill", color: Color(hex: "#9CA3AF")) {
                    tabCoordinator.pushHome(.profile)
                }
            }
        }
    }

    private func headerIcon(_ icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 19, weight: .semibold))
                .foregroundColor(color)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Calorie card

    private var calorieCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                Text("HEUTE")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(1.5)
                    .foregroundColor(FrigyBrand.primaryDark.opacity(0.75))
                Spacer()
                LiquidGlassCircleButton(systemImage: "pencil", size: 34, iconSize: 14) {
                    tabCoordinator.openTracker()
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(fmt(remaining))
                        .font(.system(size: 44, weight: .black, design: .rounded))
                        .foregroundColor(Color(hex: "#1F2937"))
                    Text("kcal")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundColor(Color(hex: "#1F2937"))
                }
                Text("übrig von \(fmt(targets.calories)) kcal")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color(hex: "#9CA3AF"))
            }

            // Progress bar
            VStack(spacing: 8) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(FrigyBrand.primary.opacity(0.18)).frame(height: 8)
                        Capsule()
                            .fill(LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                                 startPoint: .leading, endPoint: .trailing))
                            .frame(width: max(8, geo.size.width * Double(caloriePct) / 100), height: 8)
                            .animation(.spring(duration: 0.6), value: caloriePct)
                    }
                }
                .frame(height: 8)

                HStack {
                    Text("\(fmt(consumed.kcal)) Gegessen")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                    Spacer()
                    Text("\(caloriePct)%")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }
            }

            // Macro cards
            HStack(spacing: 10) {
                macroCard("Protein", icon: "fork.knife", eaten: consumed.protein, target: targets.protein, color: Color(hex: "#FB7185"))
                macroCard("Carbs", icon: "leaf.fill", eaten: consumed.carbs, target: targets.carbs, color: Color(hex: "#FBBF24"))
                macroCard("Fat", icon: "drop.fill", eaten: consumed.fat, target: targets.fat, color: Color(hex: "#38BDF8"))
            }
        }
        .padding(20)
        .frigyCard(cornerRadius: 28)
    }

    private func macroCard(_ label: String, icon: String, eaten: Int, target: Int, color: Color) -> some View {
        let pct = target > 0 ? min(1.0, Double(eaten) / Double(target)) : 0
        return ZStack(alignment: .topLeading) {
            GeometryReader { geo in
                ZStack(alignment: .trailing) {
                    Color(hex: "#EEF1F3")
                    color.opacity(0.9)
                        .frame(width: geo.size.width * pct)
                }
            }
            VStack(alignment: .leading, spacing: 0) {
                ZStack {
                    Circle().fill(.white).frame(width: 30, height: 30)
                    Image(systemName: icon)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(color)
                }
                Spacer(minLength: 6)
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(hex: "#6B7280"))
                Text(target > 0 ? "\(eaten) / \(target)g" : "\(eaten)g")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Color(hex: "#1F2937"))
            }
            .padding(11)
        }
        .frame(height: 96)
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    // MARK: - Meal slots

    private var mealSlotsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .lastTextBaseline) {
                Text("Heute")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(Color(hex: "#1F2937"))
                Spacer()
                Button { tabCoordinator.openTracker() } label: {
                    Text("Schnell hinzufügen")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 10) {
                ForEach(MealCategory.allCases, id: \.self) { slot in
                    mealSlot(slot, logged: loggedCategories.contains(slot))
                }
            }
        }
    }

    private func mealSlot(_ slot: MealCategory, logged: Bool) -> some View {
        Button { tabCoordinator.openTracker() } label: {
            VStack(spacing: 6) {
                Text(slot.emoji)
                    .font(.system(size: 26))
                Text(slot.shortLabel)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(logged ? FrigyBrand.primaryDeep : Color(hex: "#1F2937"))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                ZStack {
                    Circle()
                        .fill(logged ? FrigyBrand.primary : Color(hex: "#6B7280").opacity(0.15))
                        .frame(width: 18, height: 18)
                    Image(systemName: logged ? "checkmark" : "plus")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(logged ? .white : Color(hex: "#6B7280"))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 92)
            .realGlass(
                in: RoundedRectangle(cornerRadius: 20),
                tint: logged ? FrigyBrand.primary : nil,
                interactive: true
            )
            .shadow(color: .black.opacity(0.05), radius: 8, y: 3)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Weekly plan card

    private var weeklyPlanCard: some View {
        Button { tabCoordinator.selectedTab = .plans } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(FrigyBrand.selectedBg)
                        .frame(width: 44, height: 44)
                    Image(systemName: "calendar")
                        .font(.system(size: 19, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Wochenplan")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(Color(hex: "#1F2937"))
                    Text(weekdayText)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(FrigyBrand.primaryDark)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: "#C4C9D0"))
            }
            .padding(18)
            .frigyCard(cornerRadius: 22)
        }
        .buttonStyle(.plain)
    }
}
