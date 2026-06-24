import SwiftUI

struct GoalPreviewStepView: View {
    let profile: UserProfileDraft
    let progress: Double
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @State private var drawProgress: CGFloat = 0
    @State private var showDots = false

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
        case "lose":  return "BEREIT, \(deltaStr) KG ABZUNEHMEN — EIN ERREICHBARES ZIEL!"
        case "gain":  return "BEREIT, \(deltaStr) KG ZUZUNEHMEN — EIN ERREICHBARES ZIEL!"
        default:      return "BEREIT, DEIN GEWICHT ZU HALTEN — EIN ERREICHBARES ZIEL!"
        }
    }

    var body: some View {
        OnboardingStepScaffold(progress: progress, onBack: onBack) {
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

            Text("Illustrativer Vergleich aus deinen Angaben — nur motivierend, keine medizinische Prognose.")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(FrigyBrand.textMuted)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

            Spacer()

            chartCard
                .padding(.horizontal, 20)

            Spacer()

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
            withAnimation(.easeInOut(duration: 1.5).delay(0.35)) {
                drawProgress = 1
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.65) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                    showDots = true
                }
            }
        }
    }

    private var headlineTextAttributed: AttributedString {
        var result = AttributedString(headlineText)
        let deltaStr = String(format: "%.1f", deltaKg).replacingOccurrences(of: ".", with: ",")
        let highlight = "\(deltaStr) KG"
        if let range = result.range(of: highlight) {
            result[range].foregroundColor = FrigyBrand.primaryDeep
        }
        return result
    }

    // MARK: - Chart card

    private var chartCard: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 28)
                .fill(LinearGradient(
                    colors: [Color.white.opacity(0.85), Color.white.opacity(0.55)],
                    startPoint: .top, endPoint: .bottom
                ))
                .overlay(
                    RoundedRectangle(cornerRadius: 28)
                        .stroke(Color(hex: "#D1D5DB").opacity(0.5), lineWidth: 1)
                )
                .shadow(color: Color(hex: "#0A7848").opacity(0.12), radius: 24, y: 12)

            animatedChart
                .frame(height: 200)
                .overlay(alignment: .topLeading) {
                    Text("Dein Gewicht")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(FrigyBrand.textMuted)
                        .padding(.leading, 28)
                        .padding(.top, 14)
                }
                .overlay(alignment: .topTrailing) {
                    HStack(spacing: 5) {
                        Circle().fill(FrigyBrand.primaryDeep).frame(width: 7, height: 7)
                        Text("Mit Frigy")
                            .font(.system(size: 12, weight: .black))
                            .foregroundColor(FrigyBrand.primaryDeep)
                    }
                    .padding(.trailing, 14)
                    .padding(.top, 14)
                }
                // "Ohne Frigy" name sits at the bottom, next to where its line ends.
                .overlay(alignment: .bottomTrailing) {
                    HStack(spacing: 5) {
                        Circle().fill(Color(hex: "#EF4444")).frame(width: 7, height: 7)
                        Text("Ohne Frigy")
                            .font(.system(size: 12, weight: .black))
                            .foregroundColor(Color(hex: "#EF4444"))
                    }
                    .padding(.trailing, 14)
                    .padding(.bottom, 14)
                }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
    }

    // MARK: - Animated chart interior

    @ViewBuilder
    private var animatedChart: some View {
        GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            let padL: CGFloat = 28, padR: CGFloat = 28
            let padT: CGFloat = 38, padB: CGFloat = 38
            let x0 = padL, x1 = w - padR
            let yTop = padT, yBot = h - padB
            let yStart = yBot - 4
            let yEnd: CGFloat = direction == "maintain" ? (yTop + yBot) / 2 - 4 : yTop + 18

            let peakY: CGFloat = max(yTop + 16, yStart - 34)
            let rise = yStart - peakY
            let angle = CGFloat(tan(38.0 * .pi / 180))
            let peakX = min(x0 + rise / angle, x0 + (x1 - x0) * 0.5)
            let endBadY = min(yBot - 6, yStart + 14)

            // Derived area opacity — fill fades in during the last 30% of draw progress
            let areaOpacity = Double(max(0, (drawProgress - 0.65) / 0.35))

            ZStack {
                // Static grid lines
                Canvas { ctx, _ in
                    let gridYs: [CGFloat] = [
                        yStart,
                        yStart + (yBot - yStart) * 0.38,
                        yStart + (yBot - yStart) * 0.72,
                        yBot - 2,
                    ]
                    for (i, gy) in gridYs.enumerated() {
                        var path = Path()
                        path.move(to: CGPoint(x: x0, y: gy))
                        path.addLine(to: CGPoint(x: x1, y: gy))
                        ctx.stroke(
                            path,
                            with: .color(Color(hex: "#D1D5DB").opacity(i == 0 ? 0.55 : 0.32)),
                            style: StrokeStyle(
                                lineWidth: i == 0 ? 0.85 : 0.55,
                                dash: [i == 0 ? 4 : 2, i == 0 ? 6 : 7]
                            )
                        )
                    }
                }

                // Area fill (fades in as lines near completion)
                ChartAreaFill(x0: x0, x1: x1, yStart: yStart, yEnd: yEnd, yBot: yBot)
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [
                            FrigyBrand.primary.opacity(0.30),
                            FrigyBrand.primary.opacity(0.02),
                        ]),
                        startPoint: .top,
                        endPoint: .bottom
                    ))
                    .opacity(areaOpacity)

                // "Ohne Frigy" red dashed line — draws in alongside the good line
                BadCurvePath(
                    x0: x0, x1: x1, yStart: yStart,
                    peakX: peakX, peakY: peakY, endBadY: endBadY
                )
                .trim(from: 0, to: drawProgress)
                .stroke(
                    Color(hex: "#EF4444"),
                    style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round, dash: [6, 7])
                )

                // "Mit Frigy" solid line
                GoodCurvePath(x0: x0, x1: x1, yStart: yStart, yEnd: yEnd)
                    .trim(from: 0, to: drawProgress)
                    .stroke(
                        FrigyBrand.primaryDark,
                        style: StrokeStyle(lineWidth: 3.5, lineCap: .round, lineJoin: .round)
                    )

                // Start dot (appears immediately)
                Circle()
                    .fill(Color.white)
                    .overlay(Circle().stroke(FrigyBrand.primaryDeep, lineWidth: 2.5))
                    .frame(width: 10, height: 10)
                    .position(x: x0, y: yStart)
                    .opacity(Double(min(drawProgress * 5, 1)))

                // End dot — Mit Frigy (spring-pops in after lines finish)
                if showDots {
                    Circle()
                        .fill(FrigyBrand.primary)
                        .overlay(Circle().stroke(Color.white, lineWidth: 3))
                        .frame(width: 12, height: 12)
                        .position(x: x1, y: yEnd)
                        .transition(.scale(scale: 0.2).combined(with: .opacity))
                }

                // End dot — Ohne Frigy (red)
                if showDots {
                    Circle()
                        .fill(Color(hex: "#EF4444"))
                        .overlay(Circle().stroke(Color.white, lineWidth: 2.5))
                        .frame(width: 10, height: 10)
                        .position(x: x1, y: endBadY)
                        .transition(.scale(scale: 0.2).combined(with: .opacity))
                }
            }
        }
    }
}

// MARK: - Path shapes

private struct GoodCurvePath: Shape {
    let x0, x1, yStart, yEnd: CGFloat

    func path(in rect: CGRect) -> Path {
        var p = Path()
        let dx = x1 - x0
        p.move(to: CGPoint(x: x0, y: yStart))
        p.addCurve(
            to: CGPoint(x: x1, y: yEnd),
            control1: CGPoint(x: x0 + dx * 0.5, y: yStart),
            control2: CGPoint(x: x1 - dx * 0.5, y: yEnd)
        )
        return p
    }
}

private struct BadCurvePath: Shape {
    let x0, x1, yStart, peakX, peakY, endBadY: CGFloat

    func path(in rect: CGRect) -> Path {
        let rise = yStart - peakY
        var p = Path()
        p.move(to: CGPoint(x: x0, y: yStart))
        p.addCurve(
            to: CGPoint(x: peakX, y: peakY),
            control1: CGPoint(x: x0 + (peakX - x0) * 0.58, y: yStart - rise * 0.58),
            control2: CGPoint(x: peakX - 28, y: peakY)
        )
        p.addCurve(
            to: CGPoint(x: x1, y: endBadY),
            control1: CGPoint(x: peakX + 28, y: peakY),
            control2: CGPoint(x: x1 - 44, y: endBadY + 6)
        )
        return p
    }
}

private struct ChartAreaFill: Shape {
    let x0, x1, yStart, yEnd, yBot: CGFloat

    func path(in rect: CGRect) -> Path {
        var p = Path()
        let dx = x1 - x0
        p.move(to: CGPoint(x: x0, y: yStart))
        p.addCurve(
            to: CGPoint(x: x1, y: yEnd),
            control1: CGPoint(x: x0 + dx * 0.5, y: yStart),
            control2: CGPoint(x: x1 - dx * 0.5, y: yEnd)
        )
        p.addLine(to: CGPoint(x: x1, y: yBot))
        p.addLine(to: CGPoint(x: x0, y: yBot))
        p.closeSubpath()
        return p
    }
}
