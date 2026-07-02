import SwiftUI

/// Language picker. Selecting a language updates `LanguageManager` immediately,
/// which re-renders every view that reads localized strings via `t(_:)` and
/// re-applies the locale used for date/number formatting.
struct LanguageView: View {
    @Environment(LanguageManager.self) private var lang

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                FrigyNavBar(title: lang.t("Sprache"))
                VStack(spacing: 20) {
                    Text(lang.t("Wähle deine bevorzugte Sprache. Die Änderung wird sofort übernommen."))
                        .font(.system(size: 14))
                        .foregroundColor(FrigyBrand.textMuted)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.top, 12)

                    VStack(spacing: 0) {
                        ForEach(AppLanguage.allCases) { option in
                            Button {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                                    lang.choose(option)
                                }
                            } label: {
                                HStack(spacing: 14) {
                                    Text(option.flag)
                                        .font(.system(size: 26))
                                        .frame(width: 38, height: 38)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(option.displayName)
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundColor(FrigyBrand.text)
                                        Text(option.germanName)
                                            .font(.system(size: 12))
                                            .foregroundColor(FrigyBrand.textMuted)
                                    }
                                    Spacer()
                                    if lang.language == option {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.system(size: 20))
                                            .foregroundColor(FrigyBrand.primaryDark)
                                    }
                                }
                                .padding(14)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            if option != AppLanguage.allCases.last {
                                Divider().padding(.leading, 66)
                            }
                        }
                    }
                    .frigyCard(cornerRadius: 18)
                    .padding(.horizontal, 20)

                    Spacer().frame(height: 40)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}
