import SwiftUI
import UserNotifications

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

// MARK: - Profile

struct ProfileView: View {
    @Environment(AppRouter.self) private var router
    @State private var userEmail: String = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Avatar + email
                VStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Color(hex: "#DCFEEF"))
                            .frame(width: 88, height: 88)
                        Image(systemName: "person.fill")
                            .font(.system(size: 40))
                            .foregroundColor(Color(hex: "#39D47F"))
                    }
                    Text(userEmail.isEmpty ? "Mein Profil" : userEmail)
                        .font(.system(size: userEmail.isEmpty ? 20 : 15, weight: .bold))
                        .foregroundColor(Color(hex: "#1F2937"))
                        .lineLimit(1)
                }
                .padding(.top, 8)

                // Settings rows
                VStack(spacing: 0) {
                    NavigationLink(destination: NutritionGoalsView()) {
                        profileRow("Ernährungsziele", icon: "target", color: Color(hex: "#60A5FA"))
                    }
                    .buttonStyle(.plain)
                    Divider().padding(.leading, 52)
                    NavigationLink(destination: RemindersView()) {
                        profileRow("Benachrichtigungen", icon: "bell.fill", color: Color(hex: "#FBBF24"))
                    }
                    .buttonStyle(.plain)
                    Divider().padding(.leading, 52)
                    NavigationLink(destination: SubscriptionView()) {
                        profileRow("Abonnement", icon: "crown.fill", color: Color(hex: "#F59E0B"))
                    }
                    .buttonStyle(.plain)
                    Divider().padding(.leading, 52)
                    NavigationLink(destination: PrivacyView()) {
                        profileRow("Datenschutz", icon: "lock.fill", color: Color(hex: "#A78BFA"))
                    }
                    .buttonStyle(.plain)
                    Divider().padding(.leading, 52)
                    NavigationLink(destination: HelpView()) {
                        profileRow("Hilfe & Support", icon: "questionmark.circle.fill", color: Color(hex: "#6B7280"))
                    }
                    .buttonStyle(.plain)
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

                Spacer().frame(height: 32)
            }
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Profil")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            userEmail = await TrackerDataService.shared.loadUserEmail() ?? ""
        }
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

// MARK: - Nutrition Goals

struct NutritionGoalsView: View {
    @State private var targets = MacroTargets.default
    @State private var isSaving = false
    @State private var saved = false

    var body: some View {
        Form {
            Section {
                goalRow("Kalorien", value: $targets.calories, range: 1000...4000, step: 50, unit: "kcal", color: Color(hex: "#39D47F"))
                goalRow("Protein", value: $targets.protein, range: 30...300, step: 5, unit: "g", color: Color(hex: "#60A5FA"))
                goalRow("Kohlenhydrate", value: $targets.carbs, range: 50...600, step: 10, unit: "g", color: Color(hex: "#FBBF24"))
                goalRow("Fett", value: $targets.fat, range: 20...200, step: 5, unit: "g", color: Color(hex: "#F87171"))
            } header: {
                Text("Tagesziele")
            } footer: {
                Text("Diese Werte werden auf dem Dashboard angezeigt und für dein Kalorienbudget genutzt.")
            }

            Section {
                Button {
                    Task { await save() }
                } label: {
                    HStack {
                        Spacer()
                        if isSaving {
                            ProgressView().tint(Color(hex: "#39D47F"))
                        } else if saved {
                            Label("Gespeichert", systemImage: "checkmark.circle.fill")
                                .foregroundColor(Color(hex: "#39D47F"))
                                .fontWeight(.semibold)
                        } else {
                            Text("Ziele speichern")
                                .fontWeight(.semibold)
                                .foregroundColor(Color(hex: "#39D47F"))
                        }
                        Spacer()
                    }
                }
                .disabled(isSaving)
            }
        }
        .navigationTitle("Ernährungsziele")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func goalRow(_ label: String, value: Binding<Int>, range: ClosedRange<Double>, step: Double, unit: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: "#1F2937"))
                Spacer()
                Text("\(value.wrappedValue) \(unit)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(color)
            }
            Slider(
                value: Binding(
                    get: { Double(value.wrappedValue) },
                    set: { value.wrappedValue = Int($0) }
                ),
                in: range,
                step: step
            )
            .tint(color)
        }
        .padding(.vertical, 4)
    }

    private func load() async {
        let (_, t) = await TrackerDataService.shared.loadToday()
        targets = t
    }

    private func save() async {
        isSaving = true
        saved = false
        let ok = await TrackerDataService.shared.saveTargets(targets)
        isSaving = false
        if ok { saved = true }
    }
}

// MARK: - Subscription

struct SubscriptionView: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Crown icon
                ZStack {
                    Circle()
                        .fill(Color(hex: "#FEF3C7"))
                        .frame(width: 80, height: 80)
                    Image(systemName: "crown.fill")
                        .font(.system(size: 36))
                        .foregroundColor(Color(hex: "#F59E0B"))
                }
                .padding(.top, 32)

                VStack(spacing: 8) {
                    Text(router.isPremium ? "Frigy Premium" : "Frigy Free")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(Color(hex: "#1F2937"))
                    Text(router.isPremium
                         ? "Du hast Zugriff auf alle Premium-Features."
                         : "Upgrade auf Premium für alle Features.")
                        .font(.system(size: 14))
                        .foregroundColor(Color(hex: "#6B7280"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                if !router.isPremium {
                    VStack(spacing: 10) {
                        featureRow("Unbegrenzte KI-Mahlzeitenpläne", icon: "sparkles")
                        featureRow("KI-Coach ohne Limits", icon: "brain.head.profile")
                        featureRow("Barcode & Foto-Scan", icon: "camera.fill")
                        featureRow("Erweiterte Fortschrittsdiagramme", icon: "chart.line.uptrend.xyaxis")
                    }
                    .padding(.horizontal, 20)

                    Button {
                    } label: {
                        Text("Jetzt upgraden – 4,99 € / Monat")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(LinearGradient(colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")], startPoint: .leading, endPoint: .trailing))
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: Color(hex: "#39D47F").opacity(0.25), radius: 10, y: 5)
                    }
                    .padding(.horizontal, 20)
                }

                Spacer().frame(height: 32)
            }
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Abonnement")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func featureRow(_ text: String, icon: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(Color(hex: "#39D47F"))
                .frame(width: 28)
            Text(text)
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "#374151"))
            Spacer()
        }
        .padding(14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.03), radius: 3, y: 1)
    }
}

// MARK: - Privacy

struct PrivacyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Group {
                    privacySection("Datenerhebung", text: "Frigy speichert nur die Daten, die du aktiv eingibst: Mahlzeiten, Gewicht und Einstellungen. Alle Daten werden sicher in unserer Datenbank gespeichert.")
                    privacySection("Datenweitergabe", text: "Deine persönlichen Daten werden niemals an Dritte verkauft oder ohne deine Zustimmung weitergegeben.")
                    privacySection("Datenlöschung", text: "Du kannst jederzeit die Löschung deiner Daten beantragen, indem du uns unter support@frigy.app kontaktierst.")
                    privacySection("KI-Verarbeitung", text: "Anfragen an den KI-Coach werden verschlüsselt übertragen und nicht zur Modellverbesserung genutzt.")
                }
                .padding(.horizontal, 20)

                Spacer().frame(height: 32)
            }
            .padding(.top, 16)
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Datenschutz")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func privacySection(_ title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(Color(hex: "#1F2937"))
            Text(text)
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "#6B7280"))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.03), radius: 4, y: 2)
    }
}

// MARK: - Help

struct HelpView: View {
    var body: some View {
        List {
            Section("Kontakt") {
                Label("support@frigy.app", systemImage: "envelope.fill")
                    .foregroundColor(Color(hex: "#39D47F"))
                Label("app.frigy.app", systemImage: "globe")
                    .foregroundColor(Color(hex: "#39D47F"))
            }
            Section("Häufige Fragen") {
                helpRow("Wie tracke ich Mahlzeiten?", answer: "Tippe im Home-Tab auf + oder wähle eine Mahlzeitkategorie, um Lebensmittel zu suchen und zu tracken.")
                helpRow("Wie ändere ich meine Kalorienzziele?", answer: "Gehe zu Profil → Ernährungsziele und passe die Werte mit den Schiebereglern an.")
                helpRow("Kann ich Gewicht tracken?", answer: "Ja! Im Home-Tab auf 'Gewicht' tippen, dann auf + um ein neues Gewicht einzutragen.")
            }
        }
        .navigationTitle("Hilfe & Support")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func helpRow(_ question: String, answer: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(question)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(Color(hex: "#1F2937"))
            Text(answer)
                .font(.system(size: 13))
                .foregroundColor(Color(hex: "#6B7280"))
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Weight Progress

struct WeightProgressView: View {
    @State private var entries: [(date: String, kg: Double)] = []
    @State private var isLoading = true
    @State private var showAddWeight = false
    @State private var newWeightText = ""

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
                        Text("Tippe auf +, um dein erstes Gewicht einzutragen.")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#6B7280"))
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
                    .padding(.horizontal, 30)
                }

                if !entries.isEmpty {
                    // Stat cards
                    HStack(spacing: 12) {
                        statCard("Aktuell", value: String(format: "%.1f kg", entries.last?.kg ?? 0), icon: "scalemass.fill")
                        statCard("Start", value: String(format: "%.1f kg", entries.first?.kg ?? 0), icon: "flag.fill")
                        let diff = (entries.first?.kg ?? 0) - (entries.last?.kg ?? 0)
                        statCard(diff >= 0 ? "Verlust" : "Zuwachs",
                                 value: String(format: "%.1f kg", abs(diff)),
                                 icon: diff >= 0 ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                    }
                    .padding(.horizontal, 20)

                    // Bar chart
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Verlauf")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color(hex: "#1F2937"))
                            .padding(.horizontal, 20)

                        HStack(alignment: .bottom, spacing: 6) {
                            ForEach(Array(entries.enumerated()), id: \.offset) { _, e in
                                VStack(spacing: 4) {
                                    let frac = maxKg > minKg ? (e.kg - minKg) / (maxKg - minKg) : 0.5
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
            }
            .padding(.top, 8)
        }
        .background(Color(hex: "#FBFFFD").ignoresSafeArea())
        .navigationTitle("Gewichtsverlauf")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    newWeightText = ""
                    showAddWeight = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(hex: "#39D47F"))
                }
            }
        }
        .sheet(isPresented: $showAddWeight) {
            AddWeightSheet(onSave: { kg in
                Task {
                    await TrackerDataService.shared.addWeightEntry(kg: kg)
                    await load()
                }
            })
        }
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

// MARK: - Add Weight Sheet

struct AddWeightSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onSave: (Double) -> Void

    @State private var text = ""
    @FocusState private var focused: Bool
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                Spacer()

                VStack(spacing: 8) {
                    Image(systemName: "scalemass.fill")
                        .font(.system(size: 40))
                        .foregroundColor(Color(hex: "#39D47F"))
                    Text("Gewicht eintragen")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(hex: "#1F2937"))
                }

                HStack(spacing: 8) {
                    TextField("z.B. 74,5", text: $text)
                        .keyboardType(.decimalPad)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .multilineTextAlignment(.center)
                        .foregroundColor(Color(hex: "#1F2937"))
                        .focused($focused)
                    Text("kg")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                }
                .padding(20)
                .background(Color(hex: "#F3F4F6"))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 40)

                Button {
                    let normalized = text.replacingOccurrences(of: ",", with: ".")
                    guard let kg = Double(normalized), kg > 0 else { return }
                    isSaving = true
                    onSave(kg)
                    dismiss()
                } label: {
                    Text(isSaving ? "Wird gespeichert…" : "Speichern")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(
                            LinearGradient(
                                colors: text.isEmpty
                                    ? [Color(hex: "#BCFDDC"), Color(hex: "#BCFDDC")]
                                    : [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .disabled(text.isEmpty || isSaving)
                .padding(.horizontal, 24)

                Spacer()
            }
            .background(Color(hex: "#FBFFFD").ignoresSafeArea())
            .navigationTitle("Gewicht")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Abbrechen") { dismiss() }
                        .foregroundColor(Color(hex: "#39D47F"))
                }
            }
            .onAppear { focused = true }
        }
    }
}

// MARK: - Chatbot

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
                reply ?? "Ich konnte gerade keine Antwort laden. Bitte prüfe deine Verbindung und versuche es erneut."
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

// MARK: - Badges

struct BadgeCatalogItem: Identifiable {
    let id: String        // matches user_badges.badge_type
    let icon: String
    let name: String
    let desc: String
}

struct BadgesView: View {
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

// MARK: - Food Entry

struct FoodEntryView: View {
    let id: UUID

    var body: some View {
        Text("Lebensmitteleintrag \(id.uuidString.prefix(8))")
            .navigationTitle("Eintrag")
            .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Meal Detail

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

// MARK: - Reminders

struct ReminderItem: Identifiable, Codable, Equatable {
    var id: String
    var hour: Int
    var minute: Int
    var label: String
    var enabled: Bool

    var timeString: String { String(format: "%02d:%02d", hour, minute) }
}

private let remindersKey = "frigy.reminders.v1"

struct RemindersView: View {
    @State private var reminders: [ReminderItem] = Self.defaultReminders()
    @State private var hasPermission = false
    @State private var showPermissionBanner = false

    private static func defaultReminders() -> [ReminderItem] {
        if let data = UserDefaults.standard.data(forKey: remindersKey),
           let saved = try? JSONDecoder().decode([ReminderItem].self, from: data) {
            return saved
        }
        return [
            ReminderItem(id: "frigy.breakfast", hour: 8, minute: 0, label: "Frühstück tracken", enabled: true),
            ReminderItem(id: "frigy.lunch",     hour: 12, minute: 30, label: "Mittagessen tracken", enabled: true),
            ReminderItem(id: "frigy.dinner",    hour: 19, minute: 0, label: "Abendessen tracken", enabled: false),
        ]
    }

    private func save() {
        if let data = try? JSONEncoder().encode(reminders) {
            UserDefaults.standard.set(data, forKey: remindersKey)
        }
    }

    private func scheduleOrCancel(_ item: ReminderItem) {
        let center = UNUserNotificationCenter.current()
        if item.enabled {
            let content = UNMutableNotificationContent()
            content.title = "Frigy"
            content.body = item.label
            content.sound = .default
            var comps = DateComponents()
            comps.hour = item.hour
            comps.minute = item.minute
            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
            let request = UNNotificationRequest(identifier: item.id, content: content, trigger: trigger)
            center.add(request)
        } else {
            center.removePendingNotificationRequests(withIdentifiers: [item.id])
        }
    }

    private func checkPermission() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        hasPermission = settings.authorizationStatus == .authorized
        showPermissionBanner = settings.authorizationStatus == .notDetermined || settings.authorizationStatus == .denied
    }

    private func requestPermission() async {
        let granted = (try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        hasPermission = granted
        showPermissionBanner = !granted
    }

    var body: some View {
        List {
            if showPermissionBanner {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Benachrichtigungen nicht aktiv", systemImage: "bell.slash.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Color(hex: "#F59E0B"))
                        Text("Aktiviere Benachrichtigungen, um Mahlzeiterinnerungen zu erhalten.")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#6B7280"))
                        Button {
                            Task { await requestPermission() }
                        } label: {
                            Text("Jetzt aktivieren")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(Color(hex: "#39D47F"))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.vertical, 4)
                }
            }

            Section("Erinnerungen") {
                ForEach($reminders) { $reminder in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(reminder.timeString)
                                .font(.system(size: 18, weight: .bold, design: .monospaced))
                                .foregroundColor(Color(hex: "#1F2937"))
                            Text(reminder.label)
                                .font(.system(size: 13))
                                .foregroundColor(Color(hex: "#6B7280"))
                        }
                        Spacer()
                        Toggle("", isOn: $reminder.enabled)
                            .tint(Color(hex: "#39D47F"))
                            .onChange(of: reminder.enabled) { _, _ in
                                scheduleOrCancel(reminder)
                                save()
                            }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .navigationTitle("Erinnerungen")
        .navigationBarTitleDisplayMode(.inline)
        .task { await checkPermission() }
    }
}

// MARK: - Meal Plan Preferences

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

// MARK: - Shopping sub-views

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
