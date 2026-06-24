import SwiftUI

struct BirthdateStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: (UserProfileDraft) -> Void

    @State private var draft: UserProfileDraft
    @State private var selectedDate: Date

    private static let calendar = Calendar.current

    private static var maxDate: Date {
        calendar.date(byAdding: .year, value: -13, to: Date()) ?? Date()
    }

    private static var minDate: Date {
        calendar.date(byAdding: .year, value: -100, to: Date()) ?? Date()
    }

    init(profile: UserProfileDraft, progress: Double, onBack: (() -> Void)?, onNext: @escaping (UserProfileDraft) -> Void) {
        self.profile = profile
        self.progress = progress
        self.onBack = onBack
        self.onNext = onNext
        _draft = State(initialValue: profile)

        let age = profile.age > 0 ? profile.age : 25
        let defaultDate = Self.calendar.date(byAdding: .year, value: -age, to: Date()) ?? Self.maxDate
        let clamped = min(max(defaultDate, Self.minDate), Self.maxDate)
        _selectedDate = State(initialValue: clamped)
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            FrigyMascotQuestion("Wann wurdest du geboren?")
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 12)

            Spacer()

            DatePicker(
                "",
                selection: $selectedDate,
                in: Self.minDate...Self.maxDate,
                displayedComponents: [.date]
            )
            .datePickerStyle(.wheel)
            .labelsHidden()
            .environment(\.locale, Locale(identifier: "de_DE"))
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .onChange(of: selectedDate) { _, date in
                draft.age = Self.calendar.dateComponents([.year], from: date, to: Date()).year ?? 25
            }

            Spacer()

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton {
                    var u = draft
                    u.age = Self.calendar.dateComponents([.year], from: selectedDate, to: Date()).year ?? 25
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
