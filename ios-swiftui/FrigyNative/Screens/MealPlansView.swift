import SwiftUI
import UIKit

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
    @State private var toastMessage: String?
    @State private var selectedTemplate: FoodTemplate?
    @State private var showFridgeScan = false

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
        .background(RoundedRectangle(cornerRadius: 12).fill(FrigyBrand.selectedBg.opacity(0.45)))
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

// MARK: - Fridge Scan Sheet

struct FridgeScanSheet: View {
    @Environment(\.dismiss) private var dismiss
    let weekMeals: [PlannedMeal]

    @State private var selectedImage: UIImage?
    @State private var showCamera = false
    @State private var showGallery = false
    @State private var isAnalyzing = false
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

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {

                    // Image preview
                    if let img = selectedImage {
                        Image(uiImage: img)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 220)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                            .padding(.horizontal, 20)
                    } else {
                        ZStack {
                            RoundedRectangle(cornerRadius: 18)
                                .fill(FrigyBrand.bg)
                                .frame(height: 180)
                            VStack(spacing: 10) {
                                Image(systemName: "refrigerator.fill")
                                    .font(.system(size: 48))
                                    .foregroundColor(FrigyBrand.primary)
                                Text("Foto deines Kühlschranks")
                                    .font(.system(size: 14))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                        }
                        .padding(.horizontal, 20)

                        Text("Mache ein Foto deines Kühlschranks oder wähle eines aus der Galerie. Die KI erkennt automatisch vorhandene Zutaten und zeigt, was für deinen Wochenplan noch fehlt.")
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }

                    // Camera / Gallery buttons
                    HStack(spacing: 12) {
                        Button { showCamera = true } label: {
                            Label("Kamera", systemImage: "camera.fill")
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

                        Button { showGallery = true } label: {
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
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20)

                    // Analysis state
                    if isAnalyzing {
                        VStack(spacing: 8) {
                            ProgressView().scaleEffect(1.3)
                            Text("Zutaten werden erkannt…")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                        .padding(.vertical, 24)

                    } else if !detectedItems.isEmpty || !missingItems.isEmpty {
                        // Available ingredients
                        if !detectedItems.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Label("Vorhanden", systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(FrigyBrand.primaryDark)
                                ForEach(detectedItems, id: \.self) { item in
                                    HStack(spacing: 8) {
                                        Circle().fill(FrigyBrand.primaryDark).frame(width: 6, height: 6)
                                        Text(item.prefix(1).uppercased() + item.dropFirst())
                                            .font(.system(size: 14))
                                            .foregroundColor(FrigyBrand.text)
                                    }
                                }
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(FrigyBrand.selectedBg)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .padding(.horizontal, 20)
                        }

                        // Missing ingredients
                        if !missingItems.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Label("Fehlend – kaufen", systemImage: "cart.fill")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(Color(hex: "#EF4444"))
                                ForEach(missingItems, id: \.self) { item in
                                    HStack(spacing: 8) {
                                        Circle().fill(Color(hex: "#EF4444")).frame(width: 6, height: 6)
                                        Text(item.prefix(1).uppercased() + item.dropFirst())
                                            .font(.system(size: 14))
                                            .foregroundColor(FrigyBrand.text)
                                    }
                                }
                                Button {
                                    let added = ShoppingListStore.add(names: missingItems, category: .other)
                                    addedToListCount = added
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                                        dismiss()
                                    }
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: addedToListCount == nil ? "cart.badge.plus" : "checkmark")
                                        Text(addedToListCount == nil
                                             ? "Zur Einkaufsliste hinzufügen"
                                             : "\(addedToListCount ?? 0) hinzugefügt")
                                    }
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 44)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(addedToListCount == nil ? Color(hex: "#EF4444") : FrigyBrand.primaryDark)
                                    )
                                }
                                .buttonStyle(.plain)
                                .disabled(addedToListCount != nil)
                                .padding(.top, 4)
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(hex: "#FEE2E2"))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .padding(.horizontal, 20)
                        }

                    } else if let error = analysisError {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }

                    Spacer().frame(height: 40)
                }
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .sheet(isPresented: $showCamera) {
            ImagePickerView(image: $selectedImage, sourceType: .camera)
        }
        .sheet(isPresented: $showGallery) {
            ImagePickerView(image: $selectedImage, sourceType: .photoLibrary)
        }
        .onChange(of: selectedImage) { _, newImage in
            guard let img = newImage else { return }
            Task { await analyzeImage(img) }
        }
    }

    private func analyzeImage(_ image: UIImage) async {
        isAnalyzing = true
        detectedItems = []
        missingItems = []
        analysisError = nil

        guard let jpeg = image.jpegData(compressionQuality: 0.65) else {
            analysisError = "Bild konnte nicht verarbeitet werden."
            isAnalyzing = false
            return
        }
        let base64 = jpeg.base64EncodedString()
        let dataURL = "data:image/jpeg;base64,\(base64)"

        let items = await TrackerDataService.shared.analyzeIngredients(imageDataURL: dataURL)

        isAnalyzing = false

        guard !items.isEmpty else {
            analysisError = "Keine Zutaten erkannt. Bitte versuche es mit einem deutlicheren Foto."
            return
        }

        detectedItems = items.map { $0.lowercased() }.sorted()

        // Check which required meal plan ingredients are missing from the fridge
        let req = requiredIngredients.map { $0.lowercased() }
        missingItems = req.filter { reqWord in
            !detectedItems.contains { det in
                det.contains(reqWord) || reqWord.contains(det)
            }
        }
    }
}
