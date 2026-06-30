import SwiftUI

// MARK: - Model

struct ShoppingItem: Identifiable, Codable, Equatable {
    var id: UUID
    var name: String
    var amount: String
    var category: ShoppingCategory
    var isChecked: Bool
    var price: Double

    init(id: UUID = UUID(), name: String, amount: String = "", category: ShoppingCategory, isChecked: Bool = false, price: Double = 0) {
        self.id = id
        self.name = name
        self.amount = amount
        self.category = category
        self.isChecked = isChecked
        self.price = price
    }
}

enum ShoppingCategory: String, CaseIterable, Codable {
    case produce    = "Obst & Gemüse"
    case protein    = "Protein"
    case dairy      = "Milchprodukte"
    case grains     = "Getreide & Körner"
    case pantry     = "Vorratskammer"
    case other      = "Sonstiges"

    var icon: String {
        switch self {
        case .produce:  "leaf.fill"
        case .protein:  "fish.fill"
        case .dairy:    "drop.fill"
        case .grains:   "square.grid.3x3.fill"
        case .pantry:   "cabinet.fill"
        case .other:    "bag.fill"
        }
    }

    var color: Color {
        switch self {
        case .produce:  Color(hex: "#34D399")
        case .protein:  Color(hex: "#F87171")
        case .dairy:    Color(hex: "#60A5FA")
        case .grains:   Color(hex: "#FBBF24")
        case .pantry:   Color(hex: "#A78BFA")
        case .other:    Color(hex: "#9CA3AF")
        }
    }
}

// MARK: - Shared store
//
// Single source of truth for the persisted shopping list so other screens (e.g.
// the fridge scan in MealPlansView) can append items and have this view refresh.

enum ShoppingListStore {
    static let key = "frigy.shoppingItems.v2"
    static let didChange = Notification.Name("frigy.shoppingList.didChange")

    static func load() -> [ShoppingItem] {
        guard let data = UserDefaults.standard.data(forKey: key),
              let saved = try? JSONDecoder().decode([ShoppingItem].self, from: data) else {
            return []
        }
        return saved
    }

    static func save(_ items: [ShoppingItem]) {
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    /// Save to UserDefaults and fire a background cloud sync.
    static func saveAndSync(_ items: [ShoppingItem]) {
        save(items)
        Task { await TrackerDataService.shared.saveShoppingItems(items) }
    }

    /// Append named items, deduped by case-insensitive name. Returns how many
    /// were actually added and notifies any live ShoppingListView to reload.
    @discardableResult
    static func add(names: [String], category: ShoppingCategory = .other) -> Int {
        var items = load()
        var existing = Set(items.map { $0.name.lowercased() })
        var added = 0
        for raw in names {
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty, !existing.contains(trimmed.lowercased()) else { continue }
            let display = trimmed.prefix(1).uppercased() + trimmed.dropFirst()
            items.append(ShoppingItem(name: display, category: category))
            existing.insert(trimmed.lowercased())
            added += 1
        }
        if added > 0 {
            saveAndSync(items)
            NotificationCenter.default.post(name: didChange, object: nil)
        }
        return added
    }
}

// MARK: - View

struct ShoppingListView: View {
    @Environment(LanguageManager.self) private var lang

    @State private var items: [ShoppingItem] = ShoppingListStore.load()
    @State private var newItemName = ""
    @State private var showAddSheet = false

    private var unchecked: [ShoppingItem] { items.filter { !$0.isChecked } }
    private var checked: [ShoppingItem] { items.filter { $0.isChecked } }
    private var totalPrice: Double { items.reduce(0) { $0 + $1.price } }
    private var progress: Double {
        items.isEmpty ? 0 : Double(checked.count) / Double(items.count)
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                // Header
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(lang.t("Einkaufsliste"))
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundColor(FrigyBrand.text)
                        Text("\(unchecked.count) von \(items.count) Artikeln übrig")
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    Spacer()
                    if totalPrice > 0 {
                        VStack(alignment: .trailing, spacing: 1) {
                            Text(String(format: "%.2f €", totalPrice))
                                .font(.system(size: 20, weight: .black, design: .rounded))
                                .foregroundColor(FrigyBrand.primaryDark)
                            Text(lang.t("geschätzt"))
                                .font(.system(size: 11))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                    }
                    Button { showAddSheet = true } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(
                                Circle().fill(LinearGradient(
                                    colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                    startPoint: .topLeading, endPoint: .bottomTrailing))
                            )
                            .shadow(color: FrigyBrand.primaryDeep.opacity(0.3), radius: 8, y: 4)
                    }
                    .buttonStyle(.plain)
                    .padding(.leading, 4)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)

                // Progress bar
                if !items.isEmpty {
                    VStack(spacing: 6) {
                        HStack {
                            Text("\(Int(progress * 100))% " + lang.t("erledigt"))
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(FrigyBrand.primaryDark)
                            Spacer()
                            Text("\(checked.count) / \(items.count)")
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(FrigyBrand.cardBorder.opacity(0.4)).frame(height: 6)
                                Capsule()
                                    .fill(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark], startPoint: .leading, endPoint: .trailing))
                                    .frame(width: max(6, geo.size.width * progress), height: 6)
                                    .animation(.spring(duration: 0.4), value: progress)
                            }
                        }
                        .frame(height: 6)
                    }
                    .padding(.horizontal, 20)
                }

                // Grouped by category
                ForEach(ShoppingCategory.allCases, id: \.self) { cat in
                    let catItems = unchecked.filter { $0.category == cat }
                    if !catItems.isEmpty {
                        ShoppingCategorySection(
                            category: cat,
                            items: catItems,
                            onToggle: toggle
                        )
                        .padding(.horizontal, 20)
                    }
                }

                // Checked items
                if !checked.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(lang.t("Erledigt") + " (\(checked.count))")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                            .padding(.horizontal, 20)

                        VStack(spacing: 6) {
                            ForEach(checked) { item in
                                CheckedItemRow(item: item, onToggle: toggle)
                            }
                        }
                        .padding(.horizontal, 20)

                        Button {
                            items.removeAll { $0.isChecked }
                            ShoppingListStore.saveAndSync(items)
                        } label: {
                            Label(lang.t("Erledigte entfernen"), systemImage: "trash")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(Color(hex: "#EF4444"))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(
                                    RoundedRectangle(cornerRadius: 10)
                                        .fill(.ultraThinMaterial)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color(hex: "#EF4444").opacity(0.3), lineWidth: 1)
                                        )
                                )
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20)
                    }
                }

                if items.isEmpty {
                    VStack(spacing: 14) {
                        Image(systemName: "cart.badge.checkmark")
                            .font(.system(size: 44))
                            .foregroundColor(FrigyBrand.cardBorder)
                        Text(lang.t("Einkaufsliste ist leer"))
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                        Text(lang.t("Tippe auf +, um Artikel hinzuzufügen, oder generiere eine Liste aus deinem Wochenplan."))
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 32)
                    .padding(.top, 40)
                }

                Spacer().frame(height: 100)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            if let cloud = await TrackerDataService.shared.loadShoppingItems() {
                items = cloud
                ShoppingListStore.save(cloud)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: ShoppingListStore.didChange)) { _ in
            items = ShoppingListStore.load()
        }
        .sheet(isPresented: $showAddSheet) {
            AddShoppingItemSheet { name, category in
                addItem(name: name, category: category)
            }
            .presentationDetents([.large])
        }
    }

    private func toggle(_ item: ShoppingItem) {
        guard let idx = items.firstIndex(where: { $0.id == item.id }) else { return }
        withAnimation(.spring(duration: 0.25)) {
            items[idx].isChecked.toggle()
        }
        ShoppingListStore.saveAndSync(items)
    }

    private func addItem(name: String, category: ShoppingCategory) {
        withAnimation(.spring(duration: 0.3)) {
            items.append(ShoppingItem(name: name, category: category))
        }
        ShoppingListStore.saveAndSync(items)
    }
}

// MARK: - Category section

struct ShoppingCategorySection: View {
    let category: ShoppingCategory
    let items: [ShoppingItem]
    let onToggle: (ShoppingItem) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: category.icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(category.color)
                Text(category.rawValue)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Text("(\(items.count))")
                    .font(.system(size: 13))
                    .foregroundColor(FrigyBrand.textMuted)
            }

            VStack(spacing: 6) {
                ForEach(items) { item in
                    ShoppingItemRow(item: item, accentColor: category.color, onToggle: onToggle)
                }
            }
        }
    }
}

struct ShoppingItemRow: View {
    let item: ShoppingItem
    let accentColor: Color
    let onToggle: (ShoppingItem) -> Void

    var body: some View {
        HStack(spacing: 12) {
            LiquidGlassCheckbox(isChecked: item.isChecked, accentColor: accentColor) {
                onToggle(item)
            }

            Text(item.name)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(item.isChecked ? FrigyBrand.textMuted : FrigyBrand.text)
                .strikethrough(item.isChecked)

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                if item.price > 0 {
                    Text(String(format: "%.2f €", item.price))
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(FrigyBrand.primaryDark)
                }
                if !item.amount.isEmpty {
                    Text(item.amount)
                        .font(.system(size: 12))
                        .foregroundColor(FrigyBrand.textMuted)
                }
            }
        }
        .padding(12)
        .frigyCard(cornerRadius: 13)
    }
}

struct CheckedItemRow: View {
    let item: ShoppingItem
    let onToggle: (ShoppingItem) -> Void

    var body: some View {
        HStack(spacing: 12) {
            LiquidGlassCheckbox(isChecked: true, accentColor: Color(hex: "#6EE7B7")) {
                onToggle(item)
            }
            Text(item.name)
                .font(.system(size: 14))
                .foregroundColor(FrigyBrand.textMuted)
                .strikethrough()
            Spacer()
        }
        .padding(10)
        .frigyCard(cornerRadius: 12)
    }
}

// MARK: - Add item sheet

struct AddShoppingItemSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onAdd: (String, ShoppingCategory) -> Void

    @State private var name = ""
    @State private var selectedCategory: ShoppingCategory = .produce
    @FocusState private var focused: Bool

    private var canAdd: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                Button("Abbrechen") { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                    .frame(width: 100, alignment: .leading)
                Spacer()
                Text("Artikel hinzufügen")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button("Hinzufügen") {
                    if canAdd {
                        onAdd(name.trimmingCharacters(in: .whitespaces), selectedCategory)
                        dismiss()
                    }
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(canAdd ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                .disabled(!canAdd)
                .buttonStyle(.plain)
                .frame(width: 100, alignment: .trailing)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("ARTIKEL")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)
                            .padding(.bottom, 10)
                        TextField("Name eingeben", text: $name)
                            .font(.system(size: 16))
                            .foregroundColor(FrigyBrand.text)
                            .focused($focused)
                    }
                    .padding(16)
                    .frigyCard(cornerRadius: 16)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("KATEGORIE")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)

                        VStack(spacing: 0) {
                            ForEach(ShoppingCategory.allCases, id: \.self) { cat in
                                Button {
                                    selectedCategory = cat
                                } label: {
                                    HStack(spacing: 12) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(selectedCategory == cat
                                                      ? FrigyBrand.primary.opacity(0.2)
                                                      : FrigyBrand.primary.opacity(0.08))
                                                .frame(width: 32, height: 32)
                                            Image(systemName: cat.icon)
                                                .font(.system(size: 14, weight: .semibold))
                                                .foregroundColor(FrigyBrand.primaryDark)
                                        }
                                        Text(cat.rawValue)
                                            .font(.system(size: 15))
                                            .foregroundColor(FrigyBrand.text)
                                        Spacer()
                                        if selectedCategory == cat {
                                            Image(systemName: "checkmark.circle.fill")
                                                .font(.system(size: 18))
                                                .foregroundColor(FrigyBrand.primaryDark)
                                        }
                                    }
                                    .padding(14)
                                }
                                .buttonStyle(.plain)
                                if cat != ShoppingCategory.allCases.last {
                                    Divider().padding(.leading, 58)
                                }
                            }
                        }
                        .frigyCard(cornerRadius: 16)
                    }

                    addItemButton

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 4)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .onAppear { focused = true }
    }

    private var addItemButton: some View {
        let fill: AnyShapeStyle = canAdd
            ? AnyShapeStyle(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                           startPoint: .topLeading, endPoint: .bottomTrailing))
            : AnyShapeStyle(FrigyBrand.cardBorder)
        let strokeOpacity: Double = canAdd ? 0.35 : 0
        let shadowColor: Color = canAdd ? FrigyBrand.primaryDeep.opacity(0.28) : .clear
        return Button {
            if canAdd {
                onAdd(name.trimmingCharacters(in: .whitespaces), selectedCategory)
                dismiss()
            }
        } label: {
            Text("Hinzufügen")
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(fill)
                        .overlay(RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(strokeOpacity), lineWidth: 1).blendMode(.overlay))
                )
                .shadow(color: shadowColor, radius: 12, y: 6)
        }
        .disabled(!canAdd)
        .buttonStyle(.plain)
    }
}

