import SwiftUI

struct SplashStepView: View {
    let onNext: () -> Void
    @State private var opacity = 0.0
    @State private var scale = 0.88

    var body: some View {
        ZStack {
            FrigyBrand.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo / wordmark
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.18))
                            .frame(width: 100, height: 100)
                        Circle()
                            .fill(FrigyBrand.primary.opacity(0.35))
                            .frame(width: 76, height: 76)
                        Image(systemName: "leaf.fill")
                            .font(.system(size: 34, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDeep)
                    }

                    Text("Frigy")
                        .font(.system(size: 42, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.text)

                    Text("Dein KI-Ernährungsassistent")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(FrigyBrand.textMuted)
                }
                .scaleEffect(scale)

                Spacer()

                OnboardingContinueButton("Jetzt starten", action: onNext)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
            }
        }
        .opacity(opacity)
        .onAppear {
            withAnimation(.easeOut(duration: 0.55)) {
                opacity = 1
                scale = 1
            }
        }
    }
}
