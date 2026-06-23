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
    @State private var aiPrompt = ""
    @FocusState private var aiFocused: Bool
    @State private var waterGlasses: Int = 0
    private let waterGoal = 8
    private let waterKey = "frigy.water.glasses"
    private let waterDateKey = "frigy.water.date"

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
                waterWidget
                weeklyPlanWidget
                aiChatWidget
                Spacer().frame(height: 110)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await reload(); loadWater() }
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
        Button { tabCoordinator.openTracker(category: slot) } label: {
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

    // MARK: - Weekly plan widget (port of WeeklyPlanWidget.tsx)

    private var weekDays: [(short: String, isToday: Bool)] {
        let symbols = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
        // Calendar.weekday: Sunday = 1 … Saturday = 7 → map to Monday-based index.
        let todayIdx = (Calendar.current.component(.weekday, from: Date()) + 5) % 7
        return symbols.enumerated().map { (index, short) in (short, index == todayIdx) }
    }

    private var weeklyPlanWidget: some View {
        Button { tabCoordinator.selectedTab = .plans } label: {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(FrigyBrand.primary.opacity(0.12))
                            .frame(width: 40, height: 40)
                        Image(systemName: "calendar")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDeep)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Wochenplan")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text(weekdayText)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(FrigyBrand.primaryDark.opacity(0.8))
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.primary.opacity(0.4))
                }

                Text("Tippe, um deinen Wochenplan zu öffnen und Mahlzeiten zu generieren.")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: "#6B7280"))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(FrigyBrand.primary.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                HStack(spacing: 0) {
                    ForEach(weekDays, id: \.short) { day in
                        VStack(spacing: 6) {
                            Circle()
                                .fill(day.isToday ? FrigyBrand.primary : FrigyBrand.cardBorder)
                                .frame(width: day.isToday ? 8 : 6, height: day.isToday ? 8 : 6)
                            Text(day.short)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(day.isToday ? FrigyBrand.primaryDark : Color(hex: "#9CA3AF"))
                        }
                        .frame(maxWidth: .infinity)
                    }
                }

                HStack(spacing: 6) {
                    Text("Plan ansehen")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDark)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }
            }
            .padding(18)
            .frigyCard(cornerRadius: 26)
        }
        .buttonStyle(.plain)
    }

    // MARK: - AI chat widget (port of AiChatPromptWidget.tsx)

    private var aiChatWidget: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(FrigyBrand.primary.opacity(0.12))
                        .frame(width: 36, height: 36)
                    Image(systemName: "sparkles")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("KI-BERATER")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(1.5)
                        .foregroundColor(Color(hex: "#9CA3AF"))
                    Text("Frag deinen Coach")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(Color(hex: "#1F2937"))
                }
            }

            HStack(spacing: 8) {
                TextField("Wie viele Kalorien sollte ich essen?", text: $aiPrompt)
                    .font(.system(size: 14))
                    .focused($aiFocused)
                    .submitLabel(.send)
                    .onSubmit { submitAi() }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 11)
                    .realGlass(in: RoundedRectangle(cornerRadius: 14), interactive: false)

                Button { submitAi() } label: {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 42, height: 42)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(LinearGradient(
                                    colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ))
                                .overlay(RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                        )
                        .shadow(color: Color(hex: "#39D47F").opacity(0.28), radius: 8, y: 4)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .frigyCard(cornerRadius: 22)
    }

    // MARK: - Water widget

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
                        .fill(LinearGradient(colors: [Color(hex: "#93C5FD"), Color(hex: "#3B82F6")],
                                             startPoint: .leading, endPoint: .trailing))
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

    private func submitAi() {
        aiPrompt = ""
        aiFocused = false
        tabCoordinator.pushHome(.chatbot)
    }
}
