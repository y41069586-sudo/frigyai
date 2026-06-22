import SwiftUI

// MARK: - Route Views

struct HomeRouteView: View {
    let route: HomeRoute

    var body: some View {
        switch route {
        case .profile:      ProfileView()
        case .badges:       BadgesView()
        case .foodEntry(let id): FoodEntryView(id: id)
        case .chatbot:      ChatbotView()
        case .weightProgress: WeightProgressView()
        }
    }
}

struct PlansRouteView: View {
    let route: PlansRoute

    var body: some View {
        switch route {
        case .mealDetail(let id):
            MealDetailView(id: id)
        case .reminders:
            RemindersView()
        case .preferences:
            MealPlanPreferencesView()
        }
    }
}

struct ShoppingRouteView: View {
    let route: ShoppingRoute

    var body: some View {
        switch route {
        case .category(let name): ShoppingCategoryView(name: name)
        case .item(let id):       ShoppingItemDetailView(id: id)
        }
    }
}

// MARK: - Tab Roots

struct HomeTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .home)) {
            HomeDashboardView()
                .navigationDestination(for: HomeRoute.self) { route in
                    HomeRouteView(route: route)
                }
        }
        .onAppear { tabCoordinator.markTabActivated(.home) }
    }
}

struct PlansTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .plans)) {
            MealPlansView()
                .navigationDestination(for: PlansRoute.self) { route in
                    PlansRouteView(route: route)
                }
        }
        .onAppear { tabCoordinator.markTabActivated(.plans) }
    }
}

struct ShoppingTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .shopping)) {
            ShoppingListView()
                .navigationDestination(for: ShoppingRoute.self) { route in
                    ShoppingRouteView(route: route)
                }
        }
        .onAppear { tabCoordinator.markTabActivated(.shopping) }
    }
}

// MARK: - Detail Views

struct ProfileView: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Avatar
                VStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Color(hex: "#DCFEEF"))
                            .frame(width: 88, height: 88)
                        Image(systemName: "person.fill")
                            .font(.system(size: 40))
                            .foregroundColor(Color(hex: "#39D47F"))
                    }
                    Text("Mein Profil")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(hex: "#1F2937"))
                }
                .padding(.top, 8)

                // Settings rows
                VStack(spacing: 0) {
                    profileRow("Persönliche Daten", icon: "person.crop.circle.fill", color: Color(hex: "#75FBB2"))
                    Divider().padding(.leading, 52)
                    profileRow("Ernährungsziele", icon: "target", color: Color(hex: "#60A5FA"))
                    Divider().padding(.leading, 52)
                    profileRow("Benachrichtigungen", icon: "bell.fill", color: Color(hex: "#FBBF24"))
                    Divider().padding(.leading, 52)
                    profileRow("Abonnement", icon: "crown.fill", color: Color(hex: "#F59E0B"))
                    Divider().padding(.leading, 52)
                    profileRow("Datenschutz", icon: "lock.fill", color: Color(hex: "#A78BFA"))
                    Divider().padding(.leading, 52)
                    profileRow("Hilfe & Support", icon: "questionmark.circle.fill", color: Color(hex: "#6B7280"))
                }
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                .padding(.horizontal, 20)

                Button {
                    Task { await router.signOut() }
                } label: {
                    Label("Abmelden", systemImage: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(hex: "#EF4444"))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color(hex: "#FEF2F2"))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 20)
            }
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Profil")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func profileRow(_ label: String, icon: String, color: Color) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(color.opacity(0.15))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(color)
            }
            Text(label)
                .font(.system(size: 15))
                .foregroundColor(Color(hex: "#1F2937"))
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13))
                .foregroundColor(Color(hex: "#D1D5DB"))
        }
        .padding(14)
    }
}

struct WeightProgressView: View {
    @State private var entries: [(date: String, kg: Double)] = []
    @State private var isLoading = true
    private var minKg: Double { (entries.map(\.kg).min() ?? 80) - 0.5 }
    private var maxKg: Double { (entries.map(\.kg).max() ?? 90) + 0.5 }

    private static let labelFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "d.M."
        return f
    }()

    private func load() async {
        let points = await TrackerDataService.shared.loadWeightEntries()
        entries = points.map { (Self.labelFormatter.string(from: $0.date), $0.kg) }
        isLoading = false
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if !isLoading && entries.isEmpty {
                    VStack(spacing: 10) {
                        Image(systemName: "scalemass")
                            .font(.system(size: 40))
                            .foregroundColor(Color(hex: "#BCFDDC"))
                        Text("Noch keine Gewichtseinträge")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text("Trage dein Gewicht ein, um deinen Verlauf zu sehen.")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#6B7280"))
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
                    .padding(.horizontal, 30)
                }

                // Current weight card
                HStack(spacing: 20) {
                    statCard("Aktuell", value: String(format: "%.1f kg", entries.last?.kg ?? 0), icon: "scalemass.fill")
                    statCard("Start", value: String(format: "%.1f kg", entries.first?.kg ?? 0), icon: "flag.fill")
                    statCard("Verlust", value: String(format: "%.1f kg", abs((entries.first?.kg ?? 0) - (entries.last?.kg ?? 0))), icon: "arrow.down.circle.fill")
                }
                .padding(.horizontal, 20)

                // Simple bar chart
                VStack(alignment: .leading, spacing: 12) {
                    Text("Diese Woche")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(hex: "#1F2937"))
                        .padding(.horizontal, 20)

                    HStack(alignment: .bottom, spacing: 6) {
                        ForEach(Array(entries.enumerated()), id: \.offset) { _, e in
                            VStack(spacing: 4) {
                                let frac = (maxKg - e.kg) / (maxKg - minKg)
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")], startPoint: .top, endPoint: .bottom))
                                    .frame(maxWidth: .infinity)
                                    .frame(height: max(8, CGFloat(frac) * 80))
                                Text(e.date)
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundColor(Color(hex: "#9CA3AF"))
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 100, alignment: .bottom)
                    .padding(.horizontal, 20)
                }
                .padding(.vertical, 16)
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
                .padding(.horizontal, 20)
            }
            .padding(.top, 8)
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Gewichtsverlauf")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func statCard(_ label: String, value: String, icon: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(Color(hex: "#39D47F"))
            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(Color(hex: "#1F2937"))
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "#9CA3AF"))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
    }
}

struct ChatbotView: View {
    @State private var messages: [(role: String, text: String)] = [
        ("assistant", "Hallo! Ich bin dein KI-Ernährungscoach. Wie kann ich dir heute helfen?"),
    ]
    @State private var inputText = ""
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages.indices, id: \.self) { i in
                            let msg = messages[i]
                            ChatBubble(text: msg.text, isUser: msg.role == "user")
                                .id(i)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .onChange(of: messages.count) { _, _ in
                    withAnimation { proxy.scrollTo(messages.count - 1) }
                }
            }

            // Input bar
            HStack(spacing: 10) {
                TextField("Frag mich etwas...", text: $inputText, axis: .vertical)
                    .lineLimit(1...4)
                    .font(.system(size: 15))
                    .padding(10)
                    .background(Color(hex: "#F3F4F6"))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .focused($inputFocused)

                Button {
                    sendMessage()
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 30))
                        .foregroundColor(inputText.isEmpty ? Color(hex: "#D1FAE5") : Color(hex: "#39D47F"))
                }
                .disabled(inputText.isEmpty)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.white)
            .overlay(Divider(), alignment: .top)
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("KI-Ernährungscoach")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        messages.append(("user", text))
        inputText = ""

        let history = messages.map { ChatTurn(role: $0.role, content: $0.text) }
        Task {
            let reply = await TrackerDataService.shared.sendChatMessage(text, history: history)
            messages.append((
                "assistant",
                reply ?? "Ich konnte gerade keine Antwort laden. Bitte prüfe deine Verbindung und versuche es erneut. 🌿"
            ))
        }
    }
}

struct ChatBubble: View {
    let text: String
    let isUser: Bool

    var body: some View {
        HStack {
            if isUser { Spacer() }
            Text(text)
                .font(.system(size: 15))
                .foregroundColor(isUser ? .white : Color(hex: "#1F2937"))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(isUser
                    ? LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")], startPoint: .topLeading, endPoint: .bottomTrailing)
                    : LinearGradient(colors: [.white, .white], startPoint: .leading, endPoint: .trailing))
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
                .containerRelativeFrame(.horizontal) { width, _ in width * 0.75 }
            if !isUser { Spacer() }
        }
    }
}

struct BadgeCatalogItem: Identifiable {
    let id: String        // matches user_badges.badge_type
    let icon: String
    let name: String
    let desc: String
}

struct BadgesView: View {
    // Catalog keyed by badge_type — unlocked state comes from user_badges.
    private let catalog: [BadgeCatalogItem] = [
        .init(id: "streak_3",  icon: "flame.fill",          name: "3-Tage-Serie",   desc: "3 Tage in Folge aktiv"),
        .init(id: "streak_7",  icon: "bolt.fill",           name: "7-Tage-Serie",   desc: "Eine ganze Woche!"),
        .init(id: "streak_14", icon: "flame.circle.fill",   name: "14-Tage-Serie",  desc: "Zwei starke Wochen"),
        .init(id: "streak_30", icon: "trophy.fill",         name: "30-Tage-Serie",  desc: "Ein ganzer Monat!"),
        .init(id: "water_goal", icon: "drop.fill",          name: "Wasserziel",     desc: "Tagesziel Wasser erreicht"),
        .init(id: "water_week", icon: "drop.circle.fill",   name: "Hydration-Held", desc: "7 Tage Wasserziel"),
        .init(id: "first_scan", icon: "camera.fill",        name: "Erster Scan",    desc: "Erste Mahlzeit gescannt"),
        .init(id: "meal_logged", icon: "fork.knife",        name: "Erste Mahlzeit", desc: "Erste Mahlzeit getrackt"),
        .init(id: "weight_tracked", icon: "scalemass.fill", name: "Gewicht getrackt", desc: "Erstes Gewicht erfasst"),
        .init(id: "calorie_goal_3", icon: "target",         name: "3 Tage im Ziel", desc: "3 Tage im Kalorienbudget"),
        .init(id: "calorie_goal_7", icon: "diamond.fill",   name: "7 Tage im Ziel", desc: "7 Tage im Kalorienbudget"),
        .init(id: "protein_champion", icon: "bolt.heart.fill", name: "Protein-Champion", desc: "5× Proteinziel erreicht"),
        .init(id: "scanner_pro", icon: "iphone",            name: "Scanner-Profi",  desc: "20 Mahlzeiten gescannt"),
        .init(id: "weight_loss_1", icon: "arrow.down.circle.fill", name: "Erstes Kilo", desc: "1 kg abgenommen"),
        .init(id: "weight_loss_5", icon: "medal.fill",      name: "Fünf Kilo",      desc: "5 kg abgenommen"),
        .init(id: "calorie_week_perfect", icon: "sparkles", name: "Perfekte Woche", desc: "7 Tage in Folge im Budget"),
        .init(id: "comeback",   icon: "arrow.clockwise",    name: "Comeback",       desc: "Nach Pause zurück"),
    ]

    @State private var unlockedTypes: Set<String> = []

    private func load() async {
        let earned = await TrackerDataService.shared.loadBadges()
        unlockedTypes = Set(earned.map(\.type))
    }

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                ForEach(catalog) { badge in
                    let unlocked = unlockedTypes.contains(badge.id)
                    VStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(unlocked ? Color(hex: "#DCFEEF") : Color(hex: "#F3F4F6"))
                                .frame(width: 60, height: 60)
                            Image(systemName: badge.icon)
                                .font(.system(size: 26, weight: .semibold))
                                .foregroundColor(unlocked ? Color(hex: "#39D47F") : Color(hex: "#D1D5DB"))
                        }
                        Text(badge.name)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(unlocked ? Color(hex: "#1F2937") : Color(hex: "#9CA3AF"))
                        Text(badge.desc)
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "#9CA3AF"))
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
                    .opacity(unlocked ? 1 : 0.5)
                }
            }
            .padding(20)
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Abzeichen")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }
}

struct FoodEntryView: View {
    let id: UUID

    var body: some View {
        Text("Lebensmitteleintrag \(id.uuidString.prefix(8))")
            .navigationTitle("Eintrag")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct MealDetailView: View {
    let id: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(id)
                    .font(.title2.bold())
                    .foregroundColor(Color(hex: "#1F2937"))
                Text("Rezeptdetails werden hier angezeigt.")
                    .foregroundColor(Color(hex: "#6B7280"))
            }
            .padding(20)
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Mahlzeit")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct RemindersView: View {
    @State private var reminders = [
        (time: "08:00", label: "Frühstück tracken", enabled: true),
        (time: "12:30", label: "Mittagessen tracken", enabled: true),
        (time: "19:00", label: "Abendessen tracken", enabled: false),
    ]

    var body: some View {
        List {
            ForEach(reminders.indices, id: \.self) { i in
                HStack {
                    VStack(alignment: .leading) {
                        Text(reminders[i].time)
                            .font(.system(size: 18, weight: .bold, design: .monospaced))
                            .foregroundColor(Color(hex: "#1F2937"))
                        Text(reminders[i].label)
                            .font(.system(size: 14))
                            .foregroundColor(Color(hex: "#6B7280"))
                    }
                    Spacer()
                    Toggle("", isOn: .constant(reminders[i].enabled))
                        .tint(Color(hex: "#39D47F"))
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Erinnerungen")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct MealPlanPreferencesView: View {
    @State private var calories = 1900.0
    @State private var mealsPerDay = 3

    var body: some View {
        Form {
            Section("Tägliche Kalorien") {
                VStack(alignment: .leading) {
                    Text("\(Int(calories)) kcal")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(hex: "#39D47F"))
                    Slider(value: $calories, in: 1200...3500, step: 50)
                        .tint(Color(hex: "#39D47F"))
                }
            }
            Section("Mahlzeiten pro Tag") {
                Stepper("\(mealsPerDay) Mahlzeiten", value: $mealsPerDay, in: 2...6)
            }
        }
        .navigationTitle("Plan-Einstellungen")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ShoppingCategoryView: View {
    let name: String

    var body: some View {
        Text("Kategorie: \(name)")
            .navigationTitle(name)
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct ShoppingItemDetailView: View {
    let id: String

    var body: some View {
        Text("Artikel: \(id)")
            .navigationTitle("Artikel")
            .navigationBarTitleDisplayMode(.inline)
    }
}
