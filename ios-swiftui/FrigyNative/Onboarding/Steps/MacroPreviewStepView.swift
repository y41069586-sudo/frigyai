import SwiftUI

struct MacroPreviewStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var showEditor = false
    @State private var appeared = false
    @State private var ringDraw: Double = 0

    init(profile: UserProfileDraft,
         progress: Double,
         onBack: (() -> Void)?,
         onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        var p = profile
        p.recalculateMacrosIfPossible()
        _draft = State(initialValue: p)
    }

    private var macroTotalGrams: Double {
        Double(draft.dailyProtein + draft.dailyCarbs + draft.dailyFat)
    }
    private var proteinPct: Double { macroTotalGrams > 0 ? Double(draft.dailyProtein) / macroTotalGrams : 0 }
    private var carbsPct: Double   { macroTotalGrams > 0 ? Double(draft.dailyCarbs)   / macroTotalGrams : 0 }
    private var fatPct: Double     { macroTotalGrams > 0 ? Double(draft.dailyFat)     / macroTotalGrams : 0 }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion("Dein täglicher\nErnährungsplan")
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    calorieRingCard
                        .opacity(appeared ? 1 : 0)
                        .scaleEffect(appeared ? 1 : 0.92)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(0.1), value: appeared)

                    macroBreakdownCard
                        .opacity(appeared ? 1 : 0)
                        .scaleEffect(appeared ? 1 : 0.92)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(0.22), value: appeared)

                    Button { showEditor = true } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "slider.horizontal.3")
                                .font(.system(size: 13, weight: .semibold))
                            Text("Werte anpassen")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(FrigyBrand.primaryDeep)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(FrigyBrand.selectedBg)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                    .opacity(appeared ? 1 : 0)
                    .animation(.easeOut(duration: 0.4).delay(0.32), value: appeared)

                    HStack(spacing: 8) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                        Text("KI-berechnet · Basierend auf deinen Angaben")
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(FrigyBrand.selectedBg)
                    .clipShape(Capsule())
                    .opacity(appeared ? 1 : 0)
                    .animation(.easeOut(duration: 0.4).delay(0.38), value: appeared)

                    MacroSourcesCard()
                        .opacity(appeared ? 1 : 0)
                        .animation(.easeOut(duration: 0.4).delay(0.44), value: appeared)

                    Spacer().frame(height: 100)
                }
                .padding(.horizontal, 20)
            }
            .overlay(alignment: .bottom) {
                VStack(spacing: 0) {
                    LinearGradient(
                        colors: [FrigyBrand.bg.opacity(0), FrigyBrand.bg],
                        startPoint: .top, endPoint: .bottom
                    )
                    .frame(height: 32)
                    OnboardingContinueButton("Plan starten") { onNext(draft) }
                        .padding(.horizontal, 24)
                        .padding(.bottom, 40)
                        .background(FrigyBrand.bg)
                }
            }
        }
        .sheet(isPresented: $showEditor) {
            MacroEditorSheet(draft: $draft)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .onAppear {
            appeared = true
            withAnimation(.easeOut(duration: 1.3).delay(0.28)) {
                ringDraw = 0.75
            }
        }
    }

    // MARK: - Calorie ring card

    private var calorieRingCard: some View {
        VStack(spacing: 20) {
            ZStack {
                // Outer glow
                Circle()
                    .fill(FrigyBrand.primary.opacity(0.07))
                    .frame(width: 178, height: 178)

                // Track ring
                Circle()
                    .stroke(FrigyBrand.borderMint.opacity(0.25), lineWidth: 11)
                    .frame(width: 152, height: 152)

                // Progress ring
                Circle()
                    .trim(from: 0, to: ringDraw)
                    .stroke(
                        AngularGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDeep, FrigyBrand.primary],
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: 11, lineCap: .round)
                    )
                    .frame(width: 152, height: 152)
                    .rotationEffect(.degrees(-90))
                    .shadow(color: FrigyBrand.primaryDark.opacity(0.35), radius: 8, y: 0)

                // Center content
                VStack(spacing: 3) {
                    Text("\(draft.dailyCalories)")
                        .font(.system(size: 34, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                        .contentTransition(.numericText())
                    Text("kcal / Tag")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(FrigyBrand.textMuted)
                }
            }

            // Macro chips row
            HStack(spacing: 0) {
                macroChip("Protein", value: draft.dailyProtein, color: Color(hex: "#FF6B6B"))
                Divider().frame(height: 38)
                macroChip("Kohlenhydrate", value: draft.dailyCarbs, color: Color(hex: "#FFD93D"))
                Divider().frame(height: 38)
                macroChip("Fett", value: draft.dailyFat, color: FrigyBrand.primary)
            }
        }
        .padding(.top, 24)
        .padding(.bottom, 8)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.white)
                .shadow(color: FrigyBrand.primaryDark.opacity(0.08), radius: 18, y: 7)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(FrigyBrand.cardBorder, lineWidth: 1)
        )
    }

    private func macroChip(_ label: String, value: Int, color: Color) -> some View {
        VStack(spacing: 5) {
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text("\(value)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                    .contentTransition(.numericText())
                Text("g")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(FrigyBrand.textMuted)
            }
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
                .multilineTextAlignment(.center)
            Capsule()
                .fill(color)
                .frame(height: 3)
                .padding(.horizontal, 20)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    // MARK: - Macro breakdown card

    private var macroBreakdownCard: some View {
        VStack(spacing: 0) {
            macroBarRow(
                "Protein", icon: "flame.fill",
                value: draft.dailyProtein, pct: proteinPct,
                color: Color(hex: "#FF6B6B"), delay: 0.38
            )
            Divider().padding(.leading, 58)
            macroBarRow(
                "Kohlenhydrate", icon: "bolt.fill",
                value: draft.dailyCarbs, pct: carbsPct,
                color: Color(hex: "#FFD93D"), delay: 0.50
            )
            Divider().padding(.leading, 58)
            macroBarRow(
                "Fett", icon: "drop.fill",
                value: draft.dailyFat, pct: fatPct,
                color: FrigyBrand.primary, delay: 0.62
            )
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.white)
                .shadow(color: FrigyBrand.primaryDark.opacity(0.06), radius: 12, y: 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(FrigyBrand.cardBorder, lineWidth: 1)
        )
    }

    private func macroBarRow(
        _ label: String, icon: String,
        value: Int, pct: Double,
        color: Color, delay: Double
    ) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 9)
                        .fill(color.opacity(0.14))
                        .frame(width: 32, height: 32)
                    Image(systemName: icon)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(color)
                }
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text("\(value)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                        .contentTransition(.numericText())
                    Text("g")
                        .font(.system(size: 12))
                        .foregroundColor(FrigyBrand.textMuted)
                    Text("· \(Int(pct * 100))%")
                        .font(.system(size: 12))
                        .foregroundColor(FrigyBrand.textMuted)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(color.opacity(0.12))
                        .frame(height: 7)
                    Capsule()
                        .fill(color)
                        .frame(width: appeared ? max(7, geo.size.width * pct) : 7, height: 7)
                        .animation(.easeOut(duration: 0.85).delay(delay), value: appeared)
                }
            }
            .frame(height: 7)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

// MARK: - Editor sheet

private struct MacroEditorSheet: View {
    @Binding var draft: UserProfileDraft
    @Environment(\.dismiss) private var dismiss

    @State private var calories: Int = 0
    @State private var protein: Int = 0
    @State private var carbs: Int = 0
    @State private var fat: Int = 0

    @FocusState private var focusedField: Field?
    private enum Field { case calories, protein, carbs, fat }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    inputRow(title: "Kalorien", unit: "kcal", value: $calories, range: 800...6000, color: FrigyBrand.primaryDeep, field: .calories)
                    inputRow(title: "Protein", unit: "g", value: $protein, range: 0...500, color: Color(hex: "#FF6B6B"), field: .protein)
                    inputRow(title: "Kohlenhydrate", unit: "g", value: $carbs, range: 0...800, color: Color(hex: "#E0B400"), field: .carbs)
                    inputRow(title: "Fett", unit: "g", value: $fat, range: 0...300, color: FrigyBrand.primaryDeep, field: .fat)

                    Button {
                        var p = draft
                        p.macrosManuallyEdited = false
                        p.recalculateMacrosIfPossible()
                        calories = p.dailyCalories
                        protein = p.dailyProtein
                        carbs = p.dailyCarbs
                        fat = p.dailyFat
                    } label: {
                        Text("Auf empfohlene Werte zurücksetzen")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDeep)
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 4)
                }
                .padding(20)
            }
            .scrollDismissesKeyboard(.interactively)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Fertig") { focusedField = nil }
                        .fontWeight(.semibold)
                }
            }
            .background(FrigyBrand.bg.ignoresSafeArea())
            .navigationTitle("Plan anpassen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fertig") {
                        draft.dailyCalories = calories
                        draft.dailyProtein = protein
                        draft.dailyCarbs = carbs
                        draft.dailyFat = fat
                        draft.macrosManuallyEdited = true
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                calories = draft.dailyCalories
                protein = draft.dailyProtein
                carbs = draft.dailyCarbs
                fat = draft.dailyFat
            }
        }
    }

    private func inputRow(title: String, unit: String, value: Binding<Int>, range: ClosedRange<Int>, color: Color, field: Field) -> some View {
        HStack(spacing: 14) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
            Spacer()
            TextField("0", value: Binding(
                get: { value.wrappedValue },
                set: { value.wrappedValue = Swift.max(range.lowerBound, Swift.min(range.upperBound, $0)) }
            ), format: .number)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundColor(color)
                .frame(minWidth: 64)
                .focused($focusedField, equals: field)
            Text(unit)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
                .frame(width: 36, alignment: .leading)
        }
        .padding(14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(focusedField == field ? FrigyBrand.primary : FrigyBrand.cardBorder,
                        lineWidth: focusedField == field ? 1.5 : 1)
        )
    }
}

// MARK: - Scientific sources card

private struct MacroSourcesCard: View {
    private struct Source: Identifiable {
        let id = UUID()
        let name: String
        let desc: String
        let url: String
    }

    private let sources: [Source] = [
        Source(name: "Mifflin-St Jeor Formel (BMR)", desc: "Grundumsatz-Berechnung", url: "https://pubmed.ncbi.nlm.nih.gov/2305711/"),
        Source(name: "TDEE Aktivitätsfaktoren", desc: "Gesamtenergieverbrauch", url: "https://pubmed.ncbi.nlm.nih.gov/8878356/"),
        Source(name: "Protein: 2g/kg Körpergewicht", desc: "ISSN Protein-Empfehlung", url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8"),
        Source(name: "Defizit: 7700 kcal/kg", desc: "Energiebilanz-Regel", url: "https://pubmed.ncbi.nlm.nih.gov/21872751/"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Berechnung basiert auf folgenden wissenschaftlichen Formeln:")
                .font(.system(size: 13))
                .foregroundColor(FrigyBrand.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(sources) { source in
                    if let url = URL(string: source.url) {
                        Link(destination: url) {
                            HStack(alignment: .top, spacing: 6) {
                                Text("•")
                                    .font(.system(size: 13))
                                    .foregroundColor(FrigyBrand.textMuted)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(source.name)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(FrigyBrand.text)
                                        .underline()
                                    Text(source.desc)
                                        .font(.system(size: 10))
                                        .foregroundColor(FrigyBrand.textMuted.opacity(0.7))
                                }
                                Spacer(minLength: 0)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
