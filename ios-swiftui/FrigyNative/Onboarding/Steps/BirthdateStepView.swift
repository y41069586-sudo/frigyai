import SwiftUI

struct BirthdateStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var birthdate: Date?
    @State private var showDatePicker = false

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)
    }

    private var minDate: Date {
        Calendar.current.date(byAdding: .year, value: -100, to: Date()) ?? Date()
    }

    private var maxDate: Date {
        Calendar.current.date(byAdding: .year, value: -13, to: Date()) ?? Date()
    }

    private var ageText: String? {
        guard let bd = birthdate else { return nil }
        let comps = Calendar.current.dateComponents([.year], from: bd, to: Date())
        guard let age = comps.year, age >= 13 else { return nil }
        return "\(age) Jahre alt"
    }

    private var formatted: String {
        guard let bd = birthdate else { return "Datum wählen" }
        let fmt = DateFormatter()
        fmt.dateStyle = .long
        fmt.locale = Locale(identifier: "de_DE")
        return fmt.string(from: bd)
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 32) {
                OnboardingQuestion(text: "Wann wurdest du geboren?")

                VStack(spacing: 16) {
                    Button {
                        showDatePicker.toggle()
                    } label: {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(FrigyBrand.primaryDark)
                                .font(.system(size: 18))
                            Text(formatted)
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundColor(birthdate == nil ? FrigyBrand.textMuted : FrigyBrand.text)
                            Spacer()
                            Image(systemName: "chevron.down")
                                .font(.system(size: 14))
                                .foregroundColor(FrigyBrand.textMuted)
                                .rotationEffect(.degrees(showDatePicker ? 180 : 0))
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 16)
                        .frame(maxWidth: 320)
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(FrigyBrand.borderMint, lineWidth: 1)
                        )
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.12), radius: 16, y: 8)
                    }
                    .buttonStyle(.plain)
                    .animation(.easeInOut(duration: 0.2), value: showDatePicker)

                    if showDatePicker {
                        DatePicker("", selection: Binding(
                            get: { birthdate ?? maxDate },
                            set: { birthdate = $0 }
                        ), in: minDate...maxDate, displayedComponents: .date)
                        .datePickerStyle(.wheel)
                        .labelsHidden()
                        .frame(maxWidth: 320)
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    if let age = ageText {
                        Text(age)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                }
            }

            Spacer()

            OnboardingContinueButton(isEnabled: ageText != nil) {
                var updated = draft
                if let bd = birthdate {
                    let comps = Calendar.current.dateComponents([.year], from: bd, to: Date())
                    updated.age = comps.year ?? 25
                }
                onNext(updated)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }
}
