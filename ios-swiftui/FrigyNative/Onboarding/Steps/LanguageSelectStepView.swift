import SwiftUI

struct LanguageSelectStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var selected = "de"

    @Environment(LanguageManager.self) private var lang

    private let languages = [
        ("de", "🇩🇪", "Deutsch"),
        ("en", "🇬🇧", "English"),
        ("tr", "🇹🇷", "Türkçe"),
        ("fr", "🇫🇷", "Français"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.15))
                            .frame(width: 80, height: 80)
                        Image(systemName: "globe")
                            .font(.system(size: 34, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    Text(lang.t("Sprache wählen"))
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                }

                VStack(spacing: 10) {
                    ForEach(languages, id: \.0) { lang in
                        Button {
                            withAnimation(.spring(duration: 0.2)) { selected = lang.0 }
                        } label: {
                            HStack(spacing: 14) {
                                Text(lang.1)
                                    .font(.system(size: 28))
                                Text(lang.2)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                Spacer()
                                if selected == lang.0 {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(FrigyBrand.primaryDark)
                                        .font(.system(size: 22))
                                }
                            }
                            .padding(16)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(selected == lang.0 ? FrigyBrand.selectedBg : .white)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(selected == lang.0 ? FrigyBrand.primary : FrigyBrand.cardBorder, lineWidth: selected == lang.0 ? 1.5 : 1)
                                    )
                            )
                        }
                        .buttonStyle(.plain)
                        .scaleEffect(selected == lang.0 ? 1.01 : 1)
                    }
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
