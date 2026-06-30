import SwiftUI

/// SCREEN 2 — "State Control" experience.
/// A continuous soft controller lets the user pick between 4 named states.
/// After ~2 s of holding one zone the UI recognises commitment → "Confirm"
/// button appears. Tap to proceed. No game feeling — clear completion logic.
struct EnergySwipeStepView: View {
    let onBack: (() -> Void)?
    let onNext: () -> Void

    struct Zone {
        let name: String
        let description: String
        let tint: Color
        let secondary: Color
        let symbol: String
    }

    @Environment(LanguageManager.self) private var lang

    private var zones: [Zone] {
        [
            Zone(name: lang.t("Fokus"),      description: lang.t("Klarheit & Konzentration"),
                 tint: Color(hex: "#36D1FF"), secondary: Color(hex: "#0A6Cff"),
                 symbol: "scope"),
            Zone(name: lang.t("Balance"),    description: lang.t("Ruhe & Stabilität"),
                 tint: Color(hex: "#75FBB2"), secondary: Color(hex: "#2EB56D"),
                 symbol: "circle.hexagongrid.fill"),
            Zone(name: lang.t("Gelassen"),   description: lang.t("Leichtigkeit & Flow"),
                 tint: Color(hex: "#B69BFF"), secondary: Color(hex: "#6D3Cff"),
                 symbol: "cloud.fill"),
            Zone(name: lang.t("Struktur"),   description: lang.t("Ordnung & Energie"),
                 tint: Color(hex: "#FF8A5B"), secondary: Color(hex: "#FF3D6E"),
                 symbol: "bolt.fill"),
        ]
    }

    // 0...3 (can be fractional between zones)
    @State private var position: Double = 1.5
    @State private var isDragging = false

    // Commitment detection
    @State private var holdStart: Date? = nil
    @State private var commitSeconds: Double = 0
    @State private var committed: Bool = false
    @State private var confirming: Bool = false   // brief lock animation
    @State private var ctaScale: Double = 0.88

    private let commitThreshold: Double = 2.0
    private let tick = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common).autoconnect()

    private var activeZoneIndex: Int { Int(position.rounded()) }
    private var activeZone: Zone { zones[max(0, min(zones.count - 1, activeZoneIndex))] }

    private var blendedTint: Color {
        let lo = Int(floor(position)).clamped(to: 0...(zones.count - 1))
        let hi = Int(ceil(position)).clamped(to: 0...(zones.count - 1))
        return zones[lo].tint.blended(with: zones[hi].tint, amount: position - floor(position))
    }
    private var blendedSecondary: Color {
        let lo = Int(floor(position)).clamped(to: 0...(zones.count - 1))
        let hi = Int(ceil(position)).clamped(to: 0...(zones.count - 1))
        return zones[lo].secondary.blended(with: zones[hi].secondary, amount: position - floor(position))
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                AmbientBackground(tint: blendedTint, secondaryTint: blendedSecondary,
                                  intensity: 1, motion: 0.8)

                ParticleField(count: 24, color: blendedTint, speed: 0.8, intensity: 0.7)

                VStack(spacing: 0) {
                    navBar

                    Spacer()

                    zoneDisplay(geo: geo)

                    Spacer()

                    controller(width: geo.size.width)
                        .padding(.bottom, 24)

                    ctaArea
                        .padding(.bottom, 36)
                }
            }
        }
        .onReceive(tick) { _ in tick60() }
    }

    // MARK: - Nav

    private var navBar: some View {
        HStack {
            if let onBack {
                ExperienceBackButton(action: onBack)
            } else {
                Color.clear.frame(width: 42, height: 42)
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    // MARK: - Zone display

    @ViewBuilder
    private func zoneDisplay(geo: GeometryProxy) -> some View {
        VStack(spacing: 20) {
            // Animated icon
            ZStack {
                Circle()
                    .fill(blendedTint.opacity(0.12))
                    .frame(width: 130, height: 130)
                    .overlay(Circle().stroke(blendedTint.opacity(0.25), lineWidth: 1.5))
                    .shadow(color: blendedTint.opacity(committed ? 0.55 : 0.3),
                            radius: committed ? 40 : 24)
                    .scaleEffect(committed ? 1.06 : 1)
                    .animation(.spring(response: 0.5, dampingFraction: 0.65), value: committed)

                Image(systemName: activeZone.symbol)
                    .font(.system(size: 48, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(colors: [.white, blendedTint],
                                       startPoint: .top, endPoint: .bottom)
                    )
                    .contentTransition(.symbolEffect(.replace))
            }

            VStack(spacing: 8) {
                Text(activeZone.name)
                    .font(.system(size: 38, weight: .heavy))
                    .foregroundStyle(ExperiencePalette.textPrimary)
                    .contentTransition(.numericText())
                    .animation(.spring(response: 0.35, dampingFraction: 0.75), value: activeZoneIndex)

                Text(activeZone.description)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(ExperiencePalette.textMuted)
                    .animation(.easeOut(duration: 0.3), value: activeZoneIndex)
            }

            // Commitment progress ring
            commitRing
        }
        .padding(.horizontal, 32)
    }

    private var commitRing: some View {
        let fraction = min(1, commitSeconds / commitThreshold)
        return ZStack {
            Circle()
                .stroke(blendedTint.opacity(0.12), lineWidth: 3)
                .frame(width: 56, height: 56)
            Circle()
                .trim(from: 0, to: fraction)
                .stroke(blendedTint, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .frame(width: 56, height: 56)
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1.0 / 60.0), value: fraction)

            if committed {
                Image(systemName: "checkmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(blendedTint)
                    .transition(.scale.combined(with: .opacity))
            } else {
                Text(fraction > 0.02 ? "\(Int(fraction * 100))%" : "")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(blendedTint.opacity(0.8))
            }
        }
        .opacity(committed || commitSeconds > 0.05 ? 1 : 0)
        .animation(.easeOut(duration: 0.3), value: committed)
    }

    // MARK: - Controller track

    @ViewBuilder
    private func controller(width: CGFloat) -> some View {
        let trackW = width - 56
        let thumbX = CGFloat(position / Double(zones.count - 1)) * trackW

        VStack(spacing: 12) {
            // Zone labels
            HStack {
                ForEach(zones.indices, id: \.self) { i in
                    Text(zones[i].name)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(i == activeZoneIndex
                                         ? blendedTint
                                         : ExperiencePalette.textMuted.opacity(0.5))
                        .frame(maxWidth: .infinity)
                        .animation(.easeOut(duration: 0.2), value: activeZoneIndex)
                }
            }
            .padding(.horizontal, 28)

            // Track + thumb
            ZStack(alignment: .leading) {
                // Track
                Capsule()
                    .fill(Color.white.opacity(0.08))
                    .frame(height: 6)

                // Fill
                Capsule()
                    .fill(
                        LinearGradient(colors: [blendedSecondary, blendedTint],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(width: thumbX + 20, height: 6)

                // Thumb
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 36, height: 36)
                    .overlay(Circle().stroke(blendedTint, lineWidth: 1.5))
                    .shadow(color: blendedTint.opacity(0.5), radius: 14)
                    .scaleEffect(isDragging ? 1.18 : 1)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isDragging)
                    .offset(x: thumbX - 2)
            }
            .padding(.horizontal, 28)
            .frame(width: width)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        isDragging = true
                        let raw = Double((value.location.x - 28) / trackW) * Double(zones.count - 1)
                        let newPos = max(0, min(Double(zones.count - 1), raw))
                        let prevZone = activeZoneIndex
                        position = newPos
                        if Int(newPos.rounded()) != prevZone {
                            ExperienceHaptics.selection()
                            holdStart = Date()
                            commitSeconds = 0
                        }
                        if holdStart == nil { holdStart = Date() }
                    }
                    .onEnded { _ in
                        isDragging = false
                        // Snap to nearest zone
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                            position = Double(activeZoneIndex)
                        }
                        if holdStart == nil { holdStart = Date() }
                    }
            )
        }
    }

    // MARK: - CTA

    @ViewBuilder
    private var ctaArea: some View {
        if committed {
            ExperienceCTAButton(title: lang.t("Auswahl bestätigen"), action: onNext)
                .padding(.horizontal, 28)
                .scaleEffect(ctaScale)
                .animation(.spring(response: 0.5, dampingFraction: 0.7), value: ctaScale)
                .onAppear {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) { ctaScale = 1.0 }
                }
        } else {
            Text(commitSeconds > 0.1 ? lang.t("Halte für Auswahl…") : lang.t("Wähle deinen Zustand"))
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(ExperiencePalette.textMuted)
                .frame(height: 58)
                .animation(.easeOut(duration: 0.3), value: commitSeconds > 0.1)
        }
    }

    // MARK: - Tick

    private func tick60() {
        guard !committed else { return }
        guard let start = holdStart else { return }
        let held = Date().timeIntervalSince(start)
        commitSeconds = min(commitThreshold, held)

        if commitSeconds >= commitThreshold {
            committed = true
            holdStart = nil
            ExperienceHaptics.impact(.medium, intensity: 1.0)
        }
    }
}

// MARK: - Helpers

private extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
