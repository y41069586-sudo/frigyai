import SwiftUI

struct TrackerIntroStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private let macros: [(String, String, Color)] = [
        ("Kalorien",     "1.850 / 1.850",  FrigyBrand.primaryDark),
        ("Protein",      "120 / 140g",     Color(hex: "#3B82F6")),
        ("Kohlenhydrate","185 / 210g",     Color(hex: "#F59E0B")),
        ("Fett",         "55 / 62g",       Color(hex: "#EF4444")),
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
                        Image(systemName: "fork.knife")
                            .font(.system(size: 34, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    Text("Mahlzeiten tracken")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text("Behalte deine Nährwerte mühelos im Blick.")
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                VStack(spacing: 8) {
                    ForEach(macros, id: \.0) { macro in
                        macroRow(label: macro.0, value: macro.1, color: macro.2)
                    }
                }
                .padding(.horizontal, 24)

                HStack(spacing: 8) {
                    Image(systemName: "barcode.viewfinder")
                        .foregroundColor(FrigyBrand.primaryDark)
                    Text("Barcode scannen oder Gericht suchen")
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(FrigyBrand.primary.opacity(0.1))
                .clipShape(Capsule())
            }

            Spacer()

            OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
        }
    }

    private func macroRow(label: String, value: String, color: Color) -> some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(FrigyBrand.text)
            Spacer()
            Text(value)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(color)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(Color(UIColor.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}
