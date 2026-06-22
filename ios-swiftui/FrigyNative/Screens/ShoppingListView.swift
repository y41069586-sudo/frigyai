import SwiftUI

// MARK: - Model

struct ShoppingItem: Identifiable, Codable, Equatable {
    var id: UUID
    var name: String
    var amount: String
    var category: ShoppingCategory
    var isChecked: Bool

    init(id: UUID = UUID(), name: String, amount: String = "", category: ShoppingCategory, isChecked: Bool = false) {
        self.id = id
        self.name = name
        self.amount = amount
        self.category = category
        self.isChecked = isChecked
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

// MARK: - View

private let shoppingItemsKey = "frigy.shoppingItems.v1"

struct ShoppingListView: View {
    @State private var items: [ShoppingItem] = Self.loadItems()
    @State private var newItemName = ""
    @State private var showAddItem = false

    private static func loadItems() -> [ShoppingItem] {
        guard let data = UserDefaults.standard.data(forKey: shoppingItemsKey),
              let saved = try? JSONDecoder().decode([ShoppingItem].self, from: data),
              !saved.isEmpty else {
            return demoItems()
        }
        return saved
    }

    private func save() {
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: shoppingItemsKey)
        }
    }

    private var unchecked: [ShoppingItem] { items.filter { !$0.isChecked } }
    private var checked: [ShoppingItem] { items.filter { $0.isChecked } }
    private var progress: Double {
        items.isEmpty ? 0 : Double(checked.count) / Double(items.count)
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 20) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Einkaufsliste")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text("\(unchecked.count) von \(items.count) Artikeln übrig")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#9CA3AF"))
                    }
                    Spacer()
                    Button {
                        showAddItem = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)

                // Progress bar
                if !items.isEmpty {
                    VStack(spacing: 6) {
                        HStack {
                            Text("\(Int(progress * 100))% erledigt")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(Color(hex: "#39D47F"))
                            Spacer()
                            Text("\(checked.count) / \(items.count)")
                                .font(.system(size: 13))
                                .foregroundColor(Color(hex: "#9CA3AF"))
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color(hex: "#BCFDDC").opacity(0.4)).frame(height: 6)
                                Capsule()
                                    .fill(LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")], startPoint: .leading, endPoint: .trailing))
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
                        Text("Erledigt (\(checked.count))")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Color(hex: "#9CA3AF"))
                            .padding(.horizontal, 20)

                        VStack(spacing: 6) {
                            ForEach(checked) { item in
                                CheckedItemRow(item: item, onToggle: toggle)
                            }
                        }
                        .padding(.horizontal, 20)

                        Button {
                            items.removeAll { $0.isChecked }
                            save()
                        } label: {
                            Label("Erledigte entfernen", systemImage: "trash")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(Color(hex: "#EF4444"))
                        }
                        .padding(.horizontal, 20)
                    }
                }

                if items.isEmpty {
                    VStack(spacing: 14) {
                        Image(systemName: "cart.badge.checkmark")
                            .font(.system(size: 44))
                            .foregroundColor(Color(hex: "#BCFDDC"))
                        Text("Einkaufsliste ist leer")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Color(hex: "#6B7280"))
                        Text("Tippe auf +, um Artikel hinzuzufügen, oder generiere eine Liste aus deinem Wochenplan.")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#9CA3AF"))
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 32)
                    .padding(.top, 40)
                }

                Spacer().frame(height: 100)
            }
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showAddItem) {
            AddShoppingItemSheet { name, cat in
                items.append(ShoppingItem(name: name, category: cat))
                save()
            }
        }
        .onChange(of: items) { save() }
    }

    private func toggle(_ item: ShoppingItem) {
        guard let idx = items.firstIndex(where: { $0.id == item.id }) else { return }
        withAnimation(.spring(duration: 0.25)) {
            items[idx].isChecked.toggle()
        }
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
                    .foregroundColor(Color(hex: "#1F2937"))
                Text("(\(items.count))")
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#9CA3AF"))
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
            Button { onToggle(item) } label: {
                ZStack {
                    Circle()
                        .stroke(item.isChecked ? accentColor : Color(hex: "#BCFDDC"), lineWidth: 2)
                        .frame(width: 24, height: 24)
                    if item.isChecked {
                        Circle().fill(accentColor).frame(width: 24, height: 24)
                        Image(systemName: "checkmark").font(.system(size: 11, weight: .bold)).foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(.plain)

            Text(item.name)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(item.isChecked ? Color(hex: "#9CA3AF") : Color(hex: "#1F2937"))
                .strikethrough(item.isChecked)

            Spacer()

            if !item.amount.isEmpty {
                Text(item.amount)
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#9CA3AF"))
            }
        }
        .padding(12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 13))
        .shadow(color: .black.opacity(0.03), radius: 3, y: 1)
    }
}

struct CheckedItemRow: View {
    let item: ShoppingItem
    let onToggle: (ShoppingItem) -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button { onToggle(item) } label: {
                ZStack {
                    Circle().fill(Color(hex: "#D1FAE5")).frame(width: 24, height: 24)
                    Image(systemName: "checkmark").font(.system(size: 11, weight: .bold)).foregroundColor(Color(hex: "#6EE7B7"))
                }
            }
            .buttonStyle(.plain)
            Text(item.name)
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "#9CA3AF"))
                .strikethrough()
            Spacer()
        }
        .padding(10)
        .background(Color(hex: "#F9FAFB"))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Add item sheet

struct AddShoppingItemSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onAdd: (String, ShoppingCategory) -> Void

    @State private var name = ""
    @State private var selectedCategory: ShoppingCategory = .produce
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            Form {
                Section("Artikel") {
                    TextField("Name eingeben", text: $name)
                        .focused($focused)
                }
                Section("Kategorie") {
                    Picker("Kategorie", selection: $selectedCategory) {
                        ForEach(ShoppingCategory.allCases, id: \.self) { cat in
                            Label(cat.rawValue, systemImage: cat.icon).tag(cat)
                        }
                    }
                    .pickerStyle(.inline)
                }
            }
            .navigationTitle("Artikel hinzufügen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Hinzufügen") {
                        if !name.trimmingCharacters(in: .whitespaces).isEmpty {
                            onAdd(name.trimmingCharacters(in: .whitespaces), selectedCategory)
                            dismiss()
                        }
                    }
                    .fontWeight(.semibold)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .onAppear { focused = true }
    }
}

// MARK: - Demo data

private func demoItems() -> [ShoppingItem] {
    [
        ShoppingItem(name: "Haferflocken", amount: "500g", category: .grains),
        ShoppingItem(name: "Blaubeeren", amount: "200g", category: .produce),
        ShoppingItem(name: "Bananen", amount: "6 Stück", category: .produce),
        ShoppingItem(name: "Spinat", amount: "300g", category: .produce),
        ShoppingItem(name: "Hähnchenbrust", amount: "800g", category: .protein),
        ShoppingItem(name: "Lachs", amount: "400g", category: .protein),
        ShoppingItem(name: "Eier", amount: "10 Stück", category: .protein),
        ShoppingItem(name: "Griechischer Joghurt", amount: "500g", category: .dairy),
        ShoppingItem(name: "Mozzarella", amount: "125g", category: .dairy),
        ShoppingItem(name: "Quinoa", amount: "300g", category: .grains),
        ShoppingItem(name: "Olivenöl", amount: "1 Flasche", category: .pantry),
        ShoppingItem(name: "Mandeln", amount: "200g", category: .pantry),
    ]
}
