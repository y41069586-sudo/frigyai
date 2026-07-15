import SwiftUI

/// Hook screen 1/3 — the weekly plan. Instead of telling the user what the
/// plan feature does, this screen SHOWS it: a live-assembling mockup of a plan
/// day (day picker + three meal rows springing in one by one, crowned by a
/// floating "KI" badge), followed by three compact proof chips.
struct WeeklyPlanStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var appeared = false
    @State private var badgeFloat = false

    @Environment(LanguageManager.self) private var lang

    private var mockMeals: [(emoji: String, name: String, kcal: String)] {
        [
            ("🥣", lang.t("Haferflocken & Beeren"), "420"),
            ("🥗", lang.t("Hähnchen-Bowl"), "560"),
            ("🐟", lang.t("Lachs & Gemüse"), "610"),
        ]
    }

    private var proofChips: [String] {
        [
            lang.t("KI wählt optimale Mahlzeiten"),
            lang.t("Kalorienziel wird eingehalten"),
            lang.t("Jede Woche frisch generiert"),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Headline
            VStack(alignment: .leading, spacing: 6) {
                Text(lang.t("Dein Wochenplan"))
                    .font(.system(size: 28, weight: .heavy, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                Text(lang.t("Frigy erstellt dir einen vollständigen 7-Tage-Ernährungsplan – automatisch & personalisiert."))
                    .font(.system(size: 14.5))
                    .foregroundColor(FrigyBrand.textMuted)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
            .animation(.easeOut(duration: 0.4), value: appeared)

            Spacer(minLength: 12)

            planMockCard
                .padding(.horizontal, 24)

            Spacer(minLength: 12)

            // Proof chips
            VStack(spacing: 8) {
                ForEach(Array(proofChips.enumerated()), id: \.offset) { idx, chip in
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 16))
                            .foregroundColor(FrigyBrand.primaryDeep)
                        Text(chip)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(FrigyBrand.text)
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        Capsule()
                            .fill(FrigyBrand.selectedBg.opacity(0.55))
                            .overlay(Capsule().stroke(FrigyBrand.cardBorder.opacity(0.7), lineWidth: 1))
                    )
                    .opacity(appeared ? 1 : 0)
                    .offset(x: appeared ? 0 : -14)
                    .animation(.spring(response: 0.45, dampingFraction: 0.8).delay(0.9 + Double(idx) * 0.1), value: appeared)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 8)

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
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                badgeFloat = true
            }
        }
    }

    // MARK: - Plan mockup

    private var planMockCard: some View {
        VStack(spacing: 0) {
            // Card header: calendar + day pills (numbers — language-neutral)
            HStack(spacing: 8) {
                Image(systemName: "calendar")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDeep)
                ForEach(1...7, id: \.self) { day in
                    let active = day == 3
                    Text("\(day)")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundColor(active ? .white : FrigyBrand.textMuted)
                        .frame(width: 26, height: 26)
                        .background(
                            Circle().fill(
                                active
                                    ? AnyShapeStyle(LinearGradient(
                                        colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                        startPoint: .top, endPoint: .bottom))
                                    : AnyShapeStyle(FrigyBrand.selectedBg.opacity(0.6))
                            )
                        )
                        .scaleEffect(appeared ? 1 : 0.4)
                        .animation(
                            .spring(response: 0.4, dampingFraction: 0.6).delay(0.25 + Double(day) * 0.04),
                            value: appeared
                        )
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 12)

            Divider().overlay(FrigyBrand.borderMint.opacity(0.35)).padding(.horizontal, 16)

            // Meal rows assemble one by one
            VStack(spacing: 0) {
                ForEach(Array(mockMeals.enumerated()), id: \.offset) { idx, meal in
                    HStack(spacing: 12) {
                        Text(meal.emoji)
                            .font(.system(size: 22))
                            .frame(width: 40, height: 40)
                            .background(FrigyBrand.selectedBg.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
                        Text(meal.name)
                            .font(.system(size: 14.5, weight: .semibold))
                            .foregroundColor(FrigyBrand.text)
                            .lineLimit(1)
                        Spacer()
                        Text("\(meal.kcal) kcal")
                            .font(.system(size: 12.5, weight: .semibold, design: .rounded))
                            .foregroundColor(FrigyBrand.primaryDeep)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(FrigyBrand.primary.opacity(0.14), in: Capsule())
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 16)
                    .animation(
                        .spring(response: 0.5, dampingFraction: 0.75).delay(0.5 + Double(idx) * 0.15),
                        value: appeared
                    )
                }
            }
            .padding(.bottom, 10)
        }
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color(UIColor.systemBackground).opacity(0.92))
                .shadow(color: FrigyBrand.primaryDark.opacity(0.14), radius: 20, y: 8)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(FrigyBrand.cardBorder, lineWidth: 1)
        )
        // Floating "KI" badge
        .overlay(alignment: .topTrailing) {
            HStack(spacing: 4) {
                Image(systemName: "sparkles")
                    .font(.system(size: 11, weight: .bold))
                // Localized — "AI" on an English device, "KI" on German, etc.
                Text(lang.t("KI"))
                    .font(.system(size: 12, weight: .heavy, design: .rounded))
            }
            .foregroundColor(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule().fill(LinearGradient(
                    colors: [FrigyBrand.primaryDark, FrigyBrand.primaryDeep],
                    startPoint: .topLeading, endPoint: .bottomTrailing))
            )
            .shadow(color: FrigyBrand.primaryDeep.opacity(0.45), radius: 8, y: 3)
            .rotationEffect(.degrees(4))
            .offset(x: 8, y: badgeFloat ? -16 : -10)
            .opacity(appeared ? 1 : 0)
            .animation(.spring(response: 0.5, dampingFraction: 0.6).delay(0.8), value: appeared)
        }
        .scaleEffect(appeared ? 1 : 0.92)
        .opacity(appeared ? 1 : 0)
        .animation(.spring(response: 0.55, dampingFraction: 0.75).delay(0.15), value: appeared)
    }
}
