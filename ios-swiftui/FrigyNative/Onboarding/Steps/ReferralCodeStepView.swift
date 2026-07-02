import SwiftUI

struct ReferralCodeStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    private let codeLength = 6

    @State private var digits: [String]
    @State private var phase: Phase = .input
    @State private var fieldError: String?
    @State private var influencerName: String?
    @FocusState private var focusedIndex: Int?

    @Environment(LanguageManager.self) private var lang

    enum Phase { case input, validating, success }

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        let seed = (profile.referralCode ?? "")
            .filter { $0.isLetter || $0.isNumber }
            .uppercased()
            .prefix(6)
        var d = Array(repeating: "", count: 6)
        for (i, c) in seed.enumerated() where i < 6 {
            d[i] = String(c)
        }
        _digits = State(initialValue: d)
    }

    private var codeValue: String { digits.joined() }
    private var isDisabled: Bool { phase != .input }

    var body: some View {
        ZStack {
            FrigyBrand.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                // Top bar with back
                HStack {
                    if let back = onBack, phase == .input {
                        Button(action: back) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(hex: "#F4F7EF"))
                                    .frame(width: 48, height: 48)
                                Image(systemName: "arrow.left")
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(FrigyBrand.text)
                            }
                        }
                        .buttonStyle(.plain)
                    } else {
                        Color.clear.frame(width: 48, height: 48)
                    }
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)
                .padding(.bottom, 16)

                OnboardingProgressBar(fraction: progress)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 16)

                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(lang.t("EIN FREUND\nLÄDT DICH EIN"))
                            .font(.system(size: 30, weight: .black))
                            .foregroundColor(FrigyBrand.text)
                            .tracking(-1.5)
                            .lineSpacing(2)
                            .padding(.bottom, 40)

                        Text(lang.t("Empfehlungscode"))
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                            .tracking(-0.5)
                            .padding(.bottom, 20)

                        HStack(spacing: 10) {
                            ForEach(0..<codeLength, id: \.self) { i in
                                codeBox(index: i)
                            }
                        }
                        .frame(maxWidth: .infinity)

                        if let err = fieldError {
                            Text(err)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(Color(hex: "#DC2626"))
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding(.top, 8)
                                .transition(.opacity)
                        }

                        if phase == .validating {
                            HStack(spacing: 8) {
                                ProgressView()
                                    .scaleEffect(0.8)
                                Text(lang.t("Code wird überprüft…"))
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.top, 12)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                if phase != .success {
                    HStack(spacing: 0) {
                        Button(lang.t("Nicht jetzt")) {
                            handleSkip()
                        }
                        .font(.system(size: 17, weight: .medium))
                        .foregroundColor(FrigyBrand.text)
                        .frame(maxWidth: .infinity).frame(height: 54)
                        .disabled(isDisabled)

                        Button(lang.t("Weiter")) {
                            Task { await handleWeiter() }
                        }
                        .font(.system(size: 17, weight: .medium))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity).frame(height: 54)
                        .background(FrigyBrand.primary)
                        .disabled(isDisabled)
                    }
                    .background(Color(UIColor.systemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 25))
                    .overlay(
                        RoundedRectangle(cornerRadius: 25)
                            .stroke(Color.black, lineWidth: 3)
                    )
                    .padding(.horizontal, 20)
                    .padding(.bottom, max(20, 16))
                    .padding(.top, 8)
                }
            }

            if phase == .success {
                successOverlay
            }
        }
        .animation(.easeInOut(duration: 0.25), value: phase)
        .animation(.easeInOut(duration: 0.15), value: fieldError)
    }

    private func codeBox(index: Int) -> some View {
        let hasError = fieldError != nil
        let isSuccess = phase == .success
        return ZStack {
            RoundedRectangle(cornerRadius: 0)
                .fill(hasError ? Color(hex: "#FEF2F2") : isSuccess ? FrigyBrand.borderMint.opacity(0.12) : Color(hex: "#F4F7EF"))
                .overlay(
                    RoundedRectangle(cornerRadius: 0)
                        .stroke(
                            isSuccess ? FrigyBrand.primary : hasError ? Color(hex: "#DC2626").opacity(0.6) : Color.clear,
                            lineWidth: isSuccess || hasError ? 2 : 0
                        )
                )

            if digits[index].isEmpty {
                Text(" ")
                    .font(.system(size: 22, weight: .bold))
            } else {
                Text(digits[index])
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
            }

            TextField("", text: Binding(
                get: { digits[index] },
                set: { newVal in updateDigit(index: index, value: newVal) }
            ))
            .opacity(0.001)
            .keyboardType(.asciiCapable)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.characters)
            .focused($focusedIndex, equals: index)
            .onSubmit { focusedIndex = Swift.min(index + 1, codeLength - 1) }
            .disabled(isDisabled)
        }
        .frame(height: 54)
        .frame(maxWidth: .infinity)
        .onTapGesture { focusedIndex = index }
    }

    private var successOverlay: some View {
        ZStack {
            FrigyBrand.bg.ignoresSafeArea()

            VStack(spacing: 24) {
                ZStack {
                    Circle()
                        .fill(FrigyBrand.borderMint.opacity(0.12))
                        .frame(width: 120, height: 120)
                    Circle()
                        .fill(FrigyBrand.bg)
                        .overlay(Circle().stroke(FrigyBrand.primary, lineWidth: 4))
                        .frame(width: 88, height: 88)
                    Image(systemName: "checkmark")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(FrigyBrand.primary)
                }

                VStack(spacing: 12) {
                    if let name = influencerName {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .semibold))
                            Text(name)
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(FrigyBrand.primaryDark)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(FrigyBrand.borderMint.opacity(0.15))
                        .clipShape(Capsule())
                    }

                    Text(lang.t("Code erkannt!"))
                        .font(.system(size: 28, weight: .black))
                        .foregroundColor(FrigyBrand.text)
                        .tracking(-1)

                    Text(lang.t("Dein Partner wurde gespeichert. Als Nächstes wählst du dein Premium-Abo."))
                        .font(.system(size: 17, weight: .medium))
                        .foregroundColor(Color(hex: "#3F3F46"))
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 300)
                }
            }
        }
        .transition(.opacity)
    }

    // MARK: - Actions

    private func updateDigit(index: Int, value: String) {
        guard phase == .input else { return }
        fieldError = nil
        let filtered = value
            .filter { $0.isLetter || $0.isNumber }
            .uppercased()
        let next = String((filtered.last.map { String($0) } ?? filtered).prefix(1))
        digits[index] = next
        if !next.isEmpty, index < codeLength - 1 {
            focusedIndex = index + 1
        }
    }

    private func handleSkip() {
        guard phase == .input else { return }
        fieldError = nil
        var updated = profile
        updated.referralCode = nil
        onNext(updated)
    }

    private func handleWeiter() async {
        guard phase == .input else { return }
        fieldError = nil
        if codeValue.isEmpty {
            fieldError = lang.t("Bitte Code eingeben oder \"Nicht jetzt\" wählen.")
            return
        }
        if codeValue.count < codeLength {
            fieldError = lang.t("Bitte alle 6 Felder ausfüllen.")
            return
        }

        focusedIndex = nil
        phase = .validating

        let result = await TrackerDataService.shared.validateReferralCode(codeValue)

        if result.valid {
            influencerName = result.influencerName
            var updated = profile
            updated.referralCode = result.code ?? codeValue
            withAnimation { phase = .success }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                onNext(updated)
            }
        } else {
            withAnimation { phase = .input }
            fieldError = result.error.map { lang.t($0) } ?? lang.t("Ungültiger Code. Bitte prüfen.")
        }
    }
}
