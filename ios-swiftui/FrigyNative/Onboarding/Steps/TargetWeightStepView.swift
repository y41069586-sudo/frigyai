import SwiftUI

struct TargetWeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var selectedKg: Int = 65
    @State private var selectedLbs: Int = 143

    private let kgPerLb = 0.45359237

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext

        var target = profile.targetWeightKg
        if target <= 0 || target == 65 {
            if profile.goalMode == "lose"      { target = max(40, profile.weightKg - 5) }
            else if profile.goalMode == "gain" { target = profile.weightKg + 5 }
            else                               { target = profile.weightKg }
        }
        var d = profile; d.targetWeightKg = target
        _draft = State(initialValue: d)

        let kg  = target > 0 ? Int(round(target)) : 65
        let lbs = target > 0 ? Int(round(target / 0.45359237)) : 143
        _selectedKg  = State(initialValue: min(max(kg, 30), 250))
        _selectedLbs = State(initialValue: min(max(lbs, 66), 550))
    }

    private var questionTitle: String {
        switch draft.goalMode {
        case "lose": return "Wie viel möchtest du wiegen?"
        case "gain": return "Welches Gewicht möchtest du aufbauen?"
        default:     return "Dein Zielgewicht"
        }
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion(questionTitle)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            MintSegmentedControl(
                options: [("metric", "Metrisch"), ("imperial", "Imperial")],
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

            if isMetric {
                unitWheel(
                    selection: $selectedKg,
                    range: 30...250,
                    unit: "kg",
                    onChange: { draft.targetWeightKg = Double($0) }
                )
                .padding(.horizontal, 20)
            } else {
                unitWheel(
                    selection: $selectedLbs,
                    range: 66...550,
                    unit: "lbs",
                    onChange: { draft.targetWeightKg = Double($0) * kgPerLb }
                )
                .padding(.horizontal, 20)
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton("Ziel festlegen") {
                    var u = draft
                    u.targetWeightKg = isMetric ? Double(selectedKg) : Double(selectedLbs) * kgPerLb
                    onNext(u)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }
}

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
