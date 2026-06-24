import SwiftUI

/// A small, smoothly animated Frigy mascot (the friendly fridge from the app icon)
/// that "asks" the current onboarding question from a speech bubble while drawing
/// an underline on a notepad with its pen.
///
/// Designed to be dropped in place of a plain question `Text(...)` header. It is
/// intentionally compact ("klein, nicht groß") and self-contained — no external
/// state required.
///
/// Usage:
/// ```swift
/// FrigyMascotQuestion("Wie groß bist du?")
///     .padding(.horizontal, 20)
///     .padding(.top, 4)
///     .padding(.bottom, 12)
/// ```
struct FrigyMascotQuestion: View {
    let question: String
    let mascotSize: CGFloat

    @State private var appeared = false
    @State private var bob = false
    @State private var penWiggle = false
    @State private var writeProgress: CGFloat = 0

    init(_ question: String, mascotSize: CGFloat = 66) {
        self.question = question
        self.mascotSize = mascotSize
    }

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            mascot
            bubble
        }
        .onAppear { runIntro() }
        .onChange(of: question) { _, _ in
            writeProgress = 0
            runWrite()
        }
    }

    // MARK: - Mascot

    private var mascot: some View {
        Image("FrigyMascot")
            .resizable()
            .scaledToFit()
            .frame(width: mascotSize, height: mascotSize)
            .offset(y: bob ? -3 : 3)
            .scaleEffect(appeared ? 1 : 0.6)
            .opacity(appeared ? 1 : 0)
            .animation(.spring(response: 0.55, dampingFraction: 0.6), value: appeared)
            .shadow(color: FrigyBrand.primaryDark.opacity(0.16), radius: 8, y: 4)
            .accessibilityHidden(true)
    }

    // MARK: - Speech bubble + notepad

    private var bubble: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(question)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
                .tracking(-0.3)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            // Notepad line the pen "writes" as Frigy speaks.
            GeometryReader { geo in
                let w = geo.size.width
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(FrigyBrand.borderMint.opacity(0.25))
                        .frame(height: 3)
                    Capsule()
                        .fill(FrigyBrand.buttonGradient)
                        .frame(width: max(w * writeProgress, 0), height: 3)
                    Image(systemName: "pencil")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                        .rotationEffect(.degrees(penWiggle ? -7 : 7))
                        .offset(x: max(w * writeProgress - 5, -2), y: -7)
                        .opacity(writeProgress > 0.02 && writeProgress < 0.99 ? 1 : 0)
                }
                .frame(height: 3)
            }
            .frame(height: 6)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            SpeechBubbleShape()
                .fill(Color.white)
                .shadow(color: Color(hex: "#39D47F").opacity(0.12), radius: 12, y: 6)
        )
        .overlay(
            SpeechBubbleShape()
                .stroke(FrigyBrand.borderMint.opacity(0.7), lineWidth: 1)
        )
        .scaleEffect(appeared ? 1 : 0.85, anchor: .topLeading)
        .opacity(appeared ? 1 : 0)
        .animation(.spring(response: 0.5, dampingFraction: 0.72).delay(0.08), value: appeared)
    }

    // MARK: - Animation driving

    private func runIntro() {
        appeared = true
        withAnimation(.easeInOut(duration: 1.7).repeatForever(autoreverses: true)) { bob = true }
        withAnimation(.easeInOut(duration: 0.28).repeatForever(autoreverses: true)) { penWiggle = true }
        runWrite()
    }

    private func runWrite() {
        // Let the bubble settle in first, then "write" the underline smoothly.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.28) {
            withAnimation(.easeInOut(duration: 0.9)) { writeProgress = 1 }
        }
    }
}

/// Rounded speech bubble with a small tail on the leading edge pointing at the mascot.
private struct SpeechBubbleShape: Shape {
    func path(in rect: CGRect) -> Path {
        let radius: CGFloat = 18
        let tailW: CGFloat = 9
        let tailH: CGFloat = 14
        let body = CGRect(x: rect.minX + tailW, y: rect.minY,
                          width: rect.width - tailW, height: rect.height)
        var p = Path(roundedRect: body, cornerRadius: radius)

        let cy = rect.minY + min(rect.height * 0.4, 28)
        var tail = Path()
        tail.move(to: CGPoint(x: body.minX, y: cy - tailH / 2))
        tail.addLine(to: CGPoint(x: rect.minX, y: cy))
        tail.addLine(to: CGPoint(x: body.minX, y: cy + tailH / 2))
        tail.closeSubpath()
        p.addPath(tail)
        return p
    }
}

#if DEBUG
#Preview {
    VStack(spacing: 28) {
        FrigyMascotQuestion("Wie groß bist du?")
        FrigyMascotQuestion("Hast du Allergien oder Unverträglichkeiten?")
    }
    .padding(20)
    .background(FrigyBrand.bg)
}
#endif
