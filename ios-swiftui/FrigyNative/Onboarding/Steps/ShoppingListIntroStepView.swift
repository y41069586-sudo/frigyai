import SwiftUI

/// Hook screen 3/3 — the automatic shopping list, shown as a live list that
/// checks itself off: items tick one by one with a spring, the progress pill
/// counts up, and the header badge celebrates when everything is done.
struct ShoppingListIntroStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var appeared = false
    @State private var checkedCount = 0

    @Environment(LanguageManager.self) private var lang

    private var items: [(emoji: String, label: String)] {
        [
            ("🥛", lang.t("Bio-Hafermilch")),
            ("🥑", lang.t("Avocados")),
            ("🐟", lang.t("Lachsfilet")),
            ("🥗", lang.t("Rucola-Salat")),
            ("🍓", lang.t("Bio-Beeren")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            VStack(alignment: .leading, spacing: 6) {
                Text(lang.t("Deine Einkaufsliste, automatisch."))
                    .font(.system(size: 28, weight: .heavy, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                Text(lang.t("Nur die Zutaten, die dir noch fehlen."))
                    .font(.system(size: 14.5))
                    .foregroundColor(FrigyBrand.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
            .animation(.easeOut(duration: 0.4), value: appeared)

            Spacer(minLength: 12)

            shoppingCard
                .frame(maxWidth: .infinity)
                .scaleEffect(appeared ? 1 : 0.9)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.55, dampingFraction: 0.75).delay(0.12), value: appeared)

            Spacer(minLength: 12)

            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(action: onNext)
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, max(20, 16))
                    .background(FrigyBrand.bg)
            }
        }
        .onAppear {
            appeared = true
            // Tick the items off one by one — the list "shops itself".
            for i in 1...items.count {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.7 + Double(i) * 0.35) {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.6)) {
                        checkedCount = i
                    }
                }
            }
        }
    }

    private var shoppingCard: some View {
        VStack(spacing: 0) {
            // Card header
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(LinearGradient(
                            colors: [FrigyBrand.primaryDark, FrigyBrand.primaryDeep],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 38, height: 38)
                    Image(systemName: "cart.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(lang.t("Meine Einkaufsliste"))
                        .font(.system(size: 14.5, weight: .bold, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t("%@ Artikel").replacingOccurrences(of: "%@", with: "\(items.count)"))
                        .font(.system(size: 12))
                        .foregroundColor(FrigyBrand.textMuted)
                }
                Spacer()
                // Live counter pill: fills as items tick, celebrates at 100 %.
                Text("\(checkedCount)/\(items.count)")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(checkedCount == items.count ? .white : FrigyBrand.primaryDeep)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        Capsule().fill(
                            checkedCount == items.count
                                ? AnyShapeStyle(LinearGradient(
                                    colors: [FrigyBrand.primaryDark, FrigyBrand.primaryDeep],
                                    startPoint: .leading, endPoint: .trailing))
                                : AnyShapeStyle(FrigyBrand.primary.opacity(0.18))
                        )
                    )
                    .scaleEffect(checkedCount == items.count ? 1.08 : 1)
            }
            .padding(.horizontal, 18)
            .padding(.top, 16)
            .padding(.bottom, 12)

            Divider()
                .overlay(FrigyBrand.borderMint.opacity(0.5))
                .padding(.horizontal, 18)

            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { idx, item in
                    let checked = idx < checkedCount
                    HStack(spacing: 12) {
                        // Checkbox: empty ring → filled spring-in check
                        ZStack {
                            Circle()
                                .stroke(checked ? FrigyBrand.primaryDeep : FrigyBrand.cardBorder, lineWidth: 2)
                                .frame(width: 22, height: 22)
                            if checked {
                                Circle()
                                    .fill(FrigyBrand.primaryDeep)
                                    .frame(width: 22, height: 22)
                                Image(systemName: "checkmark")
                                    .font(.system(size: 10, weight: .heavy))
                                    .foregroundColor(.white)
                            }
                        }
                        .scaleEffect(checked ? 1 : 0.92)
                        Text(item.emoji)
                            .font(.system(size: 18))
                        Text(item.label)
                            .font(.system(size: 14.5, weight: .medium))
                            .foregroundColor(checked ? FrigyBrand.textMuted : FrigyBrand.text)
                            .strikethrough(checked, color: FrigyBrand.textMuted.opacity(0.7))
                        Spacer()
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 11)
                    .opacity(appeared ? 1 : 0)
                    .offset(x: appeared ? 0 : 16)
                    .animation(.spring(response: 0.4, dampingFraction: 0.7).delay(0.2 + Double(idx) * 0.06), value: appeared)

                    if idx < items.count - 1 {
                        Divider()
                            .overlay(FrigyBrand.borderMint.opacity(0.3))
                            .padding(.horizontal, 18)
                    }
                }
            }
            .padding(.bottom, 12)
        }
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color(UIColor.systemBackground))
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                )
                .shadow(color: FrigyBrand.primaryDark.opacity(0.12), radius: 18, y: 8)
        )
        .padding(.horizontal, 28)
    }
}
