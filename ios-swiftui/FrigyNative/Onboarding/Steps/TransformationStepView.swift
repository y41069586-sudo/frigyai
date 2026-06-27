import SwiftUI

struct TransformationStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let timeline: [(String, String, String)] = [
        ("Woche 1",  "Gewohnheiten aufbauen",      "sparkles"),
        ("Woche 2",  "Erste Veränderungen spüren",  "bolt.fill"),
        ("Woche 4",  "Sichtbare Ergebnisse",         "chart.line.uptrend.xyaxis"),
        ("Woche 8",  "Ziel erreicht!",              "trophy.fill"),
    ]

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            Spacer()

            VStack(spacing: 28) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.15))
                            .frame(width: 88, height: 88)
                        Image(systemName: "figure.walk")
                            .font(.system(size: 36, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    Text("Deine Transformation")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("Schritt für Schritt zu deinem Ziel")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                }

                VStack(spacing: 0) {
                    ForEach(Array(timeline.enumerated()), id: \.offset) { idx, item in
                        HStack(spacing: 16) {
                            VStack(spacing: 0) {
                                ZStack {
                                    Circle()
                                        .fill(FrigyBrand.primary.opacity(0.2))
                                        .frame(width: 36, height: 36)
                                    Image(systemName: item.2)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(FrigyBrand.primaryDark)
                                }
                                if idx < timeline.count - 1 {
                                    Rectangle()
                                        .fill(FrigyBrand.borderMint.opacity(0.5))
                                        .frame(width: 2, height: 24)
                                }
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.0)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(FrigyBrand.primaryDark)
                                Text(item.1)
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundColor(FrigyBrand.text)
                            }
                            Spacer()
                        }
                        .padding(.vertical, idx < timeline.count - 1 ? 0 : 0)
                    }
                }
                .padding(.horizontal, 32)
            }

            Spacer()

            OnboardingContinueButton("Ich bin dabei!", action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }
}
