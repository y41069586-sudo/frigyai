import SwiftUI

struct ScanFeedbackStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let items = [
        ("Hähnchenbrust",  "23g Protein · 165 kcal",  true),
        ("Brokkoli",       "2,8g Protein · 34 kcal",  true),
        ("Cheddar",        "7g Fett · 113 kcal",       true),
        ("Milch 1,5%",     "3,4g Protein · 47 kcal",  true),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.15))
                            .frame(width: 80, height: 80)
                        Image(systemName: "sparkles")
                            .font(.system(size: 32, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    Text("KI-Scan Feedback")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("So erkennst du deine Zutaten mit Frigy")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                }

                VStack(spacing: 8) {
                    HStack {
                        Text("Erkannte Lebensmittel")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                        Spacer()
                        Text("\(items.count) Artikel")
                            .font(.system(size: 12))
                            .foregroundColor(FrigyBrand.primaryDark)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(FrigyBrand.primary.opacity(0.2))
                            .clipShape(Capsule())
                    }

                    ForEach(items, id: \.0) { item in
                        HStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(FrigyBrand.primaryDark)
                                .font(.system(size: 18))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.0)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                Text(item.1)
                                    .font(.system(size: 12))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                            Spacer()
                        }
                        .padding(12)
                        .background(Color(UIColor.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(FrigyBrand.cardBorder, lineWidth: 1))
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
