import SwiftUI

struct HeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var selectedCm: Int = 170
    @State private var selectedFeet: Int = 5
    @State private var selectedInches: Int = 7

    private let cmPerInch = 2.54

    @Environment(LanguageManager.self) private var lang

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let cm = profile.heightCm > 0 ? Int(round(profile.heightCm)) : 170
        _selectedCm = State(initialValue: min(max(cm, 100), 250))
        if profile.heightCm > 0 {
            let totalIn = profile.heightCm / 2.54
            _selectedFeet   = State(initialValue: min(max(Int(totalIn / 12), 3), 8))
            _selectedInches = State(initialValue: min(max(Int(totalIn.truncatingRemainder(dividingBy: 12)), 0), 11))
        }
    }

    private var imperialCm: Double {
        Double(selectedFeet * 12 + selectedInches) * cmPerInch
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion(lang.t("Wie groß bist du?"))
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            MintSegmentedControl(
                options: [("metric", lang.t("Metrisch")), ("imperial", lang.t("Imperial"))],
                selected: isMetric ? "metric" : "imperial"
            ) { id in
                let wasMetric = isMetric
                isMetric = (id == "metric")
                if wasMetric {
                    let totalIn = Double(selectedCm) / cmPerInch
                    selectedFeet   = min(max(Int(totalIn / 12), 3), 8)
                    selectedInches = min(max(Int(totalIn.truncatingRemainder(dividingBy: 12)), 0), 11)
                } else {
                    selectedCm = min(max(Int(round(imperialCm)), 100), 250)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)

            Spacer()

            if isMetric {
                unitWheel(
                    selection: $selectedCm,
                    range: 100...250,
                    unit: "cm",
                    onChange: { draft.heightCm = Double($0) }
                )
                .padding(.horizontal, 20)
            } else {
                imperialWheels
                    .padding(.horizontal, 20)
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton {
                    var u = draft
                    u.heightCm = isMetric ? Double(selectedCm) : imperialCm
                    onNext(u)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    // Two side-by-side native wheels for ft + in
    private var imperialWheels: some View {
        HStack(spacing: 0) {
            ZStack {
                Picker("", selection: $selectedFeet) {
                    ForEach(3...8, id: \.self) { ft in
                        Text("\(ft)")
                            .font(.system(size: 22, weight: .semibold, design: .rounded))
                            .tag(ft)
                    }
                }
                .pickerStyle(.wheel)
                .frame(height: 200)
                HStack { Spacer()
                    Text("ft").font(.system(size: 16, weight: .semibold)).foregroundColor(FrigyBrand.primaryDeep).padding(.trailing, 8)
                }.allowsHitTesting(false)
            }
            .onChange(of: selectedFeet) { _, _ in draft.heightCm = imperialCm }

            ZStack {
                Picker("", selection: $selectedInches) {
                    ForEach(0...11, id: \.self) { i in
                        Text("\(i)")
                            .font(.system(size: 22, weight: .semibold, design: .rounded))
                            .tag(i)
                    }
                }
                .pickerStyle(.wheel)
                .frame(height: 200)
                HStack { Spacer()
                    Text("in").font(.system(size: 16, weight: .semibold)).foregroundColor(FrigyBrand.primaryDeep).padding(.trailing, 8)
                }.allowsHitTesting(false)
            }
            .onChange(of: selectedInches) { _, _ in draft.heightCm = imperialCm }
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
