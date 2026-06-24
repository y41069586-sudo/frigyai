import SwiftUI

struct BirthdateStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var inputText: String = ""
    @FocusState private var isFocused: Bool

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
    }

    // MARK: - Validation
    private var parsedResult: BirthdateParseResult? {
        parseBirthdateInput(inputText)
    }

    private var canProceed: Bool { parsedResult == .valid }
    private var showTooYoung: Bool { parsedResult == .tooYoung }
    private var showInvalid: Bool {
        !inputText.isEmpty && parsedResult != nil && parsedResult == .invalid
    }

    private var helperColor: Color {
        showTooYoung || showInvalid ? Color(hex: "#DC2626") : FrigyBrand.textMuted
    }

    private var helperText: String {
        if showTooYoung { return "Du musst mindestens 13 Jahre alt sein." }
        if showInvalid { return "Bitte ein gültiges Datum eingeben." }
        return "Format: TT.MM.JJJJ"
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Question
            Text("Wann wurdest du geboren?")
                .font(.system(size: 19, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
                .tracking(-0.5)
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            Spacer()

            // Date input card
            VStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.white)
                        .overlay(
                            RoundedRectangle(cornerRadius: 24)
                                .stroke(FrigyBrand.borderMint, lineWidth: 1)
                        )
                        .shadow(color: Color(hex: "#39D47F").opacity(0.12), radius: 18, y: 8)

                    TextField("16.05.2002", text: $inputText)
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                        .keyboardType(.numberPad)
                        .focused($isFocused)
                        .onChange(of: inputText) { _, newVal in
                            inputText = sanitizeBirthdateInput(newVal)
                            updateDraftFromInput()
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 16)
                }
                .frame(maxWidth: 320)
                .frame(height: 64)

                Text(helperText)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(helperColor)
                    .multilineTextAlignment(.center)
                    .animation(.easeInOut(duration: 0.15), value: helperText)
            }
            .padding(.horizontal, 20)

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(isEnabled: canProceed) {
                    onNext(draft)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
        .onAppear { isFocused = true }
    }

    // MARK: - Helpers

    private func sanitizeBirthdateInput(_ raw: String) -> String {
        let digits = raw.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        let limited = String(digits.prefix(8))
        var parts: [String] = []
        if limited.count > 0 { parts.append(String(limited.prefix(2))) }
        if limited.count > 2 { parts.append(String(limited.dropFirst(2).prefix(2))) }
        if limited.count > 4 { parts.append(String(limited.dropFirst(4).prefix(4))) }
        return parts.joined(separator: ".")
    }

    private enum BirthdateParseResult {
        case valid, invalid, tooYoung
    }

    private func parseBirthdateInput(_ value: String) -> BirthdateParseResult? {
        guard !value.isEmpty else { return nil }
        let regex = try? NSRegularExpression(pattern: #"^\d{2}\.\d{2}\.\d{4}$"#)
        let range = NSRange(value.startIndex..., in: value)
        guard regex?.firstMatch(in: value, range: range) != nil else {
            return nil
        }
        let parts = value.split(separator: ".")
        guard parts.count == 3,
              let day = Int(parts[0]),
              let month = Int(parts[1]),
              let year = Int(parts[2]) else { return .invalid }

        let currentYear = Calendar.current.component(.year, from: Date())
        guard year >= currentYear - 100 else { return .invalid }
        guard month >= 1, month <= 12 else { return .invalid }

        // Days in month
        var comps = DateComponents()
        comps.year = year; comps.month = month
        guard let monthDate = Calendar.current.date(from: comps),
              let range = Calendar.current.range(of: .day, in: .month, for: monthDate) else { return .invalid }
        guard day >= 1, day <= range.count else { return .invalid }

        var dobComps = DateComponents()
        dobComps.day = day; dobComps.month = month; dobComps.year = year
        guard let dob = Calendar.current.date(from: dobComps) else { return .invalid }

        let age = Calendar.current.dateComponents([.year], from: dob, to: Date()).year ?? 0
        if age < 13 { return .tooYoung }
        if age > 100 { return .invalid }
        return .valid
    }

    private func updateDraftFromInput() {
        guard parsedResult == .valid else { return }
        let parts = inputText.split(separator: ".")
        guard parts.count == 3,
              let day = Int(parts[0]), let month = Int(parts[1]), let year = Int(parts[2]) else { return }
        var dobComps = DateComponents()
        dobComps.day = day; dobComps.month = month; dobComps.year = year
        if let dob = Calendar.current.date(from: dobComps) {
            draft.age = Calendar.current.dateComponents([.year], from: dob, to: Date()).year ?? 25
        }
    }
}
