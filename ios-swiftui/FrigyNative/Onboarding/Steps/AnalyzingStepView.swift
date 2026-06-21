import SwiftUI

struct AnalyzingStepView: View {
    let onNext: () -> Void

    @State private var progress = 0.0
    @State private var currentLabel = "Daten werden analysiert..."
    @State private var done = false

    private let steps = [
        (0.0,  "Daten werden analysiert..."),
        (0.25, "Kalorienbedarf berechnen..."),
        (0.55, "Makronährstoffe festlegen..."),
        (0.8,  "Plan wird personalisiert..."),
        (1.0,  "Fertig! ✓"),
    ]

    var body: some View {
        ZStack {
            FrigyBrand.bg.ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                // Animated ring
                ZStack {
                    Circle()
                        .stroke(FrigyBrand.borderMint.opacity(0.3), lineWidth: 8)
                        .frame(width: 120, height: 120)

                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            AngularGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark], center: .center),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.5), value: progress)

                    if done {
                        Image(systemName: "checkmark")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(FrigyBrand.primaryDark)
                            .transition(.scale.combined(with: .opacity))
                    } else {
                        Text("\(Int(progress * 100))%")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(FrigyBrand.text)
                    }
                }

                VStack(spacing: 8) {
                    Text("Dein Plan wird erstellt")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(FrigyBrand.text)

                    Text(currentLabel)
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .animation(.easeInOut(duration: 0.3), value: currentLabel)
                }

                Spacer()
            }
        }
        .onAppear {
            animateProgress()
        }
    }

    private func animateProgress() {
        var delay = 0.0
        for (i, step) in steps.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                withAnimation {
                    progress = step.0
                    currentLabel = step.1
                    if i == steps.count - 1 {
                        done = true
                    }
                }
            }
            delay += 0.8
        }
        // Auto-advance after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + delay + 0.5) {
            onNext()
        }
    }
}
