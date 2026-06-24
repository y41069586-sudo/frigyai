import SwiftUI

struct HeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var isMetric: Bool = true
    @State private var selectedCm: Int = 170
    // Imperial: two separate wheels for feet and inches
    @State private var selectedFeet: Int = 5
    @State private var selectedInches: Int = 7

    private let cmPerInch = 2.54

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let cm = profile.heightCm > 0 ? Int(round(profile.heightCm)) : 170
        _selectedCm = State(initialValue: min(max(cm, 100), 250))
        if profile.heightCm > 0 {
            let totalInches = profile.heightCm / 2.54
            let feet = Int(totalInches / 12)
            let inches = Int(totalInches.truncatingRemainder(dividingBy: 12))
            _selectedFeet   = State(initialValue: min(max(feet, 3), 8))
            _selectedInches = State(initialValue: min(max(inches, 0), 11))
        }
    }

    private var imperialCm: Double {
        Double(selectedFeet * 12 + selectedInches) * cmPerInch
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion("Wie groß bist du?")
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            MintSegmentedControl(
                options: [("metric", "Metrisch"), ("imperial", "Imperial")],
                selected: isMetric ? "metric" : "imperial"
            ) { id in
                let wasMetric = isMetric
                isMetric = (id == "metric")
                if wasMetric && !isMetric {
                    let totalIn = Double(selectedCm) / cmPerInch
                    selectedFeet   = min(max(Int(totalIn / 12), 3), 8)
                    selectedInches = min(max(Int(totalIn.truncatingRemainder(dividingBy: 12)), 0), 11)
                } else if !wasMetric && isMetric {
                    selectedCm = min(max(Int(round(imperialCm)), 100), 250)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 4)

            Spacer()

            if isMetric {
                NumberScrollInput(value: $selectedCm, range: 100...250, unit: "cm")
                    .padding(.horizontal, 20)
                    .onChange(of: selectedCm) { _, cm in
                        draft.heightCm = Double(cm)
                    }
            } else {
                imperialPicker
                    .padding(.horizontal, 20)
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton {
                    var updated = draft
                    updated.heightCm = isMetric ? Double(selectedCm) : imperialCm
                    onNext(updated)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear {
            draft.heightCm = isMetric ? Double(selectedCm) : imperialCm
        }
    }

    // Imperial: two side-by-side wheels (feet | inches) with a combined display.
    private var imperialPicker: some View {
        VStack(spacing: 4) {
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text("\(selectedFeet)")
                    .font(.system(size: 52, weight: .bold, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                    .contentTransition(.numericText())
                    .animation(.snappy(duration: 0.18), value: selectedFeet)
                    .monospacedDigit()
                Text("ft")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .padding(.bottom, 6)
                Text("\(selectedInches)")
                    .font(.system(size: 52, weight: .bold, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                    .contentTransition(.numericText())
                    .animation(.snappy(duration: 0.18), value: selectedInches)
                    .monospacedDigit()
                    .padding(.leading, 8)
                Text("in")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .padding(.bottom, 6)
            }

            HStack(spacing: 0) {
                Picker("", selection: $selectedFeet) {
                    ForEach(3...8, id: \.self) { ft in Text("\(ft) ft").tag(ft) }
                }
                .pickerStyle(.wheel)
                .frame(height: 150)
                .onChange(of: selectedFeet) { _, _ in draft.heightCm = imperialCm }

                Picker("", selection: $selectedInches) {
                    ForEach(0...11, id: \.self) { i in Text("\(i) in").tag(i) }
                }
                .pickerStyle(.wheel)
                .frame(height: 150)
                .onChange(of: selectedInches) { _, _ in draft.heightCm = imperialCm }
            }
            .clipped()
        }
    }
}
