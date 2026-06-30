import SwiftUI

struct ComparisonStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 24) {
                Text(lang.t("Mit & ohne Frigy"))
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                    .multilineTextAlignment(.center)

                HStack(spacing: 12) {
                    comparisonCard(
                        title: lang.t("Ohne Frigy"),
                        color: Color(hex: "#EF4444"),
                        bgColor: Color(hex: "#FEF2F2"),
                        borderColor: Color(hex: "#FCA5A5"),
                        icon: "xmark.circle.fill",
                        items: [
                            lang.t("Unstrukturiert essen"),
                            lang.t("Keine Übersicht"),
                            lang.t("Zeitaufwändiges Planen"),
                            lang.t("Lebensmittel vergessen"),
                        ]
                    )
                    comparisonCard(
                        title: lang.t("Mit Frigy"),
                        color: FrigyBrand.primaryDark,
                        bgColor: FrigyBrand.selectedBg,
                        borderColor: FrigyBrand.borderMint,
                        icon: "checkmark.circle.fill",
                        items: [
                            lang.t("Klarer Wochenplan"),
                            lang.t("Makros im Blick"),
                            lang.t("Automatisch planen"),
                            lang.t("Einkauf optimiert"),
                        ]
                    )
                }
                .padding(.horizontal, 24)
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func comparisonCard(title: String, color: Color, bgColor: Color, borderColor: Color, icon: String, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(color)
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(color)
            }
            Divider()
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top, spacing: 6) {
                    Image(systemName: icon)
                        .font(.system(size: 12))
                        .foregroundColor(color)
                        .padding(.top, 1)
                    Text(item)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(FrigyBrand.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(bgColor)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(borderColor, lineWidth: 1.5))
    }
}
