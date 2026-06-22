import SwiftUI

struct TrackerLogMealView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var searchText = ""
    @State private var selectedCategory: MealCategory = .lunch
    @State private var recentFoods: [RecentFood] = []
    @State private var isLoading = true
    @State private var showBarcodeScanner = false
    @State private var showManualEntry = false
    @State private var prefillFood: ScannedFood?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                categoryPicker

                Divider()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        scanOptions
                            .padding(.horizontal, 16)
                            .padding(.top, 8)

                        if isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                                .padding(.top, 40)
                        } else if !searchText.isEmpty {
                            searchResults
                                .padding(.horizontal, 16)
                        } else {
                            recentFoodsSection
                        }

                        Spacer().frame(height: 32)
                    }
                }
            }
            .background(Color(hex: "#FBFFFD").ignoresSafeArea())
            .navigationTitle("\(selectedCategory.rawValue) tracken")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Lebensmittel suchen...")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Schließen") { dismiss() }
                        .foregroundColor(Color(hex: "#39D47F"))
                }
            }
            .task { await loadFoods() }
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
            ) {
                dismiss()
            }
            .onDisappear { prefillFood = nil }
        }
    }

    // MARK: - Subviews

    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(MealCategory.allCases, id: \.self) { cat in
                    Button {
                        selectedCategory = cat
                    } label: {
                        Label(cat.rawValue, systemImage: cat.icon)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(selectedCategory == cat ? .white : Color(hex: "#39D47F"))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(selectedCategory == cat
                                ? LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")], startPoint: .leading, endPoint: .trailing)
                                : LinearGradient(colors: [Color(hex: "#DCFEEF"), Color(hex: "#DCFEEF")], startPoint: .leading, endPoint: .trailing))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
    }

    private var scanOptions: some View {
        HStack(spacing: 12) {
            scanOption(
                icon: "barcode.viewfinder",
                label: "Barcode",
                subtitle: "Produkt einlesen",
                color: Color(hex: "#A5B4FC")
            ) {
                showBarcodeScanner = true
            }
            scanOption(
                icon: "square.and.pencil",
                label: "Manuell",
                subtitle: "Selbst eingeben",
                color: Color(hex: "#75FBB2")
            ) {
                prefillFood = nil
                showManualEntry = true
            }
        }
    }

    @ViewBuilder private var searchResults: some View {
        let filtered = recentFoods.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        VStack(spacing: 8) {
            ForEach(filtered) { food in
                recentFoodRow(food)
            }
            if filtered.isEmpty {
                Text("Keine Treffer für \"\(searchText)\"")
                    .font(.system(size: 14))
                    .foregroundColor(Color(hex: "#9CA3AF"))
                    .padding(.top, 8)
            }
        }
    }

    @ViewBuilder private var recentFoodsSection: some View {
        if recentFoods.isEmpty {
            VStack(spacing: 12) {
                Image(systemName: "fork.knife")
                    .font(.system(size: 40))
                    .foregroundColor(Color(hex: "#BCFDDC"))
                Text("Noch nichts geloggt")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(hex: "#6B7280"))
                Text("Scanne einen Barcode oder gib ein Lebensmittel manuell ein.")
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
                        recentFoodRow(food)
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }

    // MARK: - Helpers

    private func scanOption(icon: String, label: String, subtitle: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(color.opacity(0.2))
                        .frame(width: 48, height: 48)
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(color == Color(hex: "#75FBB2") ? Color(hex: "#2EB56D") : color)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(hex: "#1F2937"))
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#BCFDDC"))
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
        }
        .buttonStyle(.plain)
    }

    private func recentFoodRow(_ food: RecentFood) -> some View {
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
                        name: food.name,
                        calories: food.calories,
                        protein: food.protein,
                        carbs: food.carbs,
                        fat: food.fat,
                        portion: "100g",
                        category: selectedCategory
                    )
                    dismiss()
                }
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 22))
                    .foregroundColor(Color(hex: "#75FBB2"))
            }
        }
        .padding(12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.03), radius: 3, y: 1)
    }

    private func loadFoods() async {
        isLoading = true
        recentFoods = await TrackerDataService.shared.loadRecentFoods()
        isLoading = false
    }
}

// MARK: - Manual food entry sheet

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
        NavigationStack {
            Form {
                Section("Lebensmittel") {
                    TextField("Name", text: $name)
                }

                Section("Nährwerte (pro Portion)") {
                    macroField("Kalorien (kcal)", text: $caloriesText)
                    macroField("Protein (g)", text: $proteinText)
                    macroField("Kohlenhydrate (g)", text: $carbsText)
                    macroField("Fett (g)", text: $fatText)
                }

                Section("Kategorie") {
                    Picker("Mahlzeit", selection: $category) {
                        ForEach(MealCategory.allCases, id: \.self) { cat in
                            Label(cat.rawValue, systemImage: cat.icon).tag(cat)
                        }
                    }
                }
            }
            .navigationTitle(prefill != nil ? "Produkt hinzufügen" : "Manuell eingeben")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text("Hinzufügen")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(!canSave || isSaving)
                }
            }
        }
    }

    private func macroField(_ label: String, text: Binding<String>) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField("0", text: text)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 80)
        }
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
