import SwiftUI

struct GoalPreviewStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    private var currentKg: Double { profile.weightKg }
    private var targetKg: Double { profile.targetWeightKg }
    private var deltaKg: Double { abs(targetKg - currentKg) }

    private var direction: String {
        if profile.goalMode == "maintain" { return "maintain" }
        return targetKg < currentKg ? "lose" : targetKg > currentKg ? "gain" : "maintain"
    }

    private var headlineText: String {
        let deltaStr = String(format: "%.1f", deltaKg).replacingOccurrences(of: ".", with: ",")
        switch direction {
        case "lose":     return "BEREIT, \(deltaStr) KG ABZUNEHMEN — EIN ERREICHBARES ZIEL!"
        case "gain":     return "BEREIT, \(deltaStr) KG ZUZUNEHMEN — EIN ERREICHBARES ZIEL!"
        default:         return "BEREIT, DEIN GEWICHT ZU HALTEN — EIN ERREICHBARES ZIEL!"
        }
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
            // Headline with highlighted delta
            VStack(alignment: .leading, spacing: 0) {
                Text(headlineTextAttributed)
                    .font(.system(size: 17, weight: .black))
                    .foregroundColor(FrigyBrand.text)
                    .tracking(-0.5)
                    .textCase(.uppercase)
                    .lineSpacing(2)
                    .padding(.horizontal, 20)
                    .padding(.top, 4)
                    .padding(.bottom, 4)
            }

            // Subtitle
            Text("Illustrativer Vergleich aus deinen Angaben — nur motivierend, keine medizinische Prognose.")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

            Spacer()

            // Chart card
            chartCard
                .padding(.horizontal, 20)

            Spacer()

            // Bottom bar
            VStack(spacing: 0) {
                Divider().overlay(Color.black.opacity(0.06))
                OnboardingContinueButton(action: onNext)
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(20, 16))
                .background(FrigyBrand.bg)
            }
        }
    }

    private var headlineTextAttributed: AttributedString {
        var result = AttributedString(headlineText)
        // Highlight delta part
        let deltaStr = String(format: "%.1f", deltaKg).replacingOccurrences(of: ".", with: ",")
        let highlight = "\(deltaStr) KG"
        if let range = result.range(of: highlight) {
            result[range].foregroundColor = FrigyBrand.primaryDeep
        }
        return result
    }

    private var chartCard: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 28)
                .fill(
                    LinearGradient(
                        colors: [Color.white.opacity(0.85), Color.white.opacity(0.55)],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 28)
                        .stroke(Color(hex: "#D1D5DB").opacity(0.5), lineWidth: 1)
                )
                .shadow(color: Color(hex: "#0A7848").opacity(0.12), radius: 24, y: 12)

            Canvas { ctx, size in
                let padL: CGFloat = 28, padR: CGFloat = 28, padT: CGFloat = 38, padB: CGFloat = 38
                let x0 = padL, x1 = size.width - padR
                let yTop = padT, yBot = size.height - padB
                let yStart = yBot - 4
                let yEnd = direction == "maintain" ? (yTop + yBot) / 2 - 4 : yTop + 18

                // Grid lines
                let gridYs: [CGFloat] = [yStart, yStart + (yBot - yStart) * 0.38, yStart + (yBot - yStart) * 0.72, yBot - 2]
                for (i, gy) in gridYs.enumerated() {
                    var path = Path()
                    path.move(to: CGPoint(x: x0, y: gy))
                    path.addLine(to: CGPoint(x: x1, y: gy))
                    ctx.stroke(path, with: .color(Color(hex: "#D1D5DB").opacity(i == 0 ? 0.55 : 0.32)),
                               style: StrokeStyle(lineWidth: i == 0 ? 0.85 : 0.55, dash: [i == 0 ? 4 : 2, i == 0 ? 6 : 7]))
                }

                // "Without Frigy" line (dashed, goes up then comes back down)
                let peakY = max(yTop + 16, yStart - 34)
                let angle = tan(38 * Double.pi / 180)
                let rise = yStart - peakY
                let peakX = min(x0 + rise / angle, x0 + (x1 - x0) * 0.5)
                let endBadY = min(yBot - 6, yStart + 14)
                var badPath = Path()
                badPath.move(to: CGPoint(x: x0, y: yStart))
                badPath.addCurve(to: CGPoint(x: peakX, y: peakY),
                                 control1: CGPoint(x: x0 + (peakX - x0) * 0.58, y: yStart - rise * 0.58),
                                 control2: CGPoint(x: peakX - 28, y: peakY))
                badPath.addCurve(to: CGPoint(x: x1, y: endBadY),
                                 control1: CGPoint(x: peakX + 28, y: peakY),
                                 control2: CGPoint(x: x1 - 44, y: endBadY + 6))
                ctx.stroke(badPath, with: .color(Color(hex: "#E5E7EB")),
                           style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round, dash: [6, 7]))

                // Smooth, symmetric ease-in-out S-curve (control points scale with
                // width so it stays smooth on every device, incl. iPad).
                let dx = x1 - x0
                let c1 = CGPoint(x: x0 + dx * 0.5, y: yStart)
                let c2 = CGPoint(x: x1 - dx * 0.5, y: yEnd)

                // Area fill under success curve
                var areaPath = Path()
                areaPath.move(to: CGPoint(x: x0, y: yStart))
                areaPath.addCurve(to: CGPoint(x: x1, y: yEnd), control1: c1, control2: c2)
                areaPath.addLine(to: CGPoint(x: x1, y: yBot))
                areaPath.addLine(to: CGPoint(x: x0, y: yBot))
                areaPath.closeSubpath()
                ctx.fill(areaPath, with: .linearGradient(
                    Gradient(colors: [FrigyBrand.primary.opacity(0.30), FrigyBrand.primary.opacity(0.02)]),
                    startPoint: CGPoint(x: 0, y: yTop),
                    endPoint: CGPoint(x: 0, y: yBot)
                ))

                // Success curve
                var mainPath = Path()
                mainPath.move(to: CGPoint(x: x0, y: yStart))
                mainPath.addCurve(to: CGPoint(x: x1, y: yEnd), control1: c1, control2: c2)
                ctx.stroke(mainPath, with: .color(FrigyBrand.primaryDark),
                           style: StrokeStyle(lineWidth: 3.5, lineCap: .round, lineJoin: .round))

                // Start dot
                ctx.fill(Path(ellipseIn: CGRect(x: x0 - 5, y: yStart - 5, width: 10, height: 10)), with: .color(.white))
                ctx.stroke(Path(ellipseIn: CGRect(x: x0 - 5, y: yStart - 5, width: 10, height: 10)),
                           with: .color(FrigyBrand.primaryDeep), style: StrokeStyle(lineWidth: 2.5))

                // End dot (success)
                ctx.fill(Path(ellipseIn: CGRect(x: x1 - 6, y: yEnd - 6, width: 12, height: 12)), with: .color(FrigyBrand.primary))
                ctx.stroke(Path(ellipseIn: CGRect(x: x1 - 6, y: yEnd - 6, width: 12, height: 12)),
                           with: .color(.white), style: StrokeStyle(lineWidth: 3))

                // End dot (without Frigy)
                ctx.fill(Path(ellipseIn: CGRect(x: x1 - 5, y: endBadY - 5, width: 10, height: 10)), with: .color(Color(hex: "#E5E7EB")))
                ctx.stroke(Path(ellipseIn: CGRect(x: x1 - 5, y: endBadY - 5, width: 10, height: 10)),
                           with: .color(.white), style: StrokeStyle(lineWidth: 2.5))
            }
            .frame(height: 200)
            .overlay(alignment: .topLeading) {
                Text("Dein Gewicht")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(FrigyBrand.textMuted)
                    .padding(.leading, 28)
                    .padding(.top, 12)
            }
            .overlay(alignment: .topTrailing) {
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Mit Frigy")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(FrigyBrand.primaryDeep)
                    Text("Ohne Frigy")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(Color(hex: "#9CA3AF"))
                }
                .padding(.trailing, 12)
                .padding(.top, 24)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
    }
}
