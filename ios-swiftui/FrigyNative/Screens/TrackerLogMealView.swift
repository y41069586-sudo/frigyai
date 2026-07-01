import SwiftUI
import UIKit

struct TrackerLogMealView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang

    let preselectedCategory: MealCategory?

    init(preselectedCategory: MealCategory? = nil) {
        self.preselectedCategory = preselectedCategory
        let cat = preselectedCategory ?? Self.defaultCategoryByTime()
        _selectedCategory = State(initialValue: cat)
    }

    @State private var searchText = ""
    @State private var selectedCategory: MealCategory
    @State private var recentFoods: [RecentFood] = []
    @State private var isLoading = true
    @State private var searchResults: [RecentFood] = []
    @State private var isSearching = false
    @State private var showBarcodeScanner = false
    @State private var prefillFood: ScannedFood?
    @State private var showManualEntry = false
    @State private var searchTask: Task<Void, Never>? = nil
    @State private var showCamera = false
    @State private var isAnalyzingPhoto = false
    @State private var capturedImage: UIImage?
    @State private var showPhotoPreview = false
    @State private var selectedTemplate: FoodTemplate?
    @State private var quickAddError: String?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack(spacing: 0) {
                Button { dismiss() } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                        Text(lang.t("Schließen"))
                            .font(.system(size: 15, weight: .medium))
                    }
                    .foregroundColor(FrigyBrand.primaryDark)
                }
                .buttonStyle(.plain)
                .frame(width: 100, alignment: .leading)
                Spacer()
                Text(lang.t(selectedCategory.rawValue) + " " + lang.t("tracken"))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Color.clear.frame(width: 100, height: 1)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            // Search bar
            HStack(spacing: 10) {
                Image(systemName: isSearching ? "hourglass" : "magnifyingglass")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(FrigyBrand.textMuted)
                TextField(lang.t("Lebensmittel suchen..."), text: $searchText)
                    .font(.system(size: 15))
                    .foregroundColor(FrigyBrand.text)
                if !searchText.isEmpty {
                    Button { searchText = "" } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(UIColor.secondarySystemBackground))
                    .overlay(RoundedRectangle(cornerRadius: 12)
                        .stroke(FrigyBrand.primary.opacity(0.3), lineWidth: 1))
            )
            .padding(.horizontal, 16)
            .padding(.bottom, 4)

            categoryPicker
            Divider()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    // Scan options: photo (OpenAI) + barcode
                    HStack(spacing: 12) {
                        scanCard(icon: "camera.fill", title: lang.t("Essen scannen"),
                                 subtitle: lang.t("Foto mit KI"),
                                 tint: "#39D47F", busy: false) {
                            showCamera = true
                        }
                        scanCard(icon: "barcode.viewfinder", title: lang.t("Barcode"),
                                 subtitle: lang.t("Scannen"),
                                 tint: "#A5B4FC", busy: false) {
                            showBarcodeScanner = true
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    if isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.top, 40)
                    } else if !searchText.isEmpty {
                        liveSearchSection
                            .padding(.horizontal, 16)
                    } else {
                        recentFoodsSection
                        templatesSection
                    }

                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .task { await loadFoods() }
        .onChange(of: searchText) { _, newVal in
            searchTask?.cancel()
            let query = newVal.trimmingCharacters(in: .whitespacesAndNewlines)
            guard query.count >= 1 else {
                withAnimation(.smooth(duration: 0.3)) {
                    searchResults = []
                    isSearching = false
                }
                return
            }

            // 1) Instant local results — no network, shown on every keystroke.
            let local = FoodDatabase.search(query).map { item in
                RecentFood(id: "db-\(item.name)", name: item.name,
                           calories: item.calories, protein: item.protein,
                           carbs: item.carbs, fat: item.fat)
            }
            searchResults = local

            // 2) AI fallback only when the local DB has little/nothing to offer,
            //    and only after a short debounce so we don't fire on every key.
            if local.count < 3 && query.count >= 3 {
                searchTask = Task {
                    isSearching = true
                    try? await Task.sleep(nanoseconds: 450_000_000)
                    guard !Task.isCancelled else { return }
                    let ai = await searchFood(query: query)
                    guard !Task.isCancelled else { return }
                    withAnimation(.smooth(duration: 0.4)) {
                        // Merge AI hits, dropping any duplicate of a local name.
                        let existing = Set(searchResults.map { $0.name.lowercased() })
                        searchResults += ai.filter { !existing.contains($0.name.lowercased()) }
                        isSearching = false
                    }
                }
            } else {
                isSearching = false
            }
        }
        .sheet(isPresented: $showBarcodeScanner) {
            BarcodeScannerView { scanned in
                showBarcodeScanner = false
                prefillFood = scanned
                showManualEntry = true
            }
        }
        .sheet(isPresented: $showCamera) {
            FoodCameraView { image in
                showCamera = false
                if let image {
                    capturedImage = image
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                        showPhotoPreview = true
                    }
                }
            }
            .ignoresSafeArea()
        }
        .sheet(isPresented: $showPhotoPreview) {
            if let img = capturedImage {
                FoodPhotoPreviewSheet(image: img) { food in
                    showPhotoPreview = false
                    prefillFood = food
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        showManualEntry = true
                    }
                } onCancel: {
                    showPhotoPreview = false
                    capturedImage = nil
                }
            }
        }
        .sheet(isPresented: $showManualEntry) {
            ManualFoodEntrySheet(
                prefill: prefillFood,
                selectedCategory: selectedCategory
            ) { dismiss() }
            .onDisappear { prefillFood = nil }
        }
        .sheet(item: $selectedTemplate) { tpl in
            FoodTemplateDetailSheet(template: tpl, category: selectedCategory) { dismiss() }
        }
        .alert(lang.t("Speichern fehlgeschlagen"), isPresented: Binding(
            get: { quickAddError != nil },
            set: { if !$0 { quickAddError = nil } }
        )) {
            Button(lang.t("OK"), role: .cancel) { quickAddError = nil }
        } message: {
            Text(quickAddError ?? "")
        }
    }

    // MARK: - Category picker

    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(MealCategory.allCases, id: \.self) { cat in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) {
                            selectedCategory = cat
                        }
                    } label: {
                        Label(lang.t(cat.rawValue), systemImage: cat.icon)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(selectedCategory == cat ? .white : FrigyBrand.primaryDark)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Group {
                                    if selectedCategory == cat {
                                        AnyView(Capsule()
                                            .fill(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                                                 startPoint: .topLeading, endPoint: .bottomTrailing))
                                            .overlay(Capsule().stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay)))
                                    } else {
                                        AnyView(Capsule()
                                            .fill(.ultraThinMaterial)
                                            .overlay(Capsule().stroke(FrigyBrand.primary.opacity(0.4), lineWidth: 1)))
                                    }
                                }
                            )
                            .shadow(color: selectedCategory == cat ? FrigyBrand.primaryDark.opacity(0.2) : .clear, radius: 6, y: 3)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
    }

    // MARK: - Live search results

    @ViewBuilder private var liveSearchSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(lang.t("Suchergebnisse"))
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(FrigyBrand.textMuted)
                Spacer()
                if isSearching {
                    ProgressView().scaleEffect(0.7)
                }
            }
            if searchResults.isEmpty && !isSearching {
                Text("\(lang.t("Keine Ergebnisse für")) „\(searchText)“")
                    .font(.system(size: 14))
                    .foregroundColor(FrigyBrand.textMuted)
                    .padding(.top, 4)
            } else {
                VStack(spacing: 6) {
                    ForEach(searchResults) { food in
                        foodRow(food)
                            .transition(.blurReplace)
                    }
                }
            }
        }
    }

    // MARK: - Recent foods

    @ViewBuilder private var recentFoodsSection: some View {
        if recentFoods.isEmpty {
            VStack(spacing: 12) {
                Image(systemName: "fork.knife")
                    .font(.system(size: 40))
                    .foregroundColor(FrigyBrand.cardBorder)
                Text(lang.t("Noch nichts geloggt"))
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(FrigyBrand.textMuted)
                Text(lang.t("Scanne einen Barcode oder suche nach einem Lebensmittel."))
                    .font(.system(size: 13))
                    .foregroundColor(FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 40)
        } else {
            VStack(alignment: .leading, spacing: 10) {
                Text(lang.t("Zuletzt gegessen"))
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                    .padding(.horizontal, 16)
                VStack(spacing: 6) {
                    ForEach(recentFoods) { food in
                        foodRow(food)
                            .padding(.horizontal, 16)
                            .contextMenu {
                                Button(role: .destructive) {
                                    Task { await deleteRecentFood(food) }
                                } label: {
                                    Label(lang.t("Löschen"), systemImage: "trash")
                                }
                            }
                    }
                }
            }
        }
    }

    // MARK: - Row

    private func foodRow(_ food: RecentFood) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: "#F2FFF8"))
                    .frame(width: 38, height: 38)
                Image(systemName: "leaf.fill")
                    .font(.system(size: 14))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(food.name)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(FrigyBrand.text)
                if food.protein > 0 || food.carbs > 0 || food.fat > 0 {
                    Text("P \(food.protein)g · K \(food.carbs)g · F \(food.fat)g")
                        .font(.system(size: 11))
                        .foregroundColor(FrigyBrand.textMuted)
                }
            }
            Spacer()
            Text("\(food.calories) kcal")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(FrigyBrand.textMuted)
            Button {
                Task { await deleteRecentFood(food) }
            } label: {
                ZStack {
                    Circle()
                        .fill(Color(hex: "#FEE2E2"))
                        .frame(width: 32, height: 32)
                    Image(systemName: "trash")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(hex: "#EF4444"))
                }
            }
            .buttonStyle(.plain)
            Button {
                Task {
                    let ok = await TrackerDataService.shared.addFoodEntry(
                        name: food.name, calories: food.calories,
                        protein: food.protein, carbs: food.carbs, fat: food.fat,
                        portion: "1 Portion", category: selectedCategory
                    )
                    if ok {
                        dismiss()
                    } else {
                        quickAddError = lang.t("Der Eintrag konnte nicht gespeichert werden. Bitte prüfe deine Internetverbindung und versuche es erneut.")
                    }
                }
            } label: {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .overlay(Circle().stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                        .frame(width: 32, height: 32)
                    Image(systemName: "plus")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
                .shadow(color: FrigyBrand.primaryDark.opacity(0.25), radius: 6, y: 3)
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .frigyCard(cornerRadius: 14)
    }

    // MARK: - Food templates section

    @ViewBuilder private var templatesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(lang.t("Mahlzeit-Vorlagen"))
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(FrigyBrand.text)
                .padding(.horizontal, 16)

            LazyVGrid(
                columns: [GridItem(.flexible()), GridItem(.flexible())],
                spacing: 10
            ) {
                ForEach(FoodTemplate.all) { tpl in
                    Button { selectedTemplate = tpl } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(tpl.emoji)
                                .font(.system(size: 26))
                            Text(lang.t(tpl.name))
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(FrigyBrand.text)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                            Text("\(tpl.calories) kcal")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(FrigyBrand.primaryDark)
                            Text("P \(tpl.protein)g · K \(tpl.carbs)g · F \(tpl.fat)g")
                                .font(.system(size: 10))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .frigyCard(cornerRadius: 14)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
        .padding(.top, 4)
    }

    // MARK: - Helpers

    private func loadFoods() async {
        isLoading = true
        recentFoods = await TrackerDataService.shared.loadRecentFoods()
        isLoading = false
    }

    private func deleteRecentFood(_ food: RecentFood) async {
        recentFoods.removeAll { $0.id == food.id }
        _ = await TrackerDataService.shared.deleteFoodEntry(id: food.id)
        // The deleted row may also be today's logged entry — let the dashboard refresh.
        NotificationCenter.default.post(name: .trackerDidAddEntry, object: nil)
    }

    /// Search via the app's own analyze-food edge function (OpenAI), not Open Food Facts.
    private func searchFood(query: String) async -> [RecentFood] {
        if let food = await TrackerDataService.shared.analyzeFood(query: query) {
            return [food]
        }
        return []
    }

    // Scan option card (photo / barcode)
    private func scanCard(icon: String, title: String, subtitle: String, tint: String, busy: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(hex: tint).opacity(0.15))
                        .frame(width: 44, height: 44)
                    if busy {
                        ProgressView().tint(Color(hex: tint))
                    } else {
                        Image(systemName: icon)
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(Color(hex: tint))
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.text)
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundColor(FrigyBrand.textMuted)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .frigyCard(cornerRadius: 16)
        }
        .buttonStyle(.plain)
        .disabled(busy)
    }

    // Analyze a captured food photo via the analyze-food edge function (OpenAI vision).
    private func analyzePhoto(_ image: UIImage) async {
        isAnalyzingPhoto = true
        defer { isAnalyzingPhoto = false }
        guard let jpeg = image.jpegData(compressionQuality: 0.6) else { return }
        let base64 = jpeg.base64EncodedString()
        guard let food = await TrackerDataService.shared.analyzeFood(imageBase64: base64) else { return }
        prefillFood = ScannedFood(
            barcode: "",
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat
        )
        showManualEntry = true
    }

    private static func defaultCategoryByTime() -> MealCategory {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<10:  return .breakfast
        case 10..<15: return .lunch
        case 15..<18: return .snack
        default:      return .dinner
        }
    }
}

// MARK: - Food template model

struct FoodTemplate: Identifiable {
    let id = UUID()
    let name: String
    let emoji: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let recipe: String
    let prepTime: String

    static let all: [FoodTemplate] = [
        FoodTemplate(name: "Haferflocken mit Beeren", emoji: "🫐", calories: 320, protein: 12, carbs: 52, fat: 7,
            recipe: "50g Haferflocken mit 200ml Hafermilch aufkochen. 100g gemischte Beeren und 1 TL Honig dazugeben.",
            prepTime: "5 Min"),
        FoodTemplate(name: "Rührei mit Toast", emoji: "🍳", calories: 380, protein: 22, carbs: 28, fat: 18,
            recipe: "3 Eier verquirlen, mit Butter in der Pfanne scrambled kochen. Mit 2 Scheiben Vollkorntoast servieren.",
            prepTime: "8 Min"),
        FoodTemplate(name: "Griechischer Joghurt", emoji: "🥛", calories: 150, protein: 15, carbs: 8, fat: 5,
            recipe: "200g griechischer Joghurt mit 1 EL Honig und 30g Granola. Mit Nüssen garnieren.",
            prepTime: "2 Min"),
        FoodTemplate(name: "Avocado Toast", emoji: "🥑", calories: 390, protein: 10, carbs: 36, fat: 22,
            recipe: "1 Avocado zerdrücken, mit Salz, Pfeffer und Zitronensaft würzen. Auf 2 Scheiben Sauerteigbrot streichen.",
            prepTime: "5 Min"),
        FoodTemplate(name: "Hähnchen mit Reis", emoji: "🍗", calories: 520, protein: 45, carbs: 58, fat: 9,
            recipe: "150g Hähnchenbrust würzen und in Pfanne braten. Mit 120g gekochtem Reis und Gemüse servieren.",
            prepTime: "25 Min"),
        FoodTemplate(name: "Lachs mit Brokkoli", emoji: "🐟", calories: 450, protein: 40, carbs: 12, fat: 24,
            recipe: "150g Lachsfilet im Ofen bei 180°C 15 Min backen. Mit 200g gedämpftem Brokkoli servieren.",
            prepTime: "20 Min"),
        FoodTemplate(name: "Quinoa Bowl", emoji: "🥗", calories: 480, protein: 18, carbs: 62, fat: 16,
            recipe: "100g Quinoa kochen. Mit Kichererbsen, Gurke, Tomate, Feta und Olivenöl-Dressing mischen.",
            prepTime: "15 Min"),
        FoodTemplate(name: "Pasta Bolognese", emoji: "🍝", calories: 650, protein: 32, carbs: 78, fat: 18,
            recipe: "250g Hackfleisch anbraten, Tomatensauce dazu. 150g Pasta kochen, alles mischen.",
            prepTime: "25 Min"),
        FoodTemplate(name: "Gemüse-Curry", emoji: "🍛", calories: 420, protein: 14, carbs: 58, fat: 14,
            recipe: "Paprika, Zucchini, Kichererbsen in Kokosöl anbraten. Kokosmilch, Currypaste und Gewürze hinzufügen.",
            prepTime: "20 Min"),
        FoodTemplate(name: "Caesar Salat", emoji: "🥗", calories: 350, protein: 18, carbs: 15, fat: 24,
            recipe: "Römersalat, gegrillte Hähnchenbrust, Parmesan, Croutons und Caesar-Dressing mischen.",
            prepTime: "10 Min"),
        FoodTemplate(name: "Smoothie Bowl", emoji: "🍓", calories: 280, protein: 8, carbs: 48, fat: 6,
            recipe: "200g gefrorene Banane + Beeren mixen. In Schüssel füllen, mit Granola, Kokosflocken, Nüssen toppen.",
            prepTime: "5 Min"),
        FoodTemplate(name: "Proteinsmoothie", emoji: "💪", calories: 350, protein: 30, carbs: 38, fat: 6,
            recipe: "1 Banane, 1 Messlöffel Proteinpulver, 200ml Mandelmilch, 1 EL Erdnussbutter mixen.",
            prepTime: "3 Min"),
        FoodTemplate(name: "Omelett mit Käse", emoji: "🫕", calories: 340, protein: 24, carbs: 4, fat: 26,
            recipe: "3 Eier verquirlen, in Pfanne geben. 40g geriebenen Käse und frische Kräuter draufgeben, falten.",
            prepTime: "10 Min"),
        FoodTemplate(name: "Veggie Wrap", emoji: "🌯", calories: 380, protein: 14, carbs: 52, fat: 12,
            recipe: "Tortilla mit Hummus bestreichen. Gurkenscheiben, Paprika, Karotten, Spinat und Feta einwickeln.",
            prepTime: "7 Min"),
        FoodTemplate(name: "Overnight Oats", emoji: "🌾", calories: 360, protein: 14, carbs: 58, fat: 8,
            recipe: "50g Haferflocken, 200ml Milch, 1 EL Chia, 1 TL Honig mischen. Über Nacht im Kühlschrank ziehen lassen.",
            prepTime: "5 Min + Nacht"),
        FoodTemplate(name: "Linseneintopf", emoji: "🫘", calories: 380, protein: 20, carbs: 54, fat: 6,
            recipe: "200g rote Linsen mit Karotten, Sellerie, Tomaten und Gewürzen 20 Min kochen.",
            prepTime: "25 Min"),
        FoodTemplate(name: "Thunfisch-Sandwich", emoji: "🥪", calories: 420, protein: 32, carbs: 38, fat: 14,
            recipe: "1 Dose Thunfisch mit Joghurt, Senf, Zwiebel mischen. Auf Vollkorntoast mit Salat servieren.",
            prepTime: "5 Min"),
        FoodTemplate(name: "Steak mit Süßkartoffeln", emoji: "🥩", calories: 580, protein: 48, carbs: 38, fat: 22,
            recipe: "200g Rinderfilet in Pfanne 3 Min je Seite braten. Mit 200g gerösteten Süßkartoffeln servieren.",
            prepTime: "20 Min"),
        FoodTemplate(name: "Tofu Stir-Fry", emoji: "🥦", calories: 360, protein: 22, carbs: 32, fat: 14,
            recipe: "200g Tofu würfeln, in Sesamöl anbraten. Brokkoli, Paprika, Karotten dazu, mit Sojasoße würzen.",
            prepTime: "15 Min"),
        FoodTemplate(name: "Banane mit Mandelbutter", emoji: "🍌", calories: 280, protein: 7, carbs: 42, fat: 12,
            recipe: "1 große Banane in Scheiben schneiden, mit 2 EL Mandelbutter servieren.",
            prepTime: "2 Min"),
        FoodTemplate(name: "Griechischer Salat", emoji: "🫒", calories: 310, protein: 12, carbs: 14, fat: 22,
            recipe: "Tomate, Gurke, Paprika, Oliven, Zwiebel mit Feta. Olivenöl, Oregano, Zitrone als Dressing.",
            prepTime: "8 Min"),
        FoodTemplate(name: "Müsli mit Milch", emoji: "🥣", calories: 340, protein: 12, carbs: 56, fat: 8,
            recipe: "60g Vollkornmüsli mit 200ml Vollmilch. Mit Bananenscheiben und Nüssen garnieren.",
            prepTime: "3 Min"),
        FoodTemplate(name: "Erbsensuppe", emoji: "🍵", calories: 290, protein: 16, carbs: 42, fat: 5,
            recipe: "300g gelbe Erbsen mit Zwiebeln, Sellerie, Karotten und Brühe 30 Min kochen, pürieren.",
            prepTime: "35 Min"),
        FoodTemplate(name: "Pizza Margherita", emoji: "🍕", calories: 680, protein: 24, carbs: 88, fat: 22,
            recipe: "Pizzateig ausrollen, mit Tomatensoße bestreichen, Mozzarella drauf. Bei 220°C 12 Min backen.",
            prepTime: "30 Min"),
        FoodTemplate(name: "Falafel Bowl", emoji: "🧆", calories: 520, protein: 18, carbs: 68, fat: 20,
            recipe: "Fertiger Falafel mit Quinoa, Hummus, Gurke, Tomate, Tahini-Dressing.",
            prepTime: "10 Min"),
        FoodTemplate(name: "Putenschnitzel", emoji: "🍖", calories: 420, protein: 42, carbs: 22, fat: 16,
            recipe: "150g Putenbrust klopfen, panieren, 3 Min je Seite braten. Mit Salzkartoffeln servieren.",
            prepTime: "20 Min"),
        FoodTemplate(name: "Buchweizenpfannkuchen", emoji: "🥞", calories: 380, protein: 14, carbs: 54, fat: 12,
            recipe: "100g Buchweizenmehl, 2 Eier, 200ml Milch verrühren. In Pfanne von beiden Seiten backen.",
            prepTime: "15 Min"),
        FoodTemplate(name: "Edamame", emoji: "🫛", calories: 180, protein: 16, carbs: 14, fat: 8,
            recipe: "200g tiefgekühlte Edamame 4 Min in gesalzenem Wasser kochen. Mit Meersalz servieren.",
            prepTime: "5 Min"),
        FoodTemplate(name: "Cottage Cheese Bowl", emoji: "🧀", calories: 220, protein: 24, carbs: 12, fat: 6,
            recipe: "200g Hüttenkäse mit Gurke, Tomate, Radieschen und frischem Dill. Mit etwas Salz würzen.",
            prepTime: "5 Min"),
        FoodTemplate(name: "Nuss-Mix", emoji: "🥜", calories: 320, protein: 10, carbs: 14, fat: 26,
            recipe: "40g gemischte Nüsse (Mandeln, Walnüsse, Cashews) und 30g getrocknete Früchte mischen.",
            prepTime: "1 Min"),
    ]
}

// MARK: - Food template detail sheet

struct FoodTemplateDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang
    let template: FoodTemplate
    let category: MealCategory
    let onSaved: () -> Void

    @State private var isSaving = false
    @State private var saveError: String?

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(lang.t("Schließen")) { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                Spacer()
                Text(lang.t("Vorlage"))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Color.clear.frame(width: 72, height: 1)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    VStack(spacing: 10) {
                        Text(template.emoji)
                            .font(.system(size: 56))
                        Text(lang.t(template.name))
                            .font(.system(size: 22, weight: .black))
                            .foregroundColor(FrigyBrand.text)
                            .multilineTextAlignment(.center)
                        HStack(spacing: 6) {
                            Image(systemName: "clock")
                                .font(.system(size: 11))
                                .foregroundColor(FrigyBrand.textMuted)
                            Text(lang.t(template.prepTime))
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)

                    // Macros
                    HStack(spacing: 10) {
                        macroChip(lang.t("Kalorien"), value: "\(template.calories)", unit: "kcal", color: FrigyBrand.primaryDark)
                        macroChip(lang.t("Protein"), value: "\(template.protein)", unit: "g", color: Color(hex: "#60A5FA"))
                        macroChip(lang.t("Carbs"), value: "\(template.carbs)", unit: "g", color: Color(hex: "#FBBF24"))
                        macroChip(lang.t("Fett"), value: "\(template.fat)", unit: "g", color: Color(hex: "#F87171"))
                    }
                    .padding(.horizontal, 20)

                    // Recipe
                    VStack(alignment: .leading, spacing: 10) {
                        Label(lang.t("Zubereitung"), systemImage: "list.bullet")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                        Text(lang.t(template.recipe))
                            .font(.system(size: 14))
                            .foregroundColor(FrigyBrand.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(16)
                    .frigyCard(cornerRadius: 18)
                    .padding(.horizontal, 20)

                    // Add button
                    Button {
                        isSaving = true
                        Task {
                            let ok = await TrackerDataService.shared.addFoodEntry(
                                name: template.name,
                                calories: template.calories,
                                protein: template.protein,
                                carbs: template.carbs,
                                fat: template.fat,
                                portion: "1 Portion",
                                category: category
                            )
                            isSaving = false
                            if ok {
                                dismiss()
                                onSaved()
                            } else {
                                saveError = lang.t("Der Eintrag konnte nicht gespeichert werden. Bitte prüfe deine Internetverbindung und versuche es erneut.")
                            }
                        }
                    } label: {
                        HStack(spacing: 8) {
                            if isSaving { ProgressView().tint(.white) }
                            Text(isSaving ? lang.t("Wird gespeichert…") : lang.t("Zu Tagebuch hinzufügen"))
                                .font(.system(size: 16, weight: .bold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(FrigyBrand.buttonGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                    }
                    .buttonStyle(.plain)
                    .disabled(isSaving)
                    .padding(.horizontal, 20)

                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .alert(lang.t("Speichern fehlgeschlagen"), isPresented: Binding(
            get: { saveError != nil },
            set: { if !$0 { saveError = nil } }
        )) {
            Button(lang.t("OK"), role: .cancel) { saveError = nil }
        } message: {
            Text(saveError ?? "")
        }
    }

    private func macroChip(_ label: String, value: String, unit: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(color)
            Text(unit)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(color.opacity(0.7))
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .frigyCard(cornerRadius: 12)
    }
}

// MARK: - Manual food entry sheet (used for barcode prefill only)

struct ManualFoodEntrySheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang

    let prefill: ScannedFood?
    let selectedCategory: MealCategory
    let onSaved: () -> Void

    @State private var name: String = ""
    @State private var caloriesText: String = ""
    @State private var proteinText: String = ""
    @State private var carbsText: String = ""
    @State private var fatText: String = ""
    @State private var category: MealCategory
    @State private var isSaving = false
    @State private var amountText: String = "100"
    @State private var saveError: String?
    private let isDrink: Bool

    // The macro fields above represent values per 100 g/ml — these are the
    // unscaled baseline so the "Menge" field can recompute totals live.
    private let baseCalories: Double
    private let baseProtein: Double
    private let baseCarbs: Double
    private let baseFat: Double

    private static let drinkKeywords = [
        "wasser", "saft", "shake", "kaffee", "tee", "milch", "smoothie",
        "cola", "limo", "drink", "getränk", "sprudel", "limonade",
    ]

    init(prefill: ScannedFood?, selectedCategory: MealCategory, onSaved: @escaping () -> Void) {
        self.prefill = prefill
        self.selectedCategory = selectedCategory
        self.onSaved = onSaved
        _category = State(initialValue: selectedCategory)
        let lowerName = prefill?.name.lowercased() ?? ""
        self.isDrink = Self.drinkKeywords.contains { lowerName.contains($0) }
        if let f = prefill {
            _name = State(initialValue: f.name)
            _caloriesText = State(initialValue: f.calories > 0 ? "\(f.calories)" : "")
            _proteinText = State(initialValue: f.protein > 0 ? "\(f.protein)" : "")
            _carbsText = State(initialValue: f.carbs > 0 ? "\(f.carbs)" : "")
            _fatText = State(initialValue: f.fat > 0 ? "\(f.fat)" : "")
            baseCalories = Double(f.calories)
            baseProtein = Double(f.protein)
            baseCarbs = Double(f.carbs)
            baseFat = Double(f.fat)
        } else {
            baseCalories = 0; baseProtein = 0; baseCarbs = 0; baseFat = 0
        }
    }

    private var amount: Double { Double(amountText.replacingOccurrences(of: ",", with: ".")) ?? 100 }
    private var scale: Double { amount > 0 ? amount / 100.0 : 0 }
    private var scaledCalories: Int { Int((baseCalories * scale).rounded()) }
    private var scaledProtein: Int { Int((baseProtein * scale).rounded()) }
    private var scaledCarbs: Int { Int((baseCarbs * scale).rounded()) }
    private var scaledFat: Int { Int((baseFat * scale).rounded()) }

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty && Int(caloriesText) != nil
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                Button(lang.t("Abbrechen")) { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                    .frame(width: 100, alignment: .leading)
                Spacer()
                Text(lang.t("Produkt hinzufügen"))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button {
                    Task { await save() }
                } label: {
                    if isSaving {
                        ProgressView().tint(FrigyBrand.primaryDark)
                    } else {
                        Text(lang.t("Hinzufügen"))
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(canSave ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                    }
                }
                .disabled(!canSave || isSaving)
                .buttonStyle(.plain)
                .frame(width: 100, alignment: .trailing)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(lang.t("LEBENSMITTEL"))
                            .font(.system(size: 10, weight: .bold)).tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted).padding(.bottom, 10)
                        TextField(lang.t("Name eingeben"), text: $name)
                            .font(.system(size: 16)).foregroundColor(FrigyBrand.text)
                    }
                    .padding(16).frigyCard(cornerRadius: 16)

                    VStack(alignment: .leading, spacing: 0) {
                        Text(lang.t("NÄHRWERTE (PRO 100g)"))
                            .font(.system(size: 10, weight: .bold)).tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted).padding(.bottom, 4)
                        VStack(spacing: 0) {
                            macroRow(lang.t("Kalorien"), unit: "kcal", text: $caloriesText, color: FrigyBrand.primaryDark)
                            Divider().padding(.leading, 8)
                            macroRow(lang.t("Protein"),  unit: "g", text: $proteinText,  color: Color(hex: "#60A5FA"))
                            Divider().padding(.leading, 8)
                            macroRow(lang.t("Kohlenhydrate"), unit: "g", text: $carbsText, color: Color(hex: "#FBBF24"))
                            Divider().padding(.leading, 8)
                            macroRow(lang.t("Fett"), unit: "g", text: $fatText, color: Color(hex: "#F87171"))
                        }
                    }
                    .padding(16).frigyCard(cornerRadius: 16)

                    if prefill != nil {
                        VStack(alignment: .leading, spacing: 0) {
                            Text(isDrink ? lang.t("MENGE (ml)") : lang.t("MENGE (g)"))
                                .font(.system(size: 10, weight: .bold)).tracking(1.5)
                                .foregroundColor(FrigyBrand.textMuted).padding(.bottom, 10)
                            HStack {
                                TextField("100", text: $amountText)
                                    .keyboardType(.decimalPad)
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(FrigyBrand.text)
                                Text(isDrink ? "ml" : "g")
                                    .font(.system(size: 14))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                            if amount != 100 {
                                Divider().padding(.vertical, 10)
                                Text("≈ \(scaledCalories) kcal · \(scaledProtein)g P · \(scaledCarbs)g K · \(scaledFat)g F \(lang.t("bei")) \(amountText)\(isDrink ? "ml" : "g")")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(FrigyBrand.primaryDark)
                            }
                        }
                        .padding(16).frigyCard(cornerRadius: 16)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text(lang.t("MAHLZEIT"))
                            .font(.system(size: 10, weight: .bold)).tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(MealCategory.allCases, id: \.self) { cat in
                                    Button {
                                        withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) { category = cat }
                                    } label: {
                                        Label(lang.t(cat.rawValue), systemImage: cat.icon)
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundColor(category == cat ? .white : FrigyBrand.primaryDark)
                                            .padding(.horizontal, 14).padding(.vertical, 9)
                                            .background(
                                                Capsule()
                                                    .fill(category == cat
                                                          ? AnyShapeStyle(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing))
                                                          : AnyShapeStyle(.ultraThinMaterial))
                                                    .overlay(Capsule().stroke(FrigyBrand.primary.opacity(0.4), lineWidth: 1))
                                            )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .padding(16).frigyCard(cornerRadius: 16)

                    addMealButton

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20).padding(.top, 4)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .alert(lang.t("Speichern fehlgeschlagen"), isPresented: Binding(
            get: { saveError != nil },
            set: { if !$0 { saveError = nil } }
        )) {
            Button(lang.t("OK"), role: .cancel) { saveError = nil }
        } message: {
            Text(saveError ?? "")
        }
    }

    private var addMealButton: some View {
        let label: String = isSaving ? lang.t("Wird gespeichert...") : lang.t("Hinzufügen")
        let fill: AnyShapeStyle = canSave
            ? AnyShapeStyle(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                           startPoint: .topLeading, endPoint: .bottomTrailing))
            : AnyShapeStyle(FrigyBrand.cardBorder)
        let strokeOpacity: Double = canSave ? 0.35 : 0
        let shadowColor: Color = canSave ? FrigyBrand.primaryDeep.opacity(0.28) : .clear
        return Button { Task { await save() } } label: {
            Text(label)
                .font(.system(size: 17, weight: .semibold)).foregroundColor(.white)
                .frame(maxWidth: .infinity).frame(height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(fill)
                        .overlay(RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(strokeOpacity), lineWidth: 1).blendMode(.overlay))
                )
                .shadow(color: shadowColor, radius: 12, y: 6)
        }
        .disabled(!canSave || isSaving).buttonStyle(.plain)
    }

    private func macroRow(_ label: String, unit: String, text: Binding<String>, color: Color) -> some View {
        HStack {
            Text(label).font(.system(size: 14, weight: .medium)).foregroundColor(FrigyBrand.text)
            Spacer()
            TextField("0", text: text).keyboardType(.numberPad).multilineTextAlignment(.trailing)
                .font(.system(size: 14, weight: .bold)).foregroundColor(color).frame(width: 70)
            Text(unit).font(.system(size: 12)).foregroundColor(FrigyBrand.textMuted).frame(width: 28, alignment: .leading)
        }
        .padding(.vertical, 10)
    }

    private func save() async {
        guard canSave else { return }
        isSaving = true
        let useScaled = prefill != nil && amount != 100
        let portionLabel = prefill != nil
            ? "\(amountText)\(isDrink ? "ml" : "g")"
            : "1 Portion"
        let ok = await TrackerDataService.shared.addFoodEntry(
            name: name.trimmingCharacters(in: .whitespaces),
            calories: useScaled ? scaledCalories : (Int(caloriesText) ?? 0),
            protein: useScaled ? scaledProtein : (Int(proteinText) ?? 0),
            carbs: useScaled ? scaledCarbs : (Int(carbsText) ?? 0),
            fat: useScaled ? scaledFat : (Int(fatText) ?? 0),
            portion: portionLabel,
            category: category
        )
        isSaving = false
        if ok {
            dismiss()
            onSaved()
        } else {
            saveError = lang.t("Der Eintrag konnte nicht gespeichert werden. Bitte prüfe deine Internetverbindung und versuche es erneut.")
        }
    }
}

// MARK: - Food camera (UIImagePickerController wrapper)

/// Opens the device camera to capture a single food photo. Returns the image
/// (or nil if cancelled). Falls back to the photo library when no camera exists
/// (e.g. simulator).
struct FoodCameraView: UIViewControllerRepresentable {
    let onCapture: (UIImage?) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onCapture: onCapture) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onCapture: (UIImage?) -> Void
        init(onCapture: @escaping (UIImage?) -> Void) { self.onCapture = onCapture }

        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            onCapture(info[.originalImage] as? UIImage)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onCapture(nil)
        }
    }
}

// MARK: - Food photo preview sheet

struct FoodPhotoPreviewSheet: View {
    @Environment(LanguageManager.self) private var lang
    let image: UIImage
    let onResult: (ScannedFood) -> Void
    let onCancel: () -> Void

    @State private var isAnalyzing = false
    @State private var errorMessage: String?
    @State private var rotation: Double = 0

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    Button(action: onCancel) {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark")
                                .font(.system(size: 13, weight: .semibold))
                            Text(lang.t("Abbrechen"))
                                .font(.system(size: 14, weight: .medium))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(Color.white.opacity(0.15)))
                    }
                    .buttonStyle(.plain)
                    .disabled(isAnalyzing)
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 12)

                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal, 16)
                    .shadow(color: .black.opacity(0.4), radius: 12, y: 4)

                Spacer()

                VStack(spacing: 12) {
                    if let err = errorMessage {
                        Text(err)
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#FCA5A5"))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }
                    Button {
                        Task { await analyze() }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 16, weight: .semibold))
                            Text(lang.t("KI Analyse starten"))
                                .font(.system(size: 16, weight: .bold))
                        }
                        .foregroundColor(Color(hex: "#082013"))
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(
                            LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .shadow(color: FrigyBrand.primary.opacity(0.4), radius: 12, y: 4)
                    }
                    .buttonStyle(.plain)
                    .disabled(isAnalyzing)
                    .padding(.horizontal, 24)
                }
                .padding(.bottom, 40)
            }

            if isAnalyzing {
                analyzeOverlay
                    .transition(.opacity.animation(.easeInOut(duration: 0.2)))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isAnalyzing)
    }

    private var analyzeOverlay: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()

            VStack(spacing: 20) {
                ZStack {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 90, height: 90)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .blur(radius: 1)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(FrigyBrand.primary, lineWidth: 2.5)
                        )

                    Circle()
                        .trim(from: 0, to: 0.7)
                        .stroke(
                            AngularGradient(colors: [FrigyBrand.primary.opacity(0), FrigyBrand.primary],
                                            center: .center),
                            style: StrokeStyle(lineWidth: 3.5, lineCap: .round)
                        )
                        .frame(width: 114, height: 114)
                        .rotationEffect(.degrees(rotation))
                        .onAppear {
                            withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                                rotation = 360
                            }
                        }
                }

                VStack(spacing: 6) {
                    Text(lang.t("KI analysiert dein Essen…"))
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                    Text(lang.t("Kalorien und Makros werden erkannt"))
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                    .overlay(RoundedRectangle(cornerRadius: 24)
                        .stroke(FrigyBrand.primary.opacity(0.3), lineWidth: 1))
            )
            .padding(.horizontal, 48)
        }
    }

    private func analyze() async {
        guard let jpeg = image.jpegData(compressionQuality: 0.65) else { return }
        isAnalyzing = true
        errorMessage = nil
        let base64 = jpeg.base64EncodedString()
        if let food = await TrackerDataService.shared.analyzeFood(imageBase64: base64) {
            isAnalyzing = false
            onResult(ScannedFood(barcode: "", name: food.name, calories: food.calories,
                                 protein: food.protein, carbs: food.carbs, fat: food.fat))
        } else {
            isAnalyzing = false
            errorMessage = lang.t("Erkennung fehlgeschlagen – bitte erneut versuchen.")
        }
    }
}
