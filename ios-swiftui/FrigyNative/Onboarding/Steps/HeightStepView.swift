import SwiftUI

struct HeightStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var inputText: String = ""
    @State private var isMetric: Bool = true
    @FocusState private var isFocused: Bool

    private let cmPerInch = 2.54
    private let inchesPerFoot = 12.0

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
        let cm = profile.heightCm
        _inputText = State(initialValue: cm > 0 ? String(Int(cm)) : "")
    }

    private var parsedCm: Double? {
        if isMetric {
            guard let val = Double(inputText), val >= 100, val <= 250 else { return nil }
            return val
        } else {
            return parseImperialHeight(inputText)
        }
    }

    private var canProceed: Bool { parsedCm != nil }

    private var showError: Bool {
        !inputText.isEmpty && !canProceed
    }

    private var helperText: String {
        if showError {
            return isMetric ? "Bitte zwischen 100 und 250 cm eingeben." : "Bitte im Format 5'7 eingeben."
        }
        return isMetric ? "z.B. 170 cm" : "e.g. 5'7\""
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            Text("Wie groß bist du?")
                .font(.system(size: 19, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
                .tracking(-0.5)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            // Unit toggle
            MintSegmentedControl(
                options: [("metric", "Metrisch"), ("imperial", "Imperial")],
                selected: isMetric ? "metric" : "imperial"
            ) { id in
                isMetric = (id == "metric")
                inputText = ""
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 4)

            Spacer()

            // Input card
            VStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.white)
                        .overlay(
                            RoundedRectangle(cornerRadius: 24)
                                .stroke(FrigyBrand.borderMint, lineWidth: 1)
                        )
                        .shadow(color: Color(hex: "#39D47F").opacity(0.12), radius: 18, y: 8)

                    HStack(spacing: 12) {
                        TextField(isMetric ? "170" : "5'7", text: $inputText)
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(FrigyBrand.text)
                            .multilineTextAlignment(.center)
                            .keyboardType(isMetric ? .numberPad : .numbersAndPunctuation)
                            .focused($isFocused)
                            .frame(maxWidth: .infinity)
                            .onChange(of: inputText) { _, _ in
                                commitInput()
                            }

                        Text(isMetric ? "cm" : "ft/in")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                }
                .frame(maxWidth: 320)
                .frame(height: 64)

                Text(helperText)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(showError ? Color(hex: "#DC2626") : FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .animation(.easeInOut(duration: 0.15), value: helperText)
            }
            .padding(.horizontal, 20)

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(isEnabled: canProceed) {
                    var updated = draft
                    if let cm = parsedCm { updated.heightCm = cm }
                    onNext(updated)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear { isFocused = true }
    }

    private func commitInput() {
        guard let cm = parsedCm else { return }
        draft.heightCm = cm
    }

    private func parseImperialHeight(_ text: String) -> Double? {
        // Accepts: "5'7", "5'7\"", "5 7", "67" (total inches)
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        if trimmed.contains("'") {
            let parts = trimmed.split(separator: "'")
            guard parts.count >= 1, let feet = Double(parts[0]) else { return nil }
            let inchStr = parts.count > 1 ? parts[1].replacingOccurrences(of: "\"", with: "").trimmingCharacters(in: .whitespaces) : "0"
            let inches = Double(inchStr) ?? 0
            guard feet >= 3, feet <= 8, inches >= 0, inches <= 11 else { return nil }
            let cm = (feet * inchesPerFoot + inches) * cmPerInch
            return cm >= 100 && cm <= 250 ? cm : nil
        } else if let totalInches = Double(trimmed) {
            let cm = totalInches * cmPerInch
            return cm >= 100 && cm <= 250 ? cm : nil
        }
        return nil
    }
}
