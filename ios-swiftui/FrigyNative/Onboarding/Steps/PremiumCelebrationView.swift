import SwiftUI

/// Full-screen celebration shown right after a successful purchase / restore so
/// the user gets clear confirmation that Premium is now active before continuing.
struct PremiumCelebrationView: View {
    var isYearly: Bool
    let onContinue: () -> Void

    @State private var appear = false
    @State private var burst = false
    @State private var ringAngle = 0.0
    @State private var pulse = false

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        // This view is shown both full-screen (onboarding) and inside a plain
        // .sheet() (Settings → upgrade flow in SubscriptionView), where the
        // available height can be noticeably smaller. The content below has
        // several fixed-size decorative elements (150pt ring, feature list,
        // 54pt button) — without a scroll fallback, a shorter container just
        // silently overflows past the visible bounds instead of clipping or
        // shrinking, which reads as the celebration screen (often the CTA
        // button) rendering "outside" the screen. GeometryReader + ScrollView
        // keeps the exact same centered look when everything fits, but lets
        // it scroll instead of overflowing when it doesn't.
        GeometryReader { geo in
            ScrollView(showsIndicators: false) {
                content
                    // A vertical ScrollView does NOT constrain its content's width to
                    // the available space — it lets content size itself to its own
                    // "ideal" width in the cross axis, so `.frame(maxWidth: .infinity)`
                    // on the text/button below has nothing to expand into and they
                    // don't wrap or size correctly. Pinning an explicit width here
                    // (not just minHeight) is what actually constrains the layout to
                    // the screen, fixing the button/text bleeding past the edge.
                    // (Two separate `.frame` calls — `width:` and `minHeight:` aren't
                    // parameters of the same overload.)
                    .frame(width: geo.size.width)
                    .frame(minHeight: geo.size.height)
            }
        }
    }

    private var content: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            // Soft radial glow behind the badge
            Circle()
                .fill(RadialGradient(
                    colors: [FrigyBrand.primary.opacity(0.5), .clear],
                    center: .center, startRadius: 10, endRadius: 260
                ))
                .frame(width: 520, height: 520)
                .scaleEffect(burst ? 1 : 0.4)
                .opacity(burst ? 1 : 0)

            // Confetti
            ForEach(0..<26, id: \.self) { i in
                confettiPiece(index: i)
            }

            VStack(spacing: 24) {
                Spacer(minLength: 12)

                ZStack {
                    // Rotating glow ring
                    Circle()
                        .stroke(
                            AngularGradient(
                                colors: [FrigyBrand.primary, FrigyBrand.primaryDeep, FrigyBrand.primary.opacity(0.2), FrigyBrand.primary],
                                center: .center),
                            lineWidth: 6
                        )
                        .frame(width: 150, height: 150)
                        .rotationEffect(.degrees(ringAngle))
                        .opacity(appear ? 0.9 : 0)

                    Circle()
                        .fill(LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 120, height: 120)
                        .shadow(color: FrigyBrand.primaryDeep.opacity(0.5), radius: 24, y: 8)

                    Image(systemName: "sparkles")
                        .font(.system(size: 54, weight: .bold))
                        .foregroundColor(.white)
                        .scaleEffect(appear ? 1 : 0.3)
                        .rotationEffect(.degrees(appear ? 0 : -25))
                }
                .scaleEffect(appear ? (pulse ? 1.05 : 1.0) : 0.5)

                VStack(spacing: 10) {
                    Text(lang.t("Frigy AI\nfreigeschaltet! 🎉"))
                        .font(.system(size: 30, weight: .black, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, 20)

                    Text(isYearly
                         ? lang.t("Dein Jahresabo ist aktiv. Du hast jetzt vollen Zugriff auf alle Funktionen.")
                         : lang.t("Deine Testphase läuft. Du hast jetzt vollen Zugriff auf alle Funktionen."))
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, 28)
                }
                .frame(maxWidth: .infinity)
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 16)

                VStack(spacing: 12) {
                    featureLine(lang.t("KI-Mahlzeitenpläne ohne Limit"), "sparkles")
                    featureLine(lang.t("Barcode- & Foto-Scan"), "camera.fill")
                    featureLine(lang.t("KI-Coach & erweiterte Statistiken"), "brain.head.profile")
                }
                .padding(.top, 4)
                .opacity(appear ? 1 : 0)

                Spacer(minLength: 12)

                Button(action: onContinue) {
                    Text(lang.t("Los geht's"))
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(
                            RoundedRectangle(cornerRadius: 18)
                                .fill(LinearGradient(
                                    colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ))
                                .shadow(color: FrigyBrand.primaryDeep.opacity(0.35), radius: 14, y: 6)
                        )
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 28)
                .padding(.bottom, 28)
                .opacity(appear ? 1 : 0)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.55, dampingFraction: 0.6)) { appear = true }
            withAnimation(.easeOut(duration: 0.7)) { burst = true }
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) { ringAngle = 360 }
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) { pulse = true }
        }
    }

    private func featureLine(_ text: String, _ icon: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDark)
                .frame(width: 22)
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(FrigyBrand.text)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 40)
    }

    private func confettiPiece(index: Int) -> some View {
        let colors: [Color] = [FrigyBrand.primary, FrigyBrand.primaryDark, Color(hex: "#F59E0B"), Color(hex: "#60A5FA"), Color(hex: "#F87171")]
        let xs: [CGFloat] = [-150, -110, -70, -40, -10, 30, 60, 90, 120, 150, -130, 100, -80, 40]
        let delays: [Double] = [0, 0.05, 0.1, 0.15, 0.08, 0.02, 0.12, 0.06, 0.14, 0.04, 0.09, 0.11, 0.03, 0.07]
        let x = xs[index % xs.count]
        return RoundedRectangle(cornerRadius: 2)
            .fill(colors[index % colors.count])
            .frame(width: 8, height: 14)
            .rotationEffect(.degrees(burst ? Double(index * 47) : 0))
            .offset(x: x, y: burst ? 320 : -120)
            .opacity(burst ? 0 : 1)
            .animation(.easeOut(duration: 1.1).delay(delays[index % delays.count]), value: burst)
    }
}
