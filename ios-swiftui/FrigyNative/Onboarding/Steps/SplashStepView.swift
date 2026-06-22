import SwiftUI

struct SplashStepView: View {
    let onNext: () -> Void
    var onSignIn: (() -> Void)? = nil

    @State private var opacity = 0.0
    @State private var mascotOffset = 18.0
    @State private var textOffset = 18.0

    var body: some View {
        ZStack {
            Color(hex: "#FFFFFF").ignoresSafeArea()

            VStack(spacing: 0) {
                // "Frigy" wordmark
                Text("Frigy")
                    .font(.system(size: 28, weight: .black))
                    .foregroundColor(Color(hex: "#39D47F"))
                    .tracking(-1.5)
                    .padding(.top, 20)

                // Mascot — floating
                MascotFloatingView()
                    .frame(height: UIScreen.main.bounds.height * 0.32)
                    .offset(y: mascotOffset)

                // Headline + subline
                VStack(spacing: 0) {
                    VStack(alignment: .center, spacing: 0) {
                        Text("Iss smarter.")
                            .font(.system(size: 43, weight: .heavy))
                            .foregroundColor(.black)
                            .tracking(-3.5)
                            .lineLimit(1)

                        // Second line with mint highlight
                        ZStack(alignment: .bottomLeading) {
                            // Mint highlight bar behind text
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(hex: "#75FBB2").opacity(0.45))
                                .frame(height: 14)
                                .offset(y: -4)

                            Text("Leb leichter.")
                                .font(.system(size: 43, weight: .heavy))
                                .foregroundColor(.black)
                                .tracking(-3.5)
                                .lineLimit(1)
                        }
                    }
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)

                    Text("Generiere Wochenpläne, scanne deinen Kühlschrank und bekomme automatisch deine Einkaufsliste.")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(hex: "#737373"))
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)
                        .tracking(-0.4)
                        .padding(.horizontal, 32)
                        .padding(.top, 20)
                }
                .offset(y: textOffset)

                Spacer()

                // CTA
                VStack(spacing: 16) {
                    Button(action: onNext) {
                        HStack(spacing: 8) {
                            Text("Loslegen")
                                .font(.system(size: 17, weight: .black))
                                .tracking(-0.6)
                            Image(systemName: "arrow.right")
                                .font(.system(size: 15, weight: .bold))
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .background(Color(hex: "#75FBB2"))
                        .clipShape(RoundedRectangle(cornerRadius: 28))
                        .shadow(color: Color(hex: "#39D47F").opacity(0.25), radius: 16, y: 8)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 24)

                    if let signIn = onSignIn {
                        Button(action: signIn) {
                            Text("Bereits ein Konto? Anmelden")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(Color(hex: "#A3A3A3"))
                                .tracking(-0.3)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.bottom, max(32, 16))
            }
        }
        .opacity(opacity)
        .onAppear {
            withAnimation(.easeOut(duration: 0.45)) {
                opacity = 1
                mascotOffset = 0
                textOffset = 0
            }
        }
    }
}

// Separate view so the infinite animation doesn't block the appear animation
private struct MascotFloatingView: View {
    @State private var floatOffset = 0.0

    var body: some View {
        Image("FrigyMascot")
            .resizable()
            .scaledToFit()
            .padding(24)
            .shadow(color: Color(hex: "#2E7D32").opacity(0.16), radius: 45, y: 30)
            .offset(y: floatOffset)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 5)
                    .repeatForever(autoreverses: true)
                ) {
                    floatOffset = -8
                }
            }
    }
}
