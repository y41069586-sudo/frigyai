import SwiftUI

private struct OFFSearchResponse: Decodable {
    let products: [OFFSearchProduct]
}
private struct OFFSearchProduct: Decodable {
    let product_name: String?
    let nutriments: OFFNutriments?
}
private struct OFFNutriments: Decodable {
    let energyKcal100g: Double?
    let proteins100g: Double?
    let carbohydrates100g: Double?
    let fat100g: Double?
    enum CodingKeys: String, CodingKey {
        case energyKcal100g    = "energy-kcal_100g"
        case proteins100g      = "proteins_100g"
        case carbohydrates100g = "carbohydrates_100g"
        case fat100g           = "fat_100g"
    }
}

struct TrackerLogMealView: View {
    @Environment(\.dismiss) private var dismiss

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

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack(spacing: 0) {
                Button { dismiss() } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                        Text("Schließen")
                            .font(.system(size: 15, weight: .medium))
                    }
                    .foregroundColor(FrigyBrand.primaryDark)
                }
                .buttonStyle(.plain)
                .frame(width: 100, alignment: .leading)
                Spacer()
                Text("\(selectedCategory.rawValue) tracken")
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
                TextField("Lebensmittel suchen...", text: $searchText)
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
                    .fill(.ultraThinMaterial)
                    .overlay(RoundedRectangle(cornerRadius: 12)
                        .stroke(FrigyBrand.primary.opacity(0.3), lineWidth: 1))
            )
            .padding(.horizontal, 16)
            .padding(.bottom, 4)

            categoryPicker
            Divider()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    // Barcode scan button
                    Button { showBarcodeScanner = true } label: {
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(.ultraThinMaterial)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(hex: "#A5B4FC").opacity(0.35), lineWidth: 1)
                                    )
                                    .frame(width: 48, height: 48)
                                Image(systemName: "barcode.viewfinder")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundColor(Color(hex: "#A5B4FC"))
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Barcode scannen")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                Text("Kamera öffnen und Barcode einlesen")
                                    .font(.system(size: 12))
                                    .foregroundColor(Color(hex: "#9CA3AF"))
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.cardBorder)
                        }
                        .padding(14)
                        .frigyCard(cornerRadius: 16)
                    }
                    .buttonStyle(.plain)
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
                    }

                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .task { await loadFoods() }
        .onChange(of: searchText) { _, newVal in
            searchTask?.cancel()
            if newVal.count >= 2 {
                searchTask = Task {
                    isSearching = true
                    try? await Task.sleep(nanoseconds: 350_000_000)
                    guard !Task.isCancelled else { return }
                    searchResults = await searchOpenFoodFacts(query: newVal)
                    isSearching = false
                }
            } else {
                searchResults = []
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
        .sheet(isPresented: $showManualEntry) {
            ManualFoodEntrySheet(
                prefill: prefillFood,
                selectedCategory: selectedCategory
            ) { dismiss() }
            .onDisappear { prefillFood = nil }
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
                        Label(cat.rawValue, systemImage: cat.icon)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(selectedCategory == cat ? .white : FrigyBrand.primaryDark)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Group {
                                    if selectedCategory == cat {
                                        AnyView(Capsule()
                                            .fill(LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                                                 startPoint: .topLeading, endPoint: .bottomTrailing))
                                            .overlay(Capsule().stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay)))
                                    } else {
                                        AnyView(Capsule()
                                            .fill(.ultraThinMaterial)
                                            .overlay(Capsule().stroke(FrigyBrand.primary.opacity(0.4), lineWidth: 1)))
                                    }
                                }
                            )
                            .shadow(color: selectedCategory == cat ? Color(hex: "#39D47F").opacity(0.2) : .clear, radius: 6, y: 3)
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
                Text("Suchergebnisse")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(FrigyBrand.textMuted)
                Spacer()
                if isSearching {
                    ProgressView().scaleEffect(0.7)
                }
            }
            if searchResults.isEmpty && !isSearching {
                Text("Keine Ergebnisse für „\(searchText)"")
                    .font(.system(size: 14))
                    .foregroundColor(Color(hex: "#9CA3AF"))
                    .padding(.top, 4)
            } else {
                VStack(spacing: 6) {
                    ForEach(searchResults) { food in
                        foodRow(food)
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
                    .foregroundColor(Color(hex: "#BCFDDC"))
                Text("Noch nichts geloggt")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(hex: "#6B7280"))
                Text("Scanne einen Barcode oder suche nach einem Lebensmittel.")
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#9CA3AF"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 40)
        } else {
            VStack(alignment: .leading, spacing: 10) {
                Text("Zuletzt gegessen")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Color(hex: "#1F2937"))
                    .padding(.horizontal, 16)
                VStack(spacing: 6) {
                    ForEach(recentFoods) { food in
                        foodRow(food)
                            .padding(.horizontal, 16)
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
                    .foregroundColor(Color(hex: "#39D47F"))
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(food.name)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color(hex: "#1F2937"))
                if food.protein > 0 || food.carbs > 0 || food.fat > 0 {
                    Text("P \(food.protein)g · K \(food.carbs)g · F \(food.fat)g")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                }
            }
            Spacer()
            Text("\(food.calories) kcal")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(hex: "#6B7280"))
            Button {
                Task {
                    await TrackerDataService.shared.addFoodEntry(
                        name: food.name, calories: food.calories,
                        protein: food.protein, carbs: food.carbs, fat: food.fat,
                        portion: "100g", category: selectedCategory
                    )
                    dismiss()
                }
            } label: {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .overlay(Circle().stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                        .frame(width: 32, height: 32)
                    Image(systemName: "plus")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
                .shadow(color: Color(hex: "#39D47F").opacity(0.25), radius: 6, y: 3)
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .frigyCard(cornerRadius: 14)
    }

    // MARK: - Helpers

    private func loadFoods() async {
        isLoading = true
        recentFoods = await TrackerDataService.shared.loadRecentFoods()
        isLoading = false
    }

    private func searchOpenFoodFacts(query: String) async -> [RecentFood] {
        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        guard let url = URL(string: "https://world.openfoodfacts.org/cgi/search.pl?search_terms=\(encoded)&json=1&page_size=15&fields=product_name,nutriments&lc=de") else { return [] }
        guard let (data, _) = try? await URLSession.shared.data(from: url) else { return [] }
        guard let resp = try? JSONDecoder().decode(OFFSearchResponse.self, from: data) else { return [] }
        return resp.products.compactMap { p in
            guard let name = p.product_name?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty else { return nil }
            return RecentFood(
                id: UUID().uuidString,
                name: name,
                calories: Int((p.nutriments?.energyKcal100g ?? 0).rounded()),
                protein: Int((p.nutriments?.proteins100g ?? 0).rounded()),
                carbs: Int((p.nutriments?.carbohydrates100g ?? 0).rounded()),
                fat: Int((p.nutriments?.fat100g ?? 0).rounded())
            )
        }
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

// MARK: - Manual food entry sheet (used for barcode prefill only)

struct ManualFoodEntrySheet: View {
    @Environment(\.dismiss) private var dismiss

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

    init(prefill: ScannedFood?, selectedCategory: MealCategory, onSaved: @escaping () -> Void) {
        self.prefill = prefill
        self.selectedCategory = selectedCategory
        self.onSaved = onSaved
        _category = State(initialValue: selectedCategory)
        if let f = prefill {
            _name = State(initialValue: f.name)
            _caloriesText = State(initialValue: f.calories > 0 ? "\(f.calories)" : "")
            _proteinText = State(initialValue: f.protein > 0 ? "\(f.protein)" : "")
            _carbsText = State(initialValue: f.carbs > 0 ? "\(f.carbs)" : "")
            _fatText = State(initialValue: f.fat > 0 ? "\(f.fat)" : "")
        }
    }

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty && Int(caloriesText) != nil
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                Button("Abbrechen") { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                    .frame(width: 100, alignment: .leading)
                Spacer()
                Text("Produkt hinzufügen")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button {
                    Task { await save() }
                } label: {
                    if isSaving {
                        ProgressView().tint(FrigyBrand.primaryDark)
                    } else {
                        Text("Hinzufügen")
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
                        Text("LEBENSMITTEL")
                            .font(.system(size: 10, weight: .bold)).tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted).padding(.bottom, 10)
                        TextField("Name eingeben", text: $name)
                            .font(.system(size: 16)).foregroundColor(FrigyBrand.text)
                    }
                    .padding(16).frigyCard(cornerRadius: 16)

                    VStack(alignment: .leading, spacing: 0) {
                        Text("NÄHRWERTE (PRO 100g)")
                            .font(.system(size: 10, weight: .bold)).tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted).padding(.bottom, 4)
                        VStack(spacing: 0) {
                            macroRow("Kalorien", unit: "kcal", text: $caloriesText, color: FrigyBrand.primaryDark)
                            Divider().padding(.leading, 8)
                            macroRow("Protein",  unit: "g", text: $proteinText,  color: Color(hex: "#60A5FA"))
                            Divider().padding(.leading, 8)
                            macroRow("Kohlenhydrate", unit: "g", text: $carbsText, color: Color(hex: "#FBBF24"))
                            Divider().padding(.leading, 8)
                            macroRow("Fett", unit: "g", text: $fatText, color: Color(hex: "#F87171"))
                        }
                    }
                    .padding(16).frigyCard(cornerRadius: 16)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("MAHLZEIT")
                            .font(.system(size: 10, weight: .bold)).tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(MealCategory.allCases, id: \.self) { cat in
                                    Button {
                                        withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) { category = cat }
                                    } label: {
                                        Label(cat.rawValue, systemImage: cat.icon)
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

                    Button { Task { await save() } } label: {
                        Text(isSaving ? "Wird gespeichert..." : "Hinzufügen")
                            .font(.system(size: 17, weight: .semibold)).foregroundColor(.white)
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(canSave
                                          ? AnyShapeStyle(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing))
                                          : AnyShapeStyle(FrigyBrand.cardBorder))
                                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(canSave ? 0.35 : 0), lineWidth: 1).blendMode(.overlay))
                            )
                            .shadow(color: canSave ? FrigyBrand.primaryDeep.opacity(0.28) : .clear, radius: 12, y: 6)
                    }
                    .disabled(!canSave || isSaving).buttonStyle(.plain)

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20).padding(.top, 4)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
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
        await TrackerDataService.shared.addFoodEntry(
            name: name.trimmingCharacters(in: .whitespaces),
            calories: Int(caloriesText) ?? 0,
            protein: Int(proteinText) ?? 0,
            carbs: Int(carbsText) ?? 0,
            fat: Int(fatText) ?? 0,
            portion: "1 Portion",
            category: category
        )
        isSaving = false
        dismiss()
        onSaved()
    }
}
