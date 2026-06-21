import SwiftUI

struct TrackerLogMealView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var searchText = ""
    @State private var selectedCategory: MealCategory = .lunch
    @State private var isSearching = false
    @State private var showCameraPlaceholder = false

    private let recentFoods: [(name: String, kcal: Int, per: String)] = [
        ("Haferflocken mit Milch", 320, "100g"),
        ("Banane",               89,  "1 Stück"),
        ("Griechischer Joghurt", 130, "200g"),
        ("Vollkornbrot",         240, "2 Scheiben"),
        ("Hähnchenbrust",        165, "100g"),
        ("Avocado",              160, "½ Stück"),
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category picker
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

                Divider()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        // Scan options
                        HStack(spacing: 12) {
                            scanOption(
                                icon: "camera.fill",
                                label: "Foto scannen",
                                subtitle: "KI erkennt Zutaten",
                                color: Color(hex: "#75FBB2")
                            ) {
                                showCameraPlaceholder = true
                            }
                            scanOption(
                                icon: "barcode.viewfinder",
                                label: "Barcode",
                                subtitle: "Produkt einlesen",
                                color: Color(hex: "#A5B4FC")
                            ) {}
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 8)

                        // Search result placeholder
                        if !searchText.isEmpty {
                            VStack(spacing: 8) {
                                ForEach(recentFoods.filter {
                                    $0.name.localizedCaseInsensitiveContains(searchText)
                                }, id: \.name) { food in
                                    foodRow(food)
                                }
                                if recentFoods.filter({ $0.name.localizedCaseInsensitiveContains(searchText) }).isEmpty {
                                    Text("Keine Treffer für \"\(searchText)\"")
                                        .font(.system(size: 14))
                                        .foregroundColor(Color(hex: "#9CA3AF"))
                                        .padding(.top, 8)
                                }
                            }
                            .padding(.horizontal, 16)
                        } else {
                            // Recent foods
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Zuletzt gegessen")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(Color(hex: "#1F2937"))
                                    .padding(.horizontal, 16)

                                VStack(spacing: 6) {
                                    ForEach(recentFoods, id: \.name) { food in
                                        foodRow(food)
                                    }
                                }
                                .padding(.horizontal, 16)
                            }
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
        }
        .sheet(isPresented: $showCameraPlaceholder) {
            CameraScanPlaceholderView()
        }
    }

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

    private func foodRow(_ food: (name: String, kcal: Int, per: String)) -> some View {
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
                Text(food.per)
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "#9CA3AF"))
            }
            Spacer()
            Text("\(food.kcal) kcal")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(hex: "#6B7280"))
            Button {
                // Add meal
                dismiss()
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
}

// MARK: - Camera placeholder

struct CameraScanPlaceholderView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color(hex: "#1F2937").opacity(0.05))
                        .frame(width: 280, height: 280)
                    VStack(spacing: 12) {
                        Image(systemName: "camera.viewfinder")
                            .font(.system(size: 60))
                            .foregroundColor(Color(hex: "#75FBB2"))
                        Text("Kamera-Scan")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text("Richte die Kamera auf deine Mahlzeit.\nDie KI erkennt automatisch die Zutaten.")
                            .font(.system(size: 14))
                            .foregroundColor(Color(hex: "#6B7280"))
                            .multilineTextAlignment(.center)
                    }
                }
                Text("Kamera-Zugriff wird in der nächsten Version aktiviert.")
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#9CA3AF"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                Spacer()
            }
            .background(Color(hex: "#FBFFFD").ignoresSafeArea())
            .navigationTitle("KI-Scan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fertig") { dismiss() }
                }
            }
        }
    }
}
