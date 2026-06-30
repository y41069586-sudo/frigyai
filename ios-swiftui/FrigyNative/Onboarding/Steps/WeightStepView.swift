import SwiftUI

struct WeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var selectedKg: Int = 70
    @State private var selectedLbs: Int = 154

    private let kgPerLb = 0.45359237

    @Environment(LanguageManager.self) private var lang

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let kg  = profile.weightKg > 0 ? Int(round(profile.weightKg)) : 70
        let lbs = profile.weightKg > 0 ? Int(round(profile.weightKg / 0.45359237)) : 154
        _selectedKg  = State(initialValue: min(max(kg, 30), 250))
        _selectedLbs = State(initialValue: min(max(lbs, 66), 550))
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion(lang.t("Wie viel wiegst du aktuell?"))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            MintSegmentedControl(
                options: [("metric", lang.t("Metrisch")), ("imperial", lang.t("Imperial"))],
                selected: isMetric ? "metric" : "imperial"
            ) { id in
                let wasMetric = isMetric
                isMetric = (id == "metric")
                if wasMetric  { selectedLbs = min(max(Int(round(Double(selectedKg) / kgPerLb)), 66), 550) }
                if !wasMetric { selectedKg  = min(max(Int(round(Double(selectedLbs) * kgPerLb)), 30), 250) }
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)

            Spacer()

            wheelPicker
                .padding(.horizontal, 20)

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton {
                    var u = draft
                    u.weightKg = isMetric ? Double(selectedKg) : Double(selectedLbs) * kgPerLb
                    onNext(u)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    @ViewBuilder
    private var wheelPicker: some View {
        if isMetric {
            unitWheel(
                selection: $selectedKg,
                range: 30...250,
                unit: "kg",
                onChange: { draft.weightKg = Double($0) }
            )
        } else {
            unitWheel(
                selection: $selectedLbs,
                range: 66...550,
                unit: "lbs",
                onChange: { draft.weightKg = Double($0) * kgPerLb }
            )
        }
    }
}

// MARK: - Shared inline wheel helper

private func unitWheel(
    selection: Binding<Int>,
    range: ClosedRange<Int>,
    unit: String,
    onChange: @escaping (Int) -> Void
) -> some View {
    ZStack {
        Picker("", selection: selection) {
            ForEach(range, id: \.self) { n in
                Text("\(n)")
                    .font(.system(size: 22, weight: .semibold, design: .rounded))
                    .tag(n)
            }
        }
        .pickerStyle(.wheel)
        .frame(height: 200)

        // Unit label pinned to the right at selection-row height
        HStack {
            Spacer()
            Text(unit)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDeep)
                .padding(.trailing, 24)
        }
        .allowsHitTesting(false)
    }
    .onChange(of: selection.wrappedValue, initial: false) { _, v in onChange(v) }
}
