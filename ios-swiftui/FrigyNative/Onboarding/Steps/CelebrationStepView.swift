import SwiftUI

struct CelebrationStepView: View {
    let onNext: () -> Void

    @State private var appeared = false
    @State private var particlePhase: Double = 0

    private let particles: [Particle] = (0..<18).map { i in
        Particle(
            xOffset: CGFloat.random(in: -160...160),
            yOffset: CGFloat.random(in: -320...(-60)),
            size: CGFloat.random(in: 6...14),
            color: [
                Color(hex: "#3DCA7B"), Color(hex: "#A8F0C4"),
                Color(hex: "#FFD93D"), Color(hex: "#FF9E44"),
                Color(hex: "#7EB3FF"), Color(hex: "#E879F9"),
            ][i % 6],
            delay: Double(i) * 0.06,
            rotation: Double.random(in: 0...360),
            isSquare: i % 3 == 0
        )
    }

    var body: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            // Confetti particles
            ForEach(particles.indices, id: \.self) { idx in
                let p = particles[idx]
                Group {
                    if p.isSquare {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(p.color)
                            .frame(width: p.size, height: p.size)
                            .rotationEffect(.degrees(appeared ? p.rotation + 180 : p.rotation))
                    } else {
                        Circle()
                            .fill(p.color)
                            .frame(width: p.size, height: p.size)
                    }
                }
                .offset(
                    x: appeared ? p.xOffset : 0,
                    y: appeared ? p.yOffset : 0
                )
                .opacity(appeared ? Double.random(in: 0.55...0.9) : 0)
                .animation(
                    .spring(response: 0.7, dampingFraction: 0.55).delay(p.delay),
                    value: appeared
                )
            }

            VStack(spacing: 0) {
                Spacer()

                // Icon + glow
                ZStack {
                    // Outer glow rings
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.06 + Double(i) * 0.03))
                            .frame(
                                width: CGFloat(180 - i * 28),
                                height: CGFloat(180 - i * 28)
                            )
                    }

                    // White circle backdrop
                    Circle()
                        .fill(.white)
                        .frame(width: 108, height: 108)
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.18), radius: 28, y: 10)

                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 62))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
                .scaleEffect(appeared ? 1 : 0.4)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.55, dampingFraction: 0.6).delay(0.05), value: appeared)

                Spacer().frame(height: 36)

                // Text block
                VStack(spacing: 12) {
                    Text("Dein Plan ist fertig!")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)

                    Text("Alles ist eingerichtet. Starte jetzt\ndeine Reise zu einem gesünderen Ich.")
                        .font(.system(size: 16))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                }
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 16)
                .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(0.18), value: appeared)

                Spacer().frame(height: 32)

                // Stats row
                HStack(spacing: 0) {
                    statChip(icon: "person.2.fill", label: "50.000+", sublabel: "Nutzer")
                    Divider().frame(height: 36)
                    statChip(icon: "star.fill", label: "4.9", sublabel: "Bewertung")
                    Divider().frame(height: 36)
                    statChip(icon: "chart.line.uptrend.xyaxis", label: "–8 kg", sublabel: "Ø Ergebnis")
                }
                .padding(.vertical, 4)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.white.opacity(0.85))
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.07), radius: 12, y: 4)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                )
                .padding(.horizontal, 28)
                .opacity(appeared ? 1 : 0)
                .scaleEffect(appeared ? 1 : 0.88)
                .animation(.spring(response: 0.5, dampingFraction: 0.72).delay(0.28), value: appeared)

                Spacer()

                OnboardingContinueButton("Frigy starten", action: onNext)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 48)
                    .opacity(appeared ? 1 : 0)
                    .animation(.easeOut(duration: 0.4).delay(0.42), value: appeared)
            }
        }
        .onAppear {
            withAnimation { appeared = true }
        }
    }

    private func statChip(icon: String, label: String, sublabel: String) -> some View {
        VStack(spacing: 4) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
                Text(label)
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
            }
            Text(sublabel)
                .font(.system(size: 11))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }
}

// MARK: - Particle model

private struct Particle {
    let xOffset: CGFloat
    let yOffset: CGFloat
    let size: CGFloat
    let color: Color
    let delay: Double
    let rotation: Double
    let isSquare: Bool
}
