import SwiftUI

struct TutorialStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var currentPage = 0

    private let pages: [(String, String, String)] = [
        ("house.fill",          "Home-Dashboard",    "Tägliche Übersicht deiner Kalorien & Makros auf einen Blick."),
        ("calendar",            "Wochenplan",        "Dein personalisierter Ernährungsplan für die ganze Woche."),
        ("camera.viewfinder",   "Kühlschrank",       "Scanne Zutaten und erhalte passende Rezeptvorschläge."),
        ("cart.fill",           "Einkaufsliste",     "Automatisch generierte Liste mit allem was du brauchst."),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                Text("Kurzes Tutorial")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(FrigyBrand.text)

                TabView(selection: $currentPage) {
                    ForEach(Array(pages.enumerated()), id: \.offset) { idx, page in
                        tutorialCard(icon: page.0, title: page.1, detail: page.2)
                            .tag(idx)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(height: 220)

                HStack(spacing: 8) {
                    ForEach(0..<pages.count, id: \.self) { idx in
                        Capsule()
                            .fill(currentPage == idx ? FrigyBrand.primaryDark : FrigyBrand.borderMint.opacity(0.4))
                            .frame(width: currentPage == idx ? 20 : 8, height: 8)
                            .animation(.spring(duration: 0.3), value: currentPage)
                    }
                }
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func tutorialCard(icon: String, title: String, detail: String) -> some View {
        VStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(FrigyBrand.selectedBg)
                    .frame(width: 80, height: 80)
                Image(systemName: icon)
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(FrigyBrand.text)
            Text(detail)
                .font(.system(size: 14))
                .foregroundColor(FrigyBrand.textMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .padding(.horizontal, 24)
    }
}
