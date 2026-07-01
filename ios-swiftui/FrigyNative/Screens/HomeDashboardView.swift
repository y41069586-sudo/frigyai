import SwiftUI
import UserNotifications

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

enum MealCategory: String, CaseIterable, Codable {
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
    @Environment(LanguageManager.self) private var lang

    @State private var meals: [LoggedMeal] = []
    // Macro targets loaded from Supabase (user_tracker_settings); default until loaded.
    @State private var targets = MacroTargets.default
    @State private var streak: Int = 0
    @State private var loadError = false
    @State private var aiPrompt = ""
    @FocusState private var aiFocused: Bool
    @State private var waterGlasses: Int = 0
    @State private var showEditTargets = false
    @State private var todayPlanMeals: [PlannedMeal] = []
    @State private var hasSavedWeekPlan = false
    @Environment(\.horizontalSizeClass) private var hSizeClass
    // Goal is adjustable; default 8 glasses × 0.25 L = 2.0 L.
    @AppStorage("frigy.water.goal") private var waterGoal: Int = 8
    private let waterKey = "frigy.water.glasses"
    private let waterDateKey = "frigy.water.date"
    private let mlPerGlass = 250

    @StateObject private var healthKit = HealthKitService.shared
    private func liters(_ glasses: Int) -> String {
        String(format: "%.1f", Double(glasses * mlPerGlass) / 1000.0)
    }

    private var consumed: (kcal: Int, protein: Int, carbs: Int, fat: Int) {
        (
            meals.reduce(0) { $0 + $1.calories },
            meals.reduce(0) { $0 + $1.protein },
            meals.reduce(0) { $0 + $1.carbs },
            meals.reduce(0) { $0 + $1.fat }
        )
    }

    private var isOverBudget: Bool { consumed.kcal > targets.calories && targets.calories > 0 }
    private var remaining: Int { max(0, targets.calories - consumed.kcal) }
    private var surplus: Int { max(0, consumed.kcal - targets.calories) }
    private var caloriePct: Int {
        targets.calories > 0 ? min(100, Int(Double(consumed.kcal) / Double(targets.calories) * 100)) : 0
    }
    // Light surplus: 1–99 kcal over. Heavy: 100+ kcal over.
    private var isLightSurplus: Bool { isOverBudget && surplus < 100 }
    private var surplusColor: Color {
        isLightSurplus ? Color(hex: "#F97316") : Color(hex: "#EF4444")
    }

    private var loggedCategories: Set<MealCategory> { Set(meals.map(\.category)) }

    // Cached once — building a DateFormatter on every body pass is expensive.
    private static let weekdayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EEEE"
        return f
    }()

    private var weekdayText: String {
        Self.weekdayFormatter.string(from: Date())
    }

    private func reload() async {
        loadError = false
        async let sessionCheck = TrackerDataService.shared.hasActiveSession()
        async let dataFetch = TrackerDataService.shared.loadToday()
        let (hasSession, result) = await (sessionCheck, dataFetch)
        guard hasSession else {
            loadError = true
            return
        }
        meals = result.meals
        targets = result.targets
        tabCoordinator.todayMealCount = result.meals.count
        scheduleOverageNotification()
        streak = await TrackerDataService.shared.loadStreak()
    }

    private func scheduleOverageNotification() {
        let over = surplus
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["frigy.calorie.overage"])
        guard over > 0 else { return }
        Task {
            let settings = await center.notificationSettings()
            guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else { return }
            let content = UNMutableNotificationContent()
            content.title = lang.t("⚠️ Gestern warst du im Kalorienüberschuss")
            content.body = "Du hast gestern \(over) kcal zu viel gegessen. Passe deinen heutigen Plan an!"
            content.sound = .default
            var comps = Calendar.current.dateComponents([.year, .month, .day], from: Date())
            comps.day = (comps.day ?? 0) + 1
            comps.hour = 8; comps.minute = 0; comps.second = 0
            if let fireDate = Calendar.current.date(from: comps) {
                let trigger = UNTimeIntervalNotificationTrigger(
                    timeInterval: max(60, fireDate.timeIntervalSinceNow), repeats: false)
                try? await center.add(UNNotificationRequest(
                    identifier: "frigy.calorie.overage", content: content, trigger: trigger))
            }
        }
    }

    private func fmt(_ value: Int) -> String {
        value.formatted(.number.grouping(.automatic).locale(Locale(identifier: "de_DE")))
    }

    private func loadTodayPlan() {
        guard let data = UserDefaults.standard.data(forKey: weekPlanKey),
              let saved = try? JSONDecoder().decode([DayPlan].self, from: data),
              !saved.isEmpty else {
            todayPlanMeals = []
            hasSavedWeekPlan = false
            return
        }
        hasSavedWeekPlan = true
        let todayIdx = (Calendar.current.component(.weekday, from: Date()) + 5) % 7
        todayPlanMeals = todayIdx < saved.count ? saved[todayIdx].meals : []
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 22) {
                header
                calorieCard
                mealSlotsSection
                loggedMealsSection
                waterWidget
                if healthKit.isAvailable {
                    activityWidget
                }
                weeklyPlanWidget
                aiChatWidget
                Spacer().frame(height: 110)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            await reload()
            loadWater()
            loadTodayPlan()
            // Only trigger the OS permission flow the first time — calling
            // requestAuthorization() again on every dashboard load would silently
            // re-flip a user's "Trennen" (local disconnect) choice back on.
            if healthKit.authStatus == .notDetermined {
                await healthKit.requestAuthorization()
            } else {
                await healthKit.refresh()
            }
        }
        .refreshable { await reload(); await healthKit.refresh() }
        .onChange(of: tabCoordinator.showTrackerSheet) { _, isShowing in
            if !isShowing {
                Task {
                    // Brief pause to let the Supabase write commit before re-querying.
                    try? await Task.sleep(for: .milliseconds(700))
                    await reload()
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .trackerDidAddEntry)) { _ in
            Task {
                try? await Task.sleep(for: .milliseconds(700))
                await reload()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .weekPlanDidUpdate)) { _ in
            loadTodayPlan()
        }
        .sheet(isPresented: $showEditTargets) {
            NutritionGoalsView()
                .presentationBackground { FrigyGlassBackground() }
                .presentationDetents([.large])
        }
        .overlay(alignment: .top) {
            if loadError {
                HStack(spacing: 10) {
                    Image(systemName: "wifi.exclamationmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(hex: "#EF4444"))
                    Text(lang.t("Daten konnten nicht geladen werden."))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(FrigyBrand.text)
                    Spacer()
                    Button {
                        Task { await reload() }
                    } label: {
                        Text(lang.t("Erneut"))
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(.ultraThinMaterial)
                        .overlay(RoundedRectangle(cornerRadius: 14)
                            .stroke(Color(hex: "#EF4444").opacity(0.3), lineWidth: 1))
                        .shadow(color: .black.opacity(0.06), radius: 8, y: 3)
                )
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
                .animation(.easeInOut(duration: 0.3), value: loadError)
            }
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
                        Text("\(streak)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                    }
                }
                .buttonStyle(.plain)
                headerIcon("bubble.left.and.bubble.right.fill", color: FrigyBrand.primaryDark) {
                    tabCoordinator.pushHome(.chatbot(initialPrompt: nil))
                }
                headerIcon("gearshape.fill", color: FrigyBrand.textMuted) {
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
                Text(lang.t("HEUTE"))
                    .font(.system(size: 12, weight: .bold))
                    .tracking(1.5)
                    .foregroundColor(FrigyBrand.primaryDark.opacity(0.75))
                Spacer()
                LiquidGlassCircleButton(systemImage: "pencil", size: 34, iconSize: 14) {
                    showEditTargets = true
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(isOverBudget ? "+\(fmt(surplus))" : fmt(remaining))
                        .font(.system(size: 44, weight: .black, design: .rounded))
                        .foregroundColor(isOverBudget ? surplusColor : FrigyBrand.text)
                        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isOverBudget)
                    Text("kcal")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundColor(isOverBudget ? surplusColor : FrigyBrand.text)
                }
                Text(isOverBudget
                     ? lang.t("über dem Tagesziel von") + " \(fmt(targets.calories)) kcal"
                     : lang.t("übrig von") + " \(fmt(targets.calories)) kcal")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(isOverBudget ? surplusColor.opacity(0.75) : FrigyBrand.textMuted)
            }

            // Progress bar
            VStack(spacing: 8) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(isOverBudget
                                  ? surplusColor.opacity(0.15)
                                  : FrigyBrand.primary.opacity(0.18))
                            .frame(height: 8)
                        Capsule()
                            .fill(isOverBudget
                                  ? LinearGradient(
                                        colors: [surplusColor.opacity(0.6), surplusColor],
                                        startPoint: .leading, endPoint: .trailing)
                                  : LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                                   startPoint: .leading, endPoint: .trailing))
                            .frame(width: max(8, geo.size.width * Double(min(caloriePct, 100)) / 100), height: 8)
                            .animation(.spring(duration: 0.6), value: caloriePct)
                    }
                }
                .frame(height: 8)

                HStack {
                    Text("\(fmt(consumed.kcal)) " + lang.t("Gegessen"))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(isOverBudget ? surplusColor.opacity(0.75) : FrigyBrand.textMuted)
                    Spacer()
                    Text(isOverBudget
                         ? (isLightSurplus ? lang.t("Leichter Überschuss") : lang.t("Überschuss!"))
                         : "\(caloriePct)%")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(isOverBudget ? surplusColor : FrigyBrand.primaryDark)
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
                    Color(UIColor.secondarySystemBackground)
                    color.opacity(0.9)
                        .frame(width: geo.size.width * pct)
                }
            }
            VStack(alignment: .leading, spacing: 0) {
                ZStack {
                    Circle().fill(Color(UIColor.systemBackground)).frame(width: 30, height: 30)
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
                    .foregroundColor(FrigyBrand.text)
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
                Text(lang.t("Heute"))
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button { tabCoordinator.openTracker() } label: {
                    Text(lang.t("Schnell hinzufügen"))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(FrigyBrand.textMuted)
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
                Text(lang.t(slot.shortLabel))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(logged ? FrigyBrand.primaryDeep : FrigyBrand.text)
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

    // MARK: - Logged meals list (with delete)

    private var loggedMealsSection: some View {
        Group {
            if !meals.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Geloggte Mahlzeiten")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(FrigyBrand.text)

                    VStack(spacing: 8) {
                        ForEach(meals) { meal in
                            HStack(spacing: 12) {
                                Text(meal.category.emoji)
                                    .font(.system(size: 22))
                                    .frame(width: 36, height: 36)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(meal.name)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(FrigyBrand.text)
                                        .lineLimit(1)
                                    Text("\(meal.calories) kcal · P\(meal.protein)g · K\(meal.carbs)g · F\(meal.fat)g")
                                        .font(.system(size: 11))
                                        .foregroundColor(FrigyBrand.textMuted)
                                }

                                Spacer()

                                Button {
                                    Task { await deleteMeal(meal) }
                                } label: {
                                    Image(systemName: "trash")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(Color(hex: "#EF4444"))
                                        .frame(width: 30, height: 30)
                                        .background(Circle().fill(Color(hex: "#FEE2E2")))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color(UIColor.systemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14)
                                .stroke(FrigyBrand.cardBorder, lineWidth: 1))
                        }
                    }
                }
            }
        }
    }

    private func deleteMeal(_ meal: LoggedMeal) async {
        guard !meal.entryId.isEmpty else {
            meals.removeAll { $0.id == meal.id }
            tabCoordinator.todayMealCount = meals.count
            return
        }
        let ok = await TrackerDataService.shared.deleteFoodEntry(id: meal.entryId)
        if ok {
            meals.removeAll { $0.id == meal.id }
            tabCoordinator.todayMealCount = meals.count
        }
    }

    // MARK: - Weekly plan widget (port of WeeklyPlanWidget.tsx)

    private var weekDays: [(short: String, isToday: Bool)] {
        let symbols = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
        // Calendar.weekday: Sunday = 1 … Saturday = 7 → map to Monday-based index.
        let todayIdx = (Calendar.current.component(.weekday, from: Date()) + 5) % 7
        return symbols.enumerated().map { (index, short) in (short, index == todayIdx) }
    }

    /// The single meal that's relevant right now, chosen by time of day: morning
    /// → breakfast, midday → lunch, afternoon → snack, evening → dinner. If that
    /// slot isn't in the plan we show the next upcoming meal, and once the day's
    /// later meals are gone we fall back to the most recent earlier one.
    private var currentPlannedMeal: PlannedMeal? {
        guard !todayPlanMeals.isEmpty else { return nil }
        let hour = Calendar.current.component(.hour, from: Date())
        let order: [MealCategory] = [.breakfast, .lunch, .snack, .dinner]
        let targetIndex: Int
        switch hour {
        case ..<11: targetIndex = 0
        case ..<15: targetIndex = 1
        case ..<18: targetIndex = 2
        default:    targetIndex = 3
        }
        for i in targetIndex..<order.count {
            if let m = todayPlanMeals.first(where: { $0.category == order[i] }) { return m }
        }
        for i in stride(from: targetIndex - 1, through: 0, by: -1) {
            if let m = todayPlanMeals.first(where: { $0.category == order[i] }) { return m }
        }
        return todayPlanMeals.first
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
                        Text(lang.t("Wochenplan"))
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                        Text(weekdayText)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(FrigyBrand.primaryDark.opacity(0.8))
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.primary.opacity(0.4))
                }

                if let meal = currentPlannedMeal {
                    // Only the meal that's relevant right now (by time of day).
                    HStack(spacing: 12) {
                        Text(meal.category.emoji)
                            .font(.system(size: 26))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(lang.t(meal.category.shortLabel).uppercased())
                                .font(.system(size: 9, weight: .bold)).tracking(1.2)
                                .foregroundColor(FrigyBrand.primaryDark.opacity(0.8))
                            Text(meal.name)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                                .lineLimit(2)
                        }
                        Spacer()
                        Text("\(meal.calories) kcal")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(14)
                    .background(FrigyBrand.primary.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                } else {
                    Text(hasSavedWeekPlan
                         ? lang.t("Für heute sind noch keine Mahlzeiten geplant.")
                         : lang.t("Tippe, um deinen Wochenplan zu öffnen und Mahlzeiten zu generieren."))
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(hex: "#6B7280"))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(FrigyBrand.primary.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                HStack(spacing: 0) {
                    ForEach(weekDays, id: \.short) { day in
                        VStack(spacing: 6) {
                            Circle()
                                .fill(day.isToday ? FrigyBrand.primary : FrigyBrand.cardBorder)
                                .frame(width: day.isToday ? 8 : 6, height: day.isToday ? 8 : 6)
                            Text(day.short)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(day.isToday ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }

                HStack(spacing: 6) {
                    Text(lang.t("Plan ansehen"))
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
                    Text(lang.t("KI-BERATER"))
                        .font(.system(size: 9, weight: .bold))
                        .tracking(1.5)
                        .foregroundColor(FrigyBrand.textMuted)
                    Text(lang.t("Frag deinen Coach"))
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                }
            }

            HStack(alignment: .center, spacing: 8) {
                TextField(lang.t("Wie viele Kalorien sollte ich essen?"), text: $aiPrompt)
                    .font(.system(size: 14))
                    .focused($aiFocused)
                    .submitLabel(.send)
                    .onSubmit { submitAi() }
                    .padding(.horizontal, 12)
                    // Apple's real Liquid Glass (.glassEffect on iOS 26) imposes its own
                    // minimum height on the shape it's applied to, which doesn't match
                    // the send button's manually-sized frame — pin both to the same
                    // explicit height so the row doesn't visually shift between OS versions.
                    .frame(height: 46)
                    .realGlass(in: RoundedRectangle(cornerRadius: 14), interactive: false)

                Button { submitAi() } label: {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 46, height: 46)
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
                .frame(height: 46)
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
        // The water now fills the ENTIRE widget from the bottom, rising with
        // progress. Text/controls sit on top; colors are tuned (dark navy labels,
        // light control chips) so everything stays legible both over the empty
        // light-blue base and over the filled blue water.
        let prog = waterGoal > 0 ? min(1.0, Double(waterGlasses) / Double(waterGoal)) : 0
        let navy = Color(hex: "#0C2E4E")
        return ZStack(alignment: .bottom) {
            // Rising water fill
            GeometryReader { geo in
                let fillH = prog <= 0 ? 0 : max(10, geo.size.height * prog + 4)
                TimelineView(.animation) { timeline in
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    let wavePhase = t.truncatingRemainder(dividingBy: 3) / 3 * 2 * .pi
                    WaterWaveShape(phase: wavePhase, amplitude: 4)
                        .fill(LinearGradient(
                            colors: [Color(hex: "#BFDBFE"), Color(hex: "#60A5FA")],
                            startPoint: .top, endPoint: .bottom))
                }
                .frame(height: fillH)
                .frame(maxHeight: .infinity, alignment: .bottom)
                .animation(.spring(response: 0.7, dampingFraction: 0.82), value: prog)
            }

            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(.white.opacity(0.7))
                            .frame(width: 36, height: 36)
                        Image(systemName: "drop.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(Color(hex: "#2563EB"))
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(lang.t("WASSER"))
                            .font(.system(size: 9, weight: .bold)).tracking(1.5)
                            .foregroundColor(navy.opacity(0.7))
                        Text("\(liters(waterGlasses)) / \(liters(waterGoal)) L")
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundColor(navy)
                    }
                    Spacer()
                    Menu {
                        ForEach([6, 8, 10, 12], id: \.self) { g in
                            Button("\(liters(g)) L (\(g) \(lang.t("Gläser")))") {
                                waterGoal = g
                                if waterGlasses > g { setWater(g) }
                            }
                        }
                    } label: {
                        Image(systemName: "target")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(Color(hex: "#2563EB"))
                            .frame(width: 32, height: 32)
                            .background(Circle().fill(.white.opacity(0.85)))
                    }
                    HStack(spacing: 6) {
                        Button { setWater(waterGlasses - 1) } label: {
                            Image(systemName: "minus")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(waterGlasses > 0 ? Color(hex: "#2563EB") : navy.opacity(0.35))
                                .frame(width: 32, height: 32)
                                .background(Circle().fill(.white.opacity(0.85)))
                        }
                        .buttonStyle(.plain).disabled(waterGlasses == 0)
                        Button { setWater(waterGlasses + 1) } label: {
                            Image(systemName: "plus")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 32, height: 32)
                                .background(Circle().fill(Color(hex: "#2563EB")))
                        }
                        .buttonStyle(.plain).disabled(waterGlasses >= waterGoal)
                    }
                }

                Spacer(minLength: 34)

                if waterGlasses >= waterGoal {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.circle.fill").foregroundColor(navy)
                        Text(lang.t("Tagesziel erreicht! Super!"))
                            .font(.system(size: 13, weight: .heavy)).foregroundColor(navy)
                    }
                } else {
                    Text(lang.t("Noch") + " \(liters(waterGoal - waterGlasses)) L " + lang.t("bis zum Tagesziel"))
                        .font(.system(size: 12, weight: .bold)).foregroundColor(navy.opacity(0.85))
                }
            }
            .padding(16)
        }
        .frame(height: 150)
        .background(Color(hex: "#EFF6FF"))
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color(hex: "#BFDBFE"), lineWidth: 1))
        .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
    }

    // MARK: - Activity Widget (Apple Health)

    private var activityWidget: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(hex: "#FDE68A").opacity(0.5))
                        .frame(width: 36, height: 36)
                    Image(systemName: "figure.walk")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(hex: "#D97706"))
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text(lang.t("AKTIVITÄT"))
                        .font(.system(size: 9, weight: .bold)).tracking(1.5)
                        .foregroundColor(FrigyBrand.textMuted)
                    Text(lang.t("Heute"))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(FrigyBrand.text)
                }
                Spacer()
                // notDetermined / reconnect → request or re-enable in-app.
                // Otherwise the "Einstellungen" button opens Apple's system Settings,
                // where the user can turn Frigy's Apple Health access off directly.
                if healthKit.authStatus == .notDetermined ||
                    (healthKit.authStatus == .authorized && !healthKit.isLocallyConnected) {
                    Button {
                        Task {
                            if healthKit.authStatus == .notDetermined {
                                await healthKit.requestAuthorization()
                            } else {
                                await healthKit.reconnect()
                            }
                        }
                    } label: {
                        Text(lang.t("Verbinden"))
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Capsule().fill(Color(hex: "#F59E0B")))
                    }
                    .buttonStyle(.plain)
                } else {
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        Text(lang.t("Einstellungen"))
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(hex: "#D97706"))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Capsule().fill(Color(hex: "#FEF3C7")))
                    }
                    .buttonStyle(.plain)
                }
            }

            HStack(spacing: 0) {
                activityStat(
                    value: healthKit.stepsToday.formatted(.number.grouping(.automatic).locale(Locale(identifier: "de_DE"))),
                    label: lang.t("Schritte"),
                    icon: "shoeprints.fill",
                    color: Color(hex: "#F59E0B")
                )
                Divider().frame(height: 40)
                activityStat(
                    value: "\(healthKit.activeCaloriesToday)",
                    label: lang.t("Aktiv kcal"),
                    icon: "flame.fill",
                    color: Color(hex: "#EF4444")
                )
                Divider().frame(height: 40)
                let netCal = max(0, consumed.kcal - healthKit.activeCaloriesToday)
                activityStat(
                    value: "\(netCal)",
                    label: lang.t("Netto kcal"),
                    icon: "equal.circle.fill",
                    color: FrigyBrand.primaryDark
                )
            }
        }
        .padding(16)
        .frigyCard(cornerRadius: 22)
    }

    private func activityStat(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(color)
            Text(value)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(FrigyBrand.text)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
    }

    private func submitAi() {
        let prompt = aiPrompt.trimmingCharacters(in: .whitespaces)
        aiPrompt = ""
        aiFocused = false
        tabCoordinator.pushHome(.chatbot(initialPrompt: prompt.isEmpty ? nil : prompt))
    }
}

// MARK: - Water level visual (smooth rising fill, replaces the old droplet-icon row)

/// A gently oscillating wave drawn across the top edge of its own bounds — used as
/// the surface of the water fill. Only `phase` is animatable; the fill *level* is
/// controlled separately by sizing this shape's enclosing frame, which keeps the
/// continuous wave motion and the spring-animated level change from fighting over
/// the same `animatableData`.
private struct WaterWaveShape: Shape {
    var phase: Double
    var amplitude: CGFloat = 3

    var animatableData: Double {
        get { phase }
        set { phase = newValue }
    }

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let wavelength = max(rect.width, 1)
        path.move(to: CGPoint(x: 0, y: amplitude))
        var x: CGFloat = 0
        while x <= rect.width {
            let relativeX = x / wavelength
            let y = amplitude + amplitude * sin(relativeX * 2 * .pi + phase)
            path.addLine(to: CGPoint(x: x, y: y))
            x += 2
        }
        path.addLine(to: CGPoint(x: rect.width, y: rect.height))
        path.addLine(to: CGPoint(x: 0, y: rect.height))
        path.closeSubpath()
        return path
    }
}
