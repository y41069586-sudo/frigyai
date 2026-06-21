import SwiftUI

struct CelebrationStepView: View {
    let onNext: () -> Void

    @State private var scale = 0.7
    @State private var opacity = 0.0

    var body: some View {
        ZStack {
            FrigyBrand.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 24) {
                    ZStack {
                        ForEach(0..<6, id: \.self) { i in
                            Circle()
                                .fill(FrigyBrand.primary.opacity(0.08 + Double(i) * 0.04))
                                .frame(width: CGFloat(140 + i * 20), height: CGFloat(140 + i * 20))
                        }
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 72))
                            .foregroundStyle(
                                LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                    }
                    .scaleEffect(scale)

                    VStack(spacing: 10) {
                        Text("Dein Plan ist fertig! 🎉")
                            .font(.system(size: 26, weight: .black))
                            .foregroundColor(FrigyBrand.text)

                        Text("Alles ist eingerichtet. Starte jetzt\ndeine Reise zu einem gesünderen Ich.")
                            .font(.system(size: 16))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                    }
                }
                .opacity(opacity)

                Spacer()

                OnboardingContinueButton("Frigy starten", action: onNext)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 48)
                    .opacity(opacity)
            }
        }
        .onAppear {
            withAnimation(.spring(duration: 0.6, bounce: 0.4)) {
                scale = 1
                opacity = 1
            }
        }
    }
}
