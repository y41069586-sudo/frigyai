import SwiftUI

/// SCREEN 2 — Interactive "energy" swipe experience.
/// The user swipes horizontally through immersive "energy modes". Colors, light,
/// glow and motion interpolate continuously with the swipe gesture — each mode
/// feels like its own world. Selection haptics fire on mode changes.
struct EnergySwipeStepView: View {
    let onBack: (() -> Void)?
    let onNext: () -> Void

    struct Mode {
        let name: String
        let tagline: String
        let symbol: String
        let tint: Color
        let secondary: Color
    }

    private let modes: [Mode] = [
        Mode(name: "Focus",    tagline: "Klarheit für jede Entscheidung.",  symbol: "scope",
             tint: Color(hex: "#36D1FF"), secondary: Color(hex: "#0A6Cff")),
        Mode(name: "Momentum", tagline: "Bewegung, die dich vorantreibt.",  symbol: "bolt.fill",
             tint: Color(hex: "#75FBB2"), secondary: Color(hex: "#2EB56D")),
        Mode(name: "Balance",  tagline: "Energie im Gleichgewicht.",        symbol: "circle.hexagongrid.fill",
             tint: Color(hex: "#B69BFF"), secondary: Color(hex: "#6D3Cff")),
        Mode(name: "Power",    tagline: "Volle Kraft, wenn du sie brauchst.", symbol: "flame.fill",
             tint: Color(hex: "#FF8A5B"), secondary: Color(hex: "#FF3D6E")),
    ]

    @State private var index: Int = 0
    @State private var drag: CGFloat = 0

    @State private var swipeWidth: CGFloat = 1

    /// Continuous fractional page position (e.g. 1.4 = between Momentum & Balance).
    private var fractional: Double {
        Double(index) - Double(drag) / Double(max(1, swipeWidth))
    }

    private var blendedTint: Color {
        let lower = Int(floor(fractional)).clamped(to: 0...(modes.count - 1))
        let upper = Int(ceil(fractional)).clamped(to: 0...(modes.count - 1))
        let f = fractional - floor(fractional)
        return modes[lower].tint.blended(with: modes[upper].tint, amount: f)
    }

    private var blendedSecondary: Color {
        let lower = Int(floor(fractional)).clamped(to: 0...(modes.count - 1))
        let upper = Int(ceil(fractional)).clamped(to: 0...(modes.count - 1))
        let f = fractional - floor(fractional)
        return modes[lower].secondary.blended(with: modes[upper].secondary, amount: f)
    }

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width

            ZStack {
                AmbientBackground(tint: blendedTint, secondaryTint: blendedSecondary,
                                  intensity: 1, motion: 1)

                ParticleField(count: 28, color: blendedTint, speed: 1,
                              bias: CGSize(width: -drag * 0.05, height: 0))

                VStack(spacing: 0) {
                    HStack {
                        if let onBack {
                            ExperienceBackButton(action: onBack)
                        } else {
                            Color.clear.frame(width: 42, height: 42)
                        }
                        Spacer()
                        Text("\(index + 1) / \(modes.count)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(ExperiencePalette.textMuted)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)

                    Spacer()

                    // Mode cards — laid out in a row and offset by the swipe.
                    ZStack {
                        ForEach(Array(modes.enumerated()), id: \.offset) { i, mode in
                            modeCard(mode, pageOffset: Double(i) - fractional)
                                .frame(width: width)
                                .offset(x: CGFloat(i) * width - CGFloat(index) * width + drag)
                        }
                    }
                    .frame(width: width, height: 360)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                var t = value.translation.width
                                // Rubber-band at the ends (elastic overscroll).
                                if (index == 0 && t > 0) || (index == modes.count - 1 && t < 0) {
                                    t *= 0.35
                                }
                                drag = t
                            }
                            .onEnded { value in
                                let threshold = width * 0.22
                                var newIndex = index
                                if value.predictedEndTranslation.width < -threshold, index < modes.count - 1 {
                                    newIndex += 1
                                } else if value.predictedEndTranslation.width > threshold, index > 0 {
                                    newIndex -= 1
                                }
                                if newIndex != index {
                                    ExperienceHaptics.selection()
                                }
                                withAnimation(.spring(response: 0.5, dampingFraction: 0.82)) {
                                    index = newIndex
                                    drag = 0
                                }
                            }
                    )

                    Spacer()

                    pageDots
                        .padding(.bottom, 24)

                    ExperienceCTAButton(title: "Weiter", pulses: false, action: onNext)
                        .padding(.horizontal, 28)
                        .padding(.bottom, 28)
                }
            }
            .onAppear { swipeWidth = width }
            .onChange(of: width) { _, newValue in swipeWidth = newValue }
        }
    }

    // MARK: - Pieces

    @ViewBuilder
    private func modeCard(_ mode: Mode, pageOffset: Double) -> some View {
        // Parallax + fade for neighbouring cards.
        let distance = abs(pageOffset)
        let scale = 1 - min(0.18, distance * 0.18)
        let opacity = 1 - min(0.85, distance * 0.9)

        VStack(spacing: 26) {
            ZStack {
                // Animated energy rings (layered, slow rotation).
                TimelineView(.animation) { timeline in
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    ZStack {
                        ForEach(0..<3) { ring in
                            Circle()
                                .trim(from: 0.05, to: 0.85)
                                .stroke(
                                    mode.tint.opacity(0.5 - Double(ring) * 0.12),
                                    style: StrokeStyle(lineWidth: 2.5 - CGFloat(ring) * 0.6, lineCap: .round)
                                )
                                .frame(width: 150 + CGFloat(ring) * 40, height: 150 + CGFloat(ring) * 40)
                                .rotationEffect(.degrees(t * (18 + Double(ring) * 10) * (ring % 2 == 0 ? 1 : -1)))
                        }
                    }
                }

                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 124, height: 124)
                    .overlay(Circle().stroke(mode.tint.opacity(0.6), lineWidth: 1.2))
                    .shadow(color: mode.tint.opacity(0.5), radius: 30)

                Image(systemName: mode.symbol)
                    .font(.system(size: 46, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(colors: [.white, mode.tint],
                                       startPoint: .top, endPoint: .bottom)
                    )
                    // subtle parallax: icon moves a touch more than the card
                    .offset(x: CGFloat(pageOffset) * -22)
            }
            .frame(height: 230)

            VStack(spacing: 10) {
                Text(mode.name)
                    .font(.system(size: 36, weight: .heavy))
                    .foregroundStyle(ExperiencePalette.textPrimary)
                    .offset(x: CGFloat(pageOffset) * -36) // deeper parallax layer

                Text(mode.tagline)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(ExperiencePalette.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 36)
                    .offset(x: CGFloat(pageOffset) * -50)
            }
            .blur(radius: distance * 6)
        }
        .scaleEffect(scale)
        .opacity(opacity)
    }

    private var pageDots: some View {
        HStack(spacing: 8) {
            ForEach(0..<modes.count, id: \.self) { i in
                let active = i == index
                Capsule()
                    .fill(active ? ExperiencePalette.accent : Color.white.opacity(0.25))
                    .frame(width: active ? 22 : 7, height: 7)
                    .animation(.spring(response: 0.4, dampingFraction: 0.7), value: index)
            }
        }
    }
}

// MARK: - Helpers

private extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
