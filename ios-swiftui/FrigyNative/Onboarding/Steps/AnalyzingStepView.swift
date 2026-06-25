import SwiftUI

struct AnalyzingStepView: View {
    let onNext: () -> Void

    @State private var progress: Double = 0
    @State private var currentStep = 0
    @State private var completedSteps: Set<Int> = []
    @State private var done = false
    @State private var pulse = false
    @State private var appeared = false

    private let steps: [(icon: String, label: String, delay: Double)] = [
        ("figure.stand",     "Körperdaten analysieren",    0.4),
        ("flame.fill",       "Kalorienbedarf berechnen",   1.2),
        ("chart.bar.fill",   "Makronährstoffe festlegen",  2.0),
        ("brain",            "KI-Plan personalisieren",    2.8),
        ("checkmark.circle", "Plan ist bereit",            3.6),
    ]

    var body: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Ring + % + emoji
                ZStack {
                    // Outer pulse ring
                    Circle()
                        .stroke(FrigyBrand.primary.opacity(0.12), lineWidth: 1)
                        .frame(width: 188, height: 188)
                        .scaleEffect(pulse ? 1.12 : 1)
                        .opacity(pulse ? 0 : 0.6)
                        .animation(.easeOut(duration: 1.6).repeatForever(autoreverses: false), value: pulse)

                    // Track ring
                    Circle()
                        .stroke(FrigyBrand.borderMint.opacity(0.25), lineWidth: 10)
                        .frame(width: 148, height: 148)

                    // Progress ring
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            AngularGradient(
                                colors: [FrigyBrand.primary, FrigyBrand.primaryDeep, FrigyBrand.primary],
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 10, lineCap: .round)
                        )
                        .frame(width: 148, height: 148)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.6), value: progress)
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.4), radius: 8, y: 0)

                    // Center content
                    VStack(spacing: 4) {
                        if done {
                            Text("✅")
                                .font(.system(size: 44))
                                .transition(.scale.combined(with: .opacity))
                        } else {
                            Text("🥗")
                                .font(.system(size: 36))
                                .scaleEffect(pulse ? 1.08 : 1)
                                .animation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true), value: pulse)

                            Text("\(Int(progress * 100))%")
                                .font(.system(size: 18, weight: .black, design: .rounded))
                                .foregroundColor(FrigyBrand.text)
                                .contentTransition(.numericText())
                                .animation(.snappy(duration: 0.2), value: progress)
                        }
                    }
                }
                .opacity(appeared ? 1 : 0)
                .scaleEffect(appeared ? 1 : 0.7)
                .animation(.spring(response: 0.55, dampingFraction: 0.7), value: appeared)

                Spacer().frame(height: 40)

                // Title
                VStack(spacing: 6) {
                    Text(done ? "Plan ist bereit! 🎉" : "Dein Plan wird erstellt")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .contentTransition(.opacity)
                        .animation(.easeInOut(duration: 0.3), value: done)

                    Text("KI berechnet deine optimalen Werte")
                        .font(.system(size: 14))
                        .foregroundColor(FrigyBrand.textMuted)
                }
                .opacity(appeared ? 1 : 0)
                .animation(.easeOut(duration: 0.4).delay(0.2), value: appeared)

                Spacer().frame(height: 36)

                // Step checklist
                VStack(spacing: 0) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { idx, step in
                        let isComplete = completedSteps.contains(idx)
                        let isCurrent = currentStep == idx && !done

                        HStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(isComplete
                                          ? FrigyBrand.primaryDark
                                          : (isCurrent ? FrigyBrand.primary.opacity(0.15) : Color(hex: "#F3F4F6")))
                                    .frame(width: 32, height: 32)

                                if isComplete {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.white)
                                        .transition(.scale.combined(with: .opacity))
                                } else {
                                    Image(systemName: step.icon)
                                        .font(.system(size: 13, weight: isCurrent ? .bold : .medium))
                                        .foregroundColor(isCurrent ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                                }
                            }
                            .animation(.spring(response: 0.35, dampingFraction: 0.65), value: isComplete)

                            Text(step.label)
                                .font(.system(size: 14, weight: isCurrent ? .semibold : .regular))
                                .foregroundColor(
                                    isComplete ? FrigyBrand.primaryDark
                                    : (isCurrent ? FrigyBrand.text : FrigyBrand.textMuted)
                                )
                                .animation(.easeInOut(duration: 0.2), value: isCurrent)

                            Spacer()

                            if isCurrent {
                                ProgressView()
                                    .progressViewStyle(.circular)
                                    .scaleEffect(0.7)
                                    .tint(FrigyBrand.primaryDark)
                                    .transition(.opacity)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .opacity(appeared ? 1 : 0)
                        .animation(.easeOut(duration: 0.35).delay(0.3 + Double(idx) * 0.08), value: appeared)

                        if idx < steps.count - 1 {
                            Divider().padding(.leading, 66)
                        }
                    }
                }
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.white)
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.07), radius: 14, y: 5)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(FrigyBrand.cardBorder, lineWidth: 1)
                )
                .padding(.horizontal, 24)
                .scaleEffect(appeared ? 1 : 0.92)
                .opacity(appeared ? 1 : 0)
                .animation(.spring(response: 0.5, dampingFraction: 0.72).delay(0.15), value: appeared)

                Spacer()
            }
        }
        .onAppear {
            appeared = true
            pulse = true
            animateSteps()
        }
    }

    private func animateSteps() {
        for (i, step) in steps.enumerated() {
            // Make step "current"
            DispatchQueue.main.asyncAfter(deadline: .now() + step.delay) {
                withAnimation { currentStep = i }
            }
            // Complete it slightly after
            let completeDelay = step.delay + 0.65
            DispatchQueue.main.asyncAfter(deadline: .now() + completeDelay) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.65)) {
                    completedSteps.insert(i)
                    progress = Double(i + 1) / Double(steps.count)
                }
            }
        }

        let totalDelay = (steps.last?.delay ?? 3.6) + 0.8
        DispatchQueue.main.asyncAfter(deadline: .now() + totalDelay) {
            withAnimation { done = true }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + totalDelay + 0.8) {
            onNext()
        }
    }
}
