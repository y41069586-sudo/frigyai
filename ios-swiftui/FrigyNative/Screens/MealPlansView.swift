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
    let duration: Int // minutes
    let tags: [String]
}

// MARK: - View

struct MealPlansView: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    @State private var selectedDayIndex = 0
    @State private var isGenerating = false
    @State private var bannerMessage: String?
    @State private var bannerIsError = false

    @State private var weekPlan: [DayPlan] = makeDemoWeek()

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Wochenplan")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text("KI-generierter Ernährungsplan")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#9CA3AF"))
                    }
                    Spacer()
                    if isGenerating {
                        HStack(spacing: 8) {
                            ProgressView().tint(.white)
                            Text("Generiert…")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 14).padding(.vertical, 10)
                        .background(Capsule().fill(FrigyBrand.primaryDark))
                    } else {
                        Button {
                            Task { await generatePlan() }
                        } label: {
                            Label("Plan erstellen", systemImage: "sparkles")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 14).padding(.vertical, 10)
                                .background(
                                    Capsule()
                                        .fill(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                                        .overlay(Capsule().stroke(Color.white.opacity(0.3), lineWidth: 1).blendMode(.overlay))
                                )
                                .shadow(color: FrigyBrand.primaryDeep.opacity(0.3), radius: 8, y: 4)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)

                if let msg = bannerMessage {
                    Text(msg)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(bannerIsError ? Color(hex: "#EF4444") : Color(hex: "#39D47F"))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(bannerIsError ? Color(hex: "#FEF2F2") : Color(hex: "#DCFEEF"))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 20)
                }

                // Day selector
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(weekPlan.indices, id: \.self) { i in
                                let day = weekPlan[i]
                                Button {
                                    withAnimation(.spring(duration: 0.3)) {
                                        selectedDayIndex = i
                                    }
                                } label: {
                                    VStack(spacing: 4) {
                                        Text(day.shortDay)
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(selectedDayIndex == i ? .white : Color(hex: "#9CA3AF"))
                                        Text(day.weekday.prefix(2).uppercased())
                                            .font(.system(size: 17, weight: .bold))
                                            .foregroundColor(selectedDayIndex == i ? .white : Color(hex: "#1F2937"))
                                        if day.isToday {
                                            Circle()
                                                .fill(selectedDayIndex == i ? .white : Color(hex: "#75FBB2"))
                                                .frame(width: 5, height: 5)
                                        }
                                    }
                                    .frame(width: 52, height: 70)
                                    .background(
                                        Group {
                                            if selectedDayIndex == i {
                                                AnyView(
                                                    RoundedRectangle(cornerRadius: 16)
                                                        .fill(LinearGradient(
                                                            colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                                            startPoint: .top, endPoint: .bottom
                                                        ))
                                                        .overlay(
                                                            RoundedRectangle(cornerRadius: 16)
                                                                .stroke(Color.white.opacity(0.35), lineWidth: 1)
                                                                .blendMode(.overlay)
                                                        )
                                                )
                                            } else {
                                                AnyView(
                                                    RoundedRectangle(cornerRadius: 16)
                                                        .fill(.ultraThinMaterial)
                                                        .overlay(
                                                            RoundedRectangle(cornerRadius: 16)
                                                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                                        )
                                                )
                                            }
                                        }
                                    )
                                    .shadow(
                                        color: selectedDayIndex == i ? Color(hex: "#39D47F").opacity(0.28) : .black.opacity(0.04),
                                        radius: selectedDayIndex == i ? 10 : 4,
                                        y: selectedDayIndex == i ? 5 : 2
                                    )
                                }
                                .buttonStyle(.plain)
                                .id(i)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 4)
                    }
                    .onAppear {
                        proxy.scrollTo(selectedDayIndex, anchor: .center)
                    }
                }

                // Day stats strip
                let day = weekPlan[selectedDayIndex]
                HStack(spacing: 0) {
                    dayStat("Kalorien", value: "\(day.totalCal) kcal")
                    Divider().frame(height: 28)
                    dayStat("Mahlzeiten", value: "\(day.meals.count)")
                    Divider().frame(height: 28)
                    dayStat("Ø Zeit", value: "\(day.meals.map(\.duration).reduce(0, +) / max(1, day.meals.count)) min")
                }
                .padding(.vertical, 12)
                .frigyCard(cornerRadius: 16)
                .padding(.horizontal, 20)

                // Meals of selected day
                VStack(spacing: 12) {
                    if day.meals.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "calendar.badge.plus")
                                .font(.system(size: 40))
                                .foregroundColor(Color(hex: "#BCFDDC"))
                            Text("Noch kein Plan für diesen Tag")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(Color(hex: "#6B7280"))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(32)
                    } else {
                        ForEach(day.meals) { meal in
                            PlannedMealCard(meal: meal)
                                .padding(.horizontal, 20)
                        }
                    }
                }

                Spacer().frame(height: 100)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
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
                        duration: m.prepTime ?? 0,
                        tags: m.allergenTags ?? []
                    )
                }
                return DayPlan(weekday: existing.weekday, shortDay: existing.shortDay,
                               isToday: existing.isToday, meals: meals)
            }
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

    private func dayStat(_ label: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color(hex: "#1F2937"))
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "#9CA3AF"))
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Planned Meal Card

struct PlannedMealCard: View {
    let meal: PlannedMeal

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color(hex: "#F2FFF8"))
                    .frame(width: 52, height: 52)
                Image(systemName: meal.category.icon)
                    .font(.system(size: 22))
                    .foregroundColor(Color(hex: "#39D47F"))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(meal.category.rawValue)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(hex: "#9CA3AF"))
                Text(meal.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(hex: "#1F2937"))
                HStack(spacing: 8) {
                    Label("\(meal.calories) kcal", systemImage: "flame.fill")
                    Label("\(meal.duration) min", systemImage: "clock.fill")
                }
                .font(.system(size: 12))
                .foregroundColor(Color(hex: "#6B7280"))
                if !meal.tags.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(meal.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(FrigyBrand.primaryDark)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(
                                    Capsule()
                                        .fill(.ultraThinMaterial)
                                        .overlay(Capsule().stroke(FrigyBrand.primary.opacity(0.45), lineWidth: 1))
                                )
                        }
                    }
                }
            }

            Spacer()
        }
        .padding(14)
        .frigyCard(cornerRadius: 18)
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
        let dayNum = calendar.component(.day, from: date)

        let meals: [PlannedMeal] = i < 5 ? [
            PlannedMeal(category: .breakfast, name: "Haferflocken mit Beeren", calories: 320, duration: 5, tags: ["Vegan", "High Protein"]),
            PlannedMeal(category: .lunch, name: "Hähnchen-Quinoa Bowl", calories: 520, duration: 20, tags: ["High Protein"]),
            PlannedMeal(category: .snack, name: "Griechischer Joghurt", calories: 130, duration: 0, tags: ["Proteinreich"]),
            PlannedMeal(category: .dinner, name: "Lachs mit Gemüse", calories: 480, duration: 25, tags: ["Omega-3"]),
        ] : []

        return DayPlan(weekday: dayNames[i], shortDay: "\(shortNames[i]) \(dayNum)", isToday: isToday, meals: meals)
    }
}
