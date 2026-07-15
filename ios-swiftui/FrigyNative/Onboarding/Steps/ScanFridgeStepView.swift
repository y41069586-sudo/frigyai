import SwiftUI

/// Hook screen 2/3 — the fridge/ingredient scan, shown as a living camera
/// viewfinder: corner brackets, a sweeping scan beam, and ingredient chips
/// that pop in one after another as if the AI were recognizing them live.
///
/// Pure showcase — this screen sits seconds after launch in the value-first
/// hook phase, so it must NOT trigger the camera permission. The request
/// lives in CameraPermissionStepView, late in the flow where it has context.
struct ScanFridgeStepView: View {
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var appeared = false
    @State private var beamDown = false

    @Environment(LanguageManager.self) private var lang

    private var chips: [(emoji: String, name: String)] {
        [
            ("🥑", lang.t("Avocados")),
            ("🍓", lang.t("Bio-Beeren")),
            ("🥗", lang.t("Rucola-Salat")),
        ]
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            VStack(alignment: .leading, spacing: 6) {
                Text(lang.t("Erkenne deine Zutaten."))
                    .font(.system(size: 28, weight: .heavy, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                Text(lang.t("Scanne später deinen Kühlschrank — Frigy erkennt, was du hast und was für deinen Plan noch fehlt."))
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

            viewfinder
                .padding(.horizontal, 32)

            Spacer(minLength: 12)

            // Proof line
            HStack(spacing: 10) {
                Image(systemName: "camera.viewfinder")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDeep)
                Text(lang.t("KI erkennt alle Zutaten per Foto"))
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
            .padding(.horizontal, 24)
            .padding(.bottom, 8)
            .opacity(appeared ? 1 : 0)
            .offset(x: appeared ? 0 : -14)
            .animation(.spring(response: 0.45, dampingFraction: 0.8).delay(1.1), value: appeared)

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
            withAnimation(.easeInOut(duration: 2.1).repeatForever(autoreverses: true)) {
                beamDown = true
            }
        }
    }

    // MARK: - Viewfinder mockup

    private var viewfinder: some View {
        ZStack {
            // Deep green "camera feed" backdrop
            RoundedRectangle(cornerRadius: 28)
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#0E3B26"), Color(hex: "#14532D")],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                )
                .shadow(color: FrigyBrand.primaryDeep.opacity(0.35), radius: 22, y: 10)

            // Sweeping scan beam
            GeometryReader { geo in
                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        LinearGradient(
                            colors: [FrigyBrand.primary.opacity(0), FrigyBrand.primary, FrigyBrand.primary.opacity(0)],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .frame(height: 3)
                    .shadow(color: FrigyBrand.primary.opacity(0.9), radius: 7)
                    .padding(.horizontal, 24)
                    .offset(y: beamDown ? geo.size.height - 36 : 30)
            }

            // Ingredient chips pop in staggered, as if just recognized
            VStack(spacing: 12) {
                ForEach(Array(chips.enumerated()), id: \.offset) { idx, chip in
                    HStack(spacing: 8) {
                        Text(chip.emoji).font(.system(size: 17))
                        Text(chip.name)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(FrigyBrand.text)
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 15))
                            .foregroundColor(FrigyBrand.primaryDeep)
                    }
                    .padding(.horizontal, 13)
                    .padding(.vertical, 9)
                    .background(Capsule().fill(Color(UIColor.systemBackground).opacity(0.96)))
                    .shadow(color: .black.opacity(0.18), radius: 8, y: 3)
                    // Slight left/right rhythm so it reads organic, not listy
                    .offset(x: idx == 1 ? 26 : -14)
                    .scaleEffect(appeared ? 1 : 0.3)
                    .opacity(appeared ? 1 : 0)
                    .animation(
                        .spring(response: 0.45, dampingFraction: 0.62).delay(0.55 + Double(idx) * 0.28),
                        value: appeared
                    )
                }
            }

            // Corner brackets
            cornerBrackets
        }
        .frame(height: 250)
        .frame(maxWidth: 380)
        .scaleEffect(appeared ? 1 : 0.92)
        .opacity(appeared ? 1 : 0)
        .animation(.spring(response: 0.55, dampingFraction: 0.75).delay(0.15), value: appeared)
    }

    private var cornerBrackets: some View {
        GeometryReader { geo in
            let len: CGFloat = 26
            let inset: CGFloat = 14
            let w = geo.size.width
            let h = geo.size.height
            Path { p in
                // top-left
                p.move(to: CGPoint(x: inset, y: inset + len))
                p.addLine(to: CGPoint(x: inset, y: inset))
                p.addLine(to: CGPoint(x: inset + len, y: inset))
                // top-right
                p.move(to: CGPoint(x: w - inset - len, y: inset))
                p.addLine(to: CGPoint(x: w - inset, y: inset))
                p.addLine(to: CGPoint(x: w - inset, y: inset + len))
                // bottom-right
                p.move(to: CGPoint(x: w - inset, y: h - inset - len))
                p.addLine(to: CGPoint(x: w - inset, y: h - inset))
                p.addLine(to: CGPoint(x: w - inset - len, y: h - inset))
                // bottom-left
                p.move(to: CGPoint(x: inset + len, y: h - inset))
                p.addLine(to: CGPoint(x: inset, y: h - inset))
                p.addLine(to: CGPoint(x: inset, y: h - inset - len))
            }
            .stroke(Color.white.opacity(0.85), style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
        }
    }
}
