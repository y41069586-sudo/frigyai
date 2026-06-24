import SwiftUI

struct MacroPreviewStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var showEditor = false

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

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 32) {
                    Spacer().frame(height: 16)

                    OnboardingQuestion(text: "Dein täglicher\nErnährungsplan")

                    // Calorie ring (tappable to edit)
                    Button { showEditor = true } label: {
                        ZStack {
                            Circle()
                                .stroke(FrigyBrand.borderMint.opacity(0.3), lineWidth: 10)
                                .frame(width: 140, height: 140)
                            Circle()
                                .trim(from: 0, to: 0.75)
                                .stroke(FrigyBrand.buttonGradient, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                                .frame(width: 140, height: 140)
                                .rotationEffect(.degrees(-90))

                            VStack(spacing: 2) {
                                Text("\(draft.dailyCalories)")
                                    .font(.system(size: 28, weight: .black, design: .rounded))
                                    .foregroundColor(FrigyBrand.text)
                                    .contentTransition(.numericText())
                                Text("kcal")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                        }
                    }
                    .buttonStyle(.plain)

                    // Macros (tappable to edit)
                    HStack(spacing: 12) {
                        macroCard(label: "Protein", value: draft.dailyProtein, unit: "g", color: Color(hex: "#FF6B6B"))
                        macroCard(label: "Kohlenhydrate", value: draft.dailyCarbs, unit: "g", color: Color(hex: "#FFD93D"))
                        macroCard(label: "Fett", value: draft.dailyFat, unit: "g", color: FrigyBrand.primary)
                    }
                    .padding(.horizontal, 24)

                    // Edit button
                    Button { showEditor = true } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "slider.horizontal.3")
                                .font(.system(size: 13, weight: .semibold))
                            Text("Werte anpassen")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(FrigyBrand.primaryDeep)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 11)
                        .background(FrigyBrand.selectedBg)
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)

                    // Info pill
                    HStack(spacing: 8) {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(FrigyBrand.primaryDark)
                        Text("Basierend auf deinen Angaben personalisiert")
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(FrigyBrand.selectedBg)
                    .clipShape(Capsule())
                    .padding(.horizontal, 24)

                    // Scientific sources
                    MacroSourcesCard()
                        .padding(.horizontal, 24)

                    Spacer().frame(height: 100)
                }
                .frame(maxWidth: .infinity)
            }
            .overlay(alignment: .bottom) {
                VStack(spacing: 0) {
                    LinearGradient(colors: [FrigyBrand.bg.opacity(0), FrigyBrand.bg], startPoint: .top, endPoint: .bottom)
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
    }

    private func macroCard(label: String, value: Int, unit: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Text("\(value)\(unit)")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(FrigyBrand.text)
                .contentTransition(.numericText())
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
                .multilineTextAlignment(.center)
            Rectangle()
                .fill(color)
                .frame(height: 3)
                .clipShape(Capsule())
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(FrigyBrand.cardBorder, lineWidth: 1)
        )
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
            // Editable number field — number-pad keyboard, clamped to range on commit.
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
