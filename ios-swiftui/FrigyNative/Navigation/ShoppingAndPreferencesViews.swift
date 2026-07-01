import SwiftUI


// MARK: - Meal Plan Preferences

let prefMealsKey = "frigy.planPrefs.mealsPerDay"
let prefCuisinesKey = "frigy.planPrefs.cuisines"
let prefMaxPrepTimeKey = "frigy.planPrefs.maxPrepTime"
let prefCookFrequencyKey = "frigy.planPrefs.cookFrequency"
let prefBudgetKey = "frigy.planPrefs.budget"
let prefVarietyKey = "frigy.planPrefs.variety"

/// Mirrors `MealPlanPrefsInput` in `supabase/functions/generate-meal-plan/mealPlanPrefs.ts` —
/// keep the raw string values in sync with that file's accepted enums.
struct MealPlanCuisineOption: Identifiable {
    let id: String
    let label: String
}

let mealPlanCuisineOptions: [MealPlanCuisineOption] = [
    .init(id: "international", label: "International / gemischt"),
    .init(id: "asian", label: "Asiatisch"),
    .init(id: "north_african", label: "Nordafrikanisch"),
    .init(id: "south_african", label: "Südafrikanisch"),
    .init(id: "european", label: "Europäisch"),
    .init(id: "american", label: "Amerikanisch"),
    .init(id: "italian", label: "Italienisch"),
    .init(id: "german", label: "Deutsch"),
]

// MARK: - Edit Profile

struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang

    private static let stateKey = "onboardingPersistedState"

    @State private var draft: UserProfileDraft = Self.loadDraft()
    @State private var isSaving = false
    @State private var saveSuccess = false

    private static func loadDraft() -> UserProfileDraft {
        guard let data = UserDefaults.standard.data(forKey: stateKey),
              let state = try? JSONDecoder().decode(OnboardingPersistedState.self, from: data),
              let profile = state.context.userProfile else {
            return UserProfileDraft()
        }
        return profile
    }

    private func save() async {
        isSaving = true
        draft.recalculateMacrosIfPossible()
        // Persist back into onboarding state
        if let data = UserDefaults.standard.data(forKey: Self.stateKey),
           var state = try? JSONDecoder().decode(OnboardingPersistedState.self, from: data) {
            state.context.userProfile = draft
            if let encoded = try? JSONEncoder().encode(state) {
                UserDefaults.standard.set(encoded, forKey: Self.stateKey)
            }
        }
        // Sync macro targets to backend
        let targets = MacroTargets(calories: draft.dailyCalories, protein: draft.dailyProtein, carbs: draft.dailyCarbs, fat: draft.dailyFat)
        await TrackerDataService.shared.saveTargets(targets)
        isSaving = false
        saveSuccess = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { dismiss() }
    }

    var body: some View {
        let step1 = editProfileBaseContent.onChange(of: draft.weightKg) { _, _ in draft.recalculateMacrosIfPossible() }
        let step2 = step1.onChange(of: draft.heightCm) { _, _ in draft.recalculateMacrosIfPossible() }
        let step3 = step2.onChange(of: draft.age) { _, _ in draft.recalculateMacrosIfPossible() }
        let step4 = step3.onChange(of: draft.goalMode) { _, _ in draft.recalculateMacrosIfPossible() }
        return step4.onChange(of: draft.activityLevel) { _, _ in draft.recalculateMacrosIfPossible() }
    }

    private var editProfileBaseContent: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Profil bearbeiten"))
            ScrollView(showsIndicators: false) {
                editProfileFields
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .detailContentColumn()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }

    @ViewBuilder
    private var editProfileFields: some View {
        VStack(spacing: 20) {
            nameSection
            bodyStatsSection
            goalSection
            activitySection
            // Dietary preferences (Ernährungsweise) and allergies are configured
            // in the weekly-plan settings, so they were removed here to avoid a
            // duplicate, confusing second place to edit them.
            if draft.dailyCalories > 0 {
                macroSummarySection
            }
            saveButton
            Spacer().frame(height: 40)
        }
    }

    private var nameSection: some View {
        profileSection(title: lang.t("NAME")) {
            TextField(lang.t("Dein Name"), text: $draft.name)
                .font(.system(size: 16)).foregroundColor(FrigyBrand.text)
                .padding(12)
                .background(Color(UIColor.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private var bodyStatsSection: some View {
        profileSection(title: lang.t("KÖRPERDATEN")) {
            VStack(spacing: 12) {
                stepperRow(label: lang.t("Gewicht (kg)"), value: Int(draft.weightKg), range: 40...200) {
                    draft.weightKg = Double($0)
                }
                Divider()
                stepperRow(label: lang.t("Größe (cm)"), value: Int(draft.heightCm), range: 140...220) {
                    draft.heightCm = Double($0)
                }
                Divider()
                stepperRow(label: lang.t("Alter"), value: draft.age, range: 16...99) {
                    draft.age = $0
                }
            }
            .padding(14)
            .frigyCard(cornerRadius: 14)
        }
    }

    private var goalSection: some View {
        profileSection(title: lang.t("ZIEL")) {
            HStack(spacing: 8) {
                segmentButton(label: lang.t("Abnehmen"), isSelected: draft.goalMode == "lose") { draft.goalMode = "lose" }
                segmentButton(label: lang.t("Halten"), isSelected: draft.goalMode == "maintain") { draft.goalMode = "maintain" }
                segmentButton(label: lang.t("Zunehmen"), isSelected: draft.goalMode == "gain") { draft.goalMode = "gain" }
            }
        }
    }

    private var activitySection: some View {
        profileSection(title: lang.t("AKTIVITÄTSLEVEL")) {
            HStack(spacing: 8) {
                segmentButton(label: lang.t("Wenig"), isSelected: draft.activityLevel == "low") { draft.activityLevel = "low" }
                segmentButton(label: lang.t("Mittel"), isSelected: draft.activityLevel == "medium") { draft.activityLevel = "medium" }
                segmentButton(label: lang.t("Viel"), isSelected: draft.activityLevel == "high") { draft.activityLevel = "high" }
            }
        }
    }

    private var macroSummarySection: some View {
        profileSection(title: lang.t("BERECHNETE ZIELE")) {
            HStack(spacing: 0) {
                macroPreview(value: draft.dailyCalories, unit: "kcal", label: lang.t("Kalorien"), color: FrigyBrand.primaryDark)
                Divider().frame(height: 40)
                macroPreview(value: draft.dailyProtein, unit: "g", label: lang.t("Protein"), color: Color(hex: "#F87171"))
                Divider().frame(height: 40)
                macroPreview(value: draft.dailyCarbs, unit: "g", label: lang.t("Kohlenhydrate"), color: Color(hex: "#FBBF24"))
                Divider().frame(height: 40)
                macroPreview(value: draft.dailyFat, unit: "g", label: lang.t("Fett"), color: Color(hex: "#60A5FA"))
            }
            .padding(.vertical, 8)
            .frigyCard(cornerRadius: 14)
        }
    }

    private var saveButton: some View {
        let label: String = saveSuccess ? lang.t("Gespeichert!") : lang.t("Speichern")
        let bg: AnyShapeStyle = saveSuccess ? AnyShapeStyle(FrigyBrand.primaryDark) : AnyShapeStyle(FrigyBrand.buttonGradient)
        return Button {
            Task { await save() }
        } label: {
            HStack(spacing: 8) {
                if isSaving {
                    ProgressView().tint(.white).scaleEffect(0.9)
                } else if saveSuccess {
                    Image(systemName: "checkmark").font(.system(size: 14, weight: .bold))
                }
                Text(label).font(.system(size: 16, weight: .semibold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity).frame(height: 54)
            .background(bg)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .shadow(color: FrigyBrand.primary.opacity(0.4), radius: 10, y: 5)
        }
        .buttonStyle(.plain)
        .disabled(isSaving || saveSuccess)
        .animation(.easeInOut(duration: 0.2), value: saveSuccess)
    }

    @ViewBuilder
    private func profileSection(title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 10, weight: .bold)).tracking(1.2)
                .foregroundColor(FrigyBrand.textMuted)
            content()
        }
    }

    private func segmentButton(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        let fg: Color = isSelected ? .white : FrigyBrand.text
        let bg: Color = isSelected ? FrigyBrand.primaryDark : Color(UIColor.secondarySystemBackground)
        return Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(fg)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(bg)
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
    }

    private func stepperRow(label: String, value: Int, range: ClosedRange<Int>, onChange: @escaping (Int) -> Void) -> some View {
        HStack {
            Text(label).font(.system(size: 14)).foregroundColor(FrigyBrand.text)
            Spacer()
            HStack(spacing: 16) {
                Button { if value > range.lowerBound { onChange(value - 1) } } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 22)).foregroundColor(value > range.lowerBound ? FrigyBrand.primaryDark : FrigyBrand.textMuted.opacity(0.4))
                }
                .buttonStyle(.plain)
                Text("\(value)")
                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                    .foregroundColor(FrigyBrand.text)
                    .frame(minWidth: 40, alignment: .center)
                Button { if value < range.upperBound { onChange(value + 1) } } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 22)).foregroundColor(value < range.upperBound ? FrigyBrand.primaryDark : FrigyBrand.textMuted.opacity(0.4))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func macroPreview(value: Int, unit: String, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text("\(value)\(unit)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var x: CGFloat = 0; var y: CGFloat = 0; var rowH: CGFloat = 0
        for view in subviews {
            let s = view.sizeThatFits(.unspecified)
            if x + s.width > width && x > 0 { x = 0; y += rowH + spacing; rowH = 0 }
            rowH = max(rowH, s.height); x += s.width + spacing
        }
        return CGSize(width: width, height: y + rowH)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX; var y = bounds.minY; var rowH: CGFloat = 0
        for view in subviews {
            let s = view.sizeThatFits(.unspecified)
            if x + s.width > bounds.maxX && x > bounds.minX { x = bounds.minX; y += rowH + spacing; rowH = 0 }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            rowH = max(rowH, s.height); x += s.width + spacing
        }
    }
}

struct MealPlanPreferencesView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang

    private static func loadMeals() -> Int {
        let v = UserDefaults.standard.integer(forKey: prefMealsKey)
        return v > 0 ? max(3, min(6, v)) : 4
    }
    private static func loadCuisines() -> [String] {
        let stored = UserDefaults.standard.stringArray(forKey: prefCuisinesKey) ?? []
        let valid = stored.filter { id in mealPlanCuisineOptions.contains { $0.id == id } }
        return valid.isEmpty ? ["international"] : valid
    }
    private static func loadMaxPrepTime() -> String {
        UserDefaults.standard.string(forKey: prefMaxPrepTimeKey) ?? "30"
    }
    private static func loadCookFrequency() -> String {
        UserDefaults.standard.string(forKey: prefCookFrequencyKey) ?? "3_4"
    }
    private static func loadBudget() -> String {
        UserDefaults.standard.string(forKey: prefBudgetKey) ?? "medium"
    }
    private static func loadVariety() -> String {
        UserDefaults.standard.string(forKey: prefVarietyKey) ?? "varied"
    }

    @State private var mealsPerDay: Int = MealPlanPreferencesView.loadMeals()
    @State private var selectedCuisines: [String] = MealPlanPreferencesView.loadCuisines()
    @State private var maxPrepTime: String = MealPlanPreferencesView.loadMaxPrepTime()
    @State private var cookFrequency: String = MealPlanPreferencesView.loadCookFrequency()
    @State private var budget: String = MealPlanPreferencesView.loadBudget()
    @State private var variety: String = MealPlanPreferencesView.loadVariety()

    private let maxPrepTimeOptions: [(id: String, label: String)] = [
        ("10", "Max. 10 Min."),
        ("30", "Max. 30 Min."),
        ("60plus", "60+ Min."),
    ]
    private let cookFrequencyOptions: [(id: String, label: String)] = [
        ("daily", "Täglich frisch"),
        ("4_5", "4–5×/Woche"),
        ("3_4", "3–4×/Woche"),
        ("1_2", "1–2×/Woche"),
    ]
    private let budgetOptions: [(id: String, label: String)] = [
        ("cheap", "Günstig"),
        ("medium", "Mittel"),
        ("any", "Egal"),
    ]
    private let varietyOptions: [(id: String, label: String)] = [
        ("repeat_ok", "Wiederholungen OK"),
        ("varied", "Maximale Abwechslung"),
    ]

    var body: some View {
        let step1 = baseContent.onChange(of: mealsPerDay) { _, v in
            UserDefaults.standard.set(v, forKey: prefMealsKey)
        }
        let step2 = step1.onChange(of: selectedCuisines) { _, v in
            UserDefaults.standard.set(v, forKey: prefCuisinesKey)
        }
        let step3 = step2.onChange(of: maxPrepTime) { _, v in
            UserDefaults.standard.set(v, forKey: prefMaxPrepTimeKey)
        }
        let step4 = step3.onChange(of: cookFrequency) { _, v in
            UserDefaults.standard.set(v, forKey: prefCookFrequencyKey)
        }
        let step5 = step4.onChange(of: budget) { _, v in
            UserDefaults.standard.set(v, forKey: prefBudgetKey)
        }
        return step5.onChange(of: variety) { _, v in
            UserDefaults.standard.set(v, forKey: prefVarietyKey)
        }
    }

    private var baseContent: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Plan-Einstellungen"))
            ScrollView(showsIndicators: false) {
                preferencesContent
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
            }
            actionButtons
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }

    @ViewBuilder
    private var preferencesContent: some View {
        VStack(spacing: 20) {
            mealsSection
            cuisineSection
            prepTimeSection
            cookFreqSection
            budgetSection
            varietySection
            Spacer().frame(height: 16)
        }
    }

    // Left: just save the settings and go back. Right: save AND kick off a fresh
    // week-plan generation with these settings, then go back to the plan screen.
    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                Text(lang.t("Speichern"))
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(FrigyBrand.primaryDark)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(UIColor.secondarySystemBackground))
                            .overlay(RoundedRectangle(cornerRadius: 16)
                                .stroke(FrigyBrand.primaryDark.opacity(0.4), lineWidth: 1.5))
                    )
            }
            .buttonStyle(.plain)

            Button {
                NotificationCenter.default.post(name: .weekPlanShouldRegenerate, object: nil)
                dismiss()
            } label: {
                HStack(spacing: 7) {
                    Image(systemName: "sparkles")
                    Text(lang.t("Neu generieren"))
                }
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .shadow(color: FrigyBrand.primaryDeep.opacity(0.28), radius: 12, y: 6)
                )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .frame(maxWidth: 700)
        .frame(maxWidth: .infinity)
    }

    private var mealsSection: some View {
        sectionCard(title: lang.t("MAHLZEITEN PRO TAG")) {
            HStack {
                Button {
                    if mealsPerDay > 3 { mealsPerDay -= 1 }
                } label: {
                    stepperIcon("minus", enabled: mealsPerDay > 3)
                }
                .buttonStyle(.plain)
                Spacer()
                Text("\(mealsPerDay) \(lang.t("Mahlzeiten"))")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button {
                    if mealsPerDay < 6 { mealsPerDay += 1 }
                } label: {
                    stepperIcon("plus", enabled: mealsPerDay < 6)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func stepperIcon(_ name: String, enabled: Bool) -> some View {
        Image(systemName: name)
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(enabled ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
            .frame(width: 40, height: 40)
            .background(Circle().fill(FrigyBrand.primary.opacity(enabled ? 0.15 : 0.05)))
    }

    private var cuisineSection: some View {
        sectionCard(title: lang.t("KÜCHEN-STILE")) {
            FlowLayout(spacing: 8) {
                ForEach(mealPlanCuisineOptions) { opt in
                    cuisineChip(opt)
                }
            }
        }
    }

    private var prepTimeSection: some View {
        sectionCard(title: lang.t("MAX. ZUBEREITUNGSZEIT")) {
            FlowLayout(spacing: 8) {
                ForEach(maxPrepTimeOptions, id: \.id) { opt in
                    optionChip(id: opt.id, label: opt.label, selection: $maxPrepTime)
                }
            }
        }
    }

    private var cookFreqSection: some View {
        sectionCard(title: lang.t("KOCHHÄUFIGKEIT")) {
            FlowLayout(spacing: 8) {
                ForEach(cookFrequencyOptions, id: \.id) { opt in
                    optionChip(id: opt.id, label: opt.label, selection: $cookFrequency)
                }
            }
        }
    }

    private var budgetSection: some View {
        sectionCard(title: lang.t("BUDGET")) {
            FlowLayout(spacing: 8) {
                ForEach(budgetOptions, id: \.id) { opt in
                    optionChip(id: opt.id, label: opt.label, selection: $budget)
                }
            }
        }
    }

    private var varietySection: some View {
        sectionCard(title: lang.t("ABWECHSLUNG")) {
            FlowLayout(spacing: 8) {
                ForEach(varietyOptions, id: \.id) { opt in
                    optionChip(id: opt.id, label: opt.label, selection: $variety)
                }
            }
        }
    }

    @ViewBuilder
    private func sectionCard<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 10, weight: .bold))
                .tracking(1.5)
                .foregroundColor(FrigyBrand.textMuted)
            content()
        }
        .padding(16)
        .frigyCard(cornerRadius: 16)
    }

    private func cuisineChip(_ opt: MealPlanCuisineOption) -> some View {
        let isOn = selectedCuisines.contains(opt.id)
        return Button {
            if isOn {
                if selectedCuisines.count > 1 { selectedCuisines.removeAll { $0 == opt.id } }
            } else {
                selectedCuisines.append(opt.id)
            }
        } label: {
            Text(lang.t(opt.label))
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(isOn ? .white : FrigyBrand.text)
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(isOn ? FrigyBrand.primaryDark : Color(UIColor.secondarySystemBackground))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(isOn ? FrigyBrand.primaryDark : FrigyBrand.cardBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.25), value: isOn)
    }

    private func optionChip(id: String, label: String, selection: Binding<String>) -> some View {
        let isOn = selection.wrappedValue == id
        return Button {
            selection.wrappedValue = id
        } label: {
            Text(lang.t(label))
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(isOn ? .white : FrigyBrand.text)
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(isOn ? FrigyBrand.primaryDark : Color(UIColor.secondarySystemBackground))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(isOn ? FrigyBrand.primaryDark : FrigyBrand.cardBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.25), value: isOn)
    }
}

// MARK: - Impressum

struct ImpressumView: View {
    @Environment(LanguageManager.self) private var lang

    private var sections: [(icon: String, color: String, title: String, text: String)] {
        [
            ("building.2.fill",           "#60B4FF", lang.t("Anbieter"),
             "Doaa Attia\nWilhelm-Diess-Weg 3a\n94081 Fürstenzell\n\(lang.t("Deutschland"))"),
            ("envelope.fill",             "#34D399", lang.t("Kontakt"),
             "E-Mail: support@frigy.app\nWebsite: app.frigy.app"),
            ("exclamationmark.circle.fill","#FBBF24", lang.t("Haftungsausschluss"),
             lang.t("Die Inhalte dieser App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität können wir keine Gewähr übernehmen. Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich.")),
            ("c.circle.fill",             "#A78BFA", lang.t("Urheberrecht"),
             lang.t("Die durch die Seitenbetreiber erstellten Inhalte und Werke in dieser App unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.")),
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Impressum"))

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    legalBanner(icon: "building.2.fill", color: "#60B4FF",
                                title: lang.t("Impressum"),
                                subtitle: lang.t("Angaben gemäß § 5 TMG"))

                    legalCard(sections: sections)

                    legalFooter(lang.t("Stand: Januar 2025"))
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
    }
}

// MARK: - AGB

struct AGBView: View {
    @Environment(LanguageManager.self) private var lang

    private var sections: [(icon: String, color: String, title: String, text: String)] {
        [
            ("doc.text.fill",         "#60B4FF", lang.t("§1 Geltungsbereich"),
             lang.t("Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Frigy App und aller zugehörigen Dienste.")),
            ("sparkles",              "#A78BFA", lang.t("§2 Leistungsumfang"),
             lang.t("Frigy bietet eine Ernährungs-Tracking-App mit KI-gestützten Funktionen. Der genaue Leistungsumfang richtet sich nach dem gewählten Abonnement.")),
            ("creditcard.fill",       "#34D399", lang.t("§3 Abonnement & Zahlung"),
             lang.t("Premium-Abonnements werden über den Apple App Store abgewickelt. Das Abonnement verlängert sich automatisch, sofern es nicht mindestens 24 Stunden vor Ablauf der aktuellen Periode über die App-Store-Einstellungen gekündigt wird.")),
            ("arrow.uturn.backward",  "#FBBF24", lang.t("§4 Widerrufsrecht"),
             lang.t("Bei digitalen Inhalten erlischt das Widerrufsrecht, sobald die Ausführung begonnen hat und du ausdrücklich zugestimmt hast, dass der Vertrag vor Ablauf der Widerrufsfrist erfüllt wird.")),
            ("exclamationmark.shield.fill", "#F87171", lang.t("§5 Haftungsbeschränkung"),
             lang.t("Frigy haftet nicht für Schäden, die durch die Nutzung der App entstehen, soweit diese nicht auf Vorsatz oder grober Fahrlässigkeit beruhen. Die Nährwertangaben sind informativ und ersetzen keine medizinische Beratung.")),
            ("pencil.circle.fill",    "#9CA3AF", lang.t("§6 Änderungen der AGB"),
             lang.t("Frigy behält sich das Recht vor, diese AGB jederzeit zu ändern. Wesentliche Änderungen werden 30 Tage vor Inkrafttreten mitgeteilt.")),
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("AGB"))

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    legalBanner(icon: "doc.badge.gearshape.fill", color: "#6366F1",
                                title: lang.t("Allgemeine Geschäftsbedingungen"),
                                subtitle: lang.t("Nutzungsbedingungen für Frigy"))

                    legalCard(sections: sections)

                    legalFooter(lang.t("Stand: Januar 2025\nEs gilt deutsches Recht."))
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
    }
}

// MARK: - Shared legal helpers

func legalBanner(icon: String, color: String, title: String, subtitle: String) -> some View {
    HStack(spacing: 16) {
        ZStack {
            RoundedRectangle(cornerRadius: 18)
                .fill(Color(hex: color).opacity(0.15))
                .frame(width: 56, height: 56)
            Image(systemName: icon)
                .font(.system(size: 24, weight: .semibold))
                .foregroundColor(Color(hex: color))
        }
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(FrigyBrand.text)
            Text(subtitle)
                .font(.system(size: 13))
                .foregroundColor(FrigyBrand.textMuted)
        }
        Spacer()
    }
    .padding(16)
    .frigyCard(cornerRadius: 18)
}

func legalCard(sections: [(icon: String, color: String, title: String, text: String)]) -> some View {
    VStack(spacing: 0) {
        ForEach(Array(sections.enumerated()), id: \.offset) { idx, section in
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(hex: section.color).opacity(0.15))
                            .frame(width: 32, height: 32)
                        Image(systemName: section.icon)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(Color(hex: section.color))
                    }
                    Text(section.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 8)

                Text(section.text)
                    .font(.system(size: 13))
                    .foregroundColor(FrigyBrand.textMuted)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if idx < sections.count - 1 {
                Divider()
                    .padding(.leading, 60)
            }
        }
    }
    .frigyCard(cornerRadius: 18)
}

func legalFooter(_ text: String) -> some View {
    Text(text)
        .font(.system(size: 11))
        .foregroundColor(FrigyBrand.textMuted.opacity(0.6))
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
}

// MARK: - Shopping sub-views

struct ShoppingCategoryView: View {
    @Environment(LanguageManager.self) private var lang
    let name: String

    private var category: ShoppingCategory? { ShoppingCategory.allCases.first { $0.rawValue == name } }
    private var items: [ShoppingItem] {
        guard let cat = category else { return [] }
        guard let data = UserDefaults.standard.data(forKey: "frigy.shoppingItems.v2"),
              let all = try? JSONDecoder().decode([ShoppingItem].self, from: data) else { return [] }
        return all.filter { $0.category == cat }
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t(name))

            if items.isEmpty {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: category?.icon ?? "bag")
                        .font(.system(size: 44)).foregroundColor(FrigyBrand.cardBorder)
                    Text(lang.t("Keine Artikel in dieser Kategorie"))
                        .font(.system(size: 16, weight: .semibold)).foregroundColor(FrigyBrand.text)
                }
                Spacer()
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 8) {
                        ForEach(items) { item in
                            HStack(spacing: 12) {
                                ZStack {
                                    Circle()
                                        .fill(item.isChecked ? Color(hex: "#D1FAE5") : (category?.color ?? FrigyBrand.primary).opacity(0.15))
                                        .frame(width: 36, height: 36)
                                    Image(systemName: item.isChecked ? "checkmark" : (category?.icon ?? "bag"))
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(item.isChecked ? Color(hex: "#10B981") : (category?.color ?? FrigyBrand.primary))
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.name)
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundColor(item.isChecked ? FrigyBrand.textMuted : FrigyBrand.text)
                                        .strikethrough(item.isChecked)
                                    if !item.amount.isEmpty {
                                        Text(item.amount).font(.system(size: 12)).foregroundColor(FrigyBrand.textMuted)
                                    }
                                }
                                Spacer()
                                if item.price > 0 {
                                    Text(String(format: "%.2f €", item.price))
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(FrigyBrand.primaryDark)
                                }
                            }
                            .padding(14)
                            .frigyCard(cornerRadius: 14)
                        }
                    }
                    .padding(.horizontal, 20).padding(.top, 8)
                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}

struct ShoppingItemDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang
    let id: String

    @State private var item: ShoppingItem? = nil
    @State private var showEdit = false
    @State private var showDeleteConfirm = false

    private func loadItem() {
        guard let uuid = UUID(uuidString: id) else { return }
        item = ShoppingListStore.load().first { $0.id == uuid }
    }

    private func deleteItem() {
        guard let uuid = UUID(uuidString: id) else { return }
        var items = ShoppingListStore.load()
        items.removeAll { $0.id == uuid }
        ShoppingListStore.saveAndSync(items)
        NotificationCenter.default.post(name: ShoppingListStore.didChange, object: nil)
        dismiss()
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(
                title: item?.name ?? lang.t("Artikel"),
                trailingIcon: "trash",
                trailingAction: { showDeleteConfirm = true }
            )

            if let it = item {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        ZStack {
                            Circle().fill(it.category.color.opacity(0.15)).frame(width: 80, height: 80)
                            Image(systemName: it.category.icon)
                                .font(.system(size: 36, weight: .semibold))
                                .foregroundColor(it.category.color)
                        }.padding(.top, 20)

                        Text(it.name)
                            .font(.system(size: 22, weight: .black)).foregroundColor(FrigyBrand.text)

                        VStack(spacing: 0) {
                            detailRow(lang.t("Kategorie"), value: lang.t(it.category.rawValue))
                            Divider().padding(.leading, 16)
                            if !it.amount.isEmpty {
                                detailRow(lang.t("Menge"), value: it.amount)
                                Divider().padding(.leading, 16)
                            }
                            if it.price > 0 {
                                detailRow(lang.t("Preis"), value: String(format: "%.2f €", it.price))
                                Divider().padding(.leading, 16)
                            }
                            detailRow(lang.t("Status"), value: it.isChecked ? lang.t("Erledigt ✓") : lang.t("Offen"))
                        }
                        .frigyCard(cornerRadius: 16)
                        .padding(.horizontal, 20)

                        Button {
                            showEdit = true
                        } label: {
                            Label(lang.t("Bearbeiten"), systemImage: "pencil")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(FrigyBrand.primaryDark)
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(FrigyBrand.selectedBg)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.borderMint, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20)

                        Spacer().frame(height: 32)
                    }
                }
            } else {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "bag.badge.questionmark")
                        .font(.system(size: 44)).foregroundColor(FrigyBrand.cardBorder)
                    Text(lang.t("Artikel nicht gefunden"))
                        .font(.system(size: 16, weight: .semibold)).foregroundColor(FrigyBrand.text)
                }
                Spacer()
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .onAppear { loadItem() }
        .sheet(isPresented: $showEdit, onDismiss: { loadItem() }) {
            if let it = item {
                EditShoppingItemSheet(item: it)
            }
        }
        .confirmationDialog(lang.t("Artikel löschen?"), isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button(lang.t("Löschen"), role: .destructive) { deleteItem() }
            Button(lang.t("Abbrechen"), role: .cancel) { }
        }
    }

    private func detailRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label).font(.system(size: 14)).foregroundColor(FrigyBrand.textMuted)
            Spacer()
            Text(value).font(.system(size: 14, weight: .semibold)).foregroundColor(FrigyBrand.text)
        }
        .padding(14)
    }
}

struct EditShoppingItemSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang
    let item: ShoppingItem

    @State private var name: String
    @State private var amount: String
    @State private var price: String
    @State private var category: ShoppingCategory

    init(item: ShoppingItem) {
        self.item = item
        _name = State(initialValue: item.name)
        _amount = State(initialValue: item.amount)
        _price = State(initialValue: item.price > 0 ? String(format: "%.2f", item.price) : "")
        _category = State(initialValue: item.category)
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(lang.t("Abbrechen")) { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                Spacer()
                Text(lang.t("Bearbeiten"))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button(lang.t("Speichern")) { saveAndDismiss() }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(name.trimmingCharacters(in: .whitespaces).isEmpty ? FrigyBrand.textMuted : FrigyBrand.primaryDark)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(lang.t("NAME")).font(.system(size: 10, weight: .bold)).tracking(1.2).foregroundColor(FrigyBrand.textMuted)
                        TextField(lang.t("Artikelname"), text: $name)
                            .font(.system(size: 16))
                            .foregroundColor(FrigyBrand.text)
                            .padding(12)
                            .background(Color(UIColor.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text(lang.t("MENGE")).font(.system(size: 10, weight: .bold)).tracking(1.2).foregroundColor(FrigyBrand.textMuted)
                        TextField(lang.t("z.B. 500g, 2 Stück"), text: $amount)
                            .font(.system(size: 16))
                            .foregroundColor(FrigyBrand.text)
                            .padding(12)
                            .background(Color(UIColor.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text(lang.t("PREIS (€)")).font(.system(size: 10, weight: .bold)).tracking(1.2).foregroundColor(FrigyBrand.textMuted)
                        TextField("0.00", text: $price)
                            .font(.system(size: 16))
                            .foregroundColor(FrigyBrand.text)
                            .keyboardType(.decimalPad)
                            .padding(12)
                            .background(Color(UIColor.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text(lang.t("KATEGORIE")).font(.system(size: 10, weight: .bold)).tracking(1.2).foregroundColor(FrigyBrand.textMuted)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(ShoppingCategory.allCases, id: \.self) { cat in
                                Button {
                                    withAnimation(.spring(response: 0.25)) { category = cat }
                                } label: {
                                    VStack(spacing: 6) {
                                        Image(systemName: cat.icon)
                                            .font(.system(size: 18, weight: .semibold))
                                            .foregroundColor(category == cat ? .white : cat.color)
                                        Text(lang.t(cat.rawValue))
                                            .font(.system(size: 10, weight: .semibold))
                                            .foregroundColor(category == cat ? .white : FrigyBrand.text)
                                            .lineLimit(2)
                                            .multilineTextAlignment(.center)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(category == cat ? cat.color : Color(UIColor.secondarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
    }

    private func saveAndDismiss() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        var items = ShoppingListStore.load()
        if let idx = items.firstIndex(where: { $0.id == item.id }) {
            items[idx].name = trimmed
            items[idx].amount = amount.trimmingCharacters(in: .whitespaces)
            items[idx].price = Double(price.replacingOccurrences(of: ",", with: ".")) ?? 0
            items[idx].category = category
            ShoppingListStore.saveAndSync(items)
            NotificationCenter.default.post(name: ShoppingListStore.didChange, object: nil)
        }
        dismiss()
    }
}
