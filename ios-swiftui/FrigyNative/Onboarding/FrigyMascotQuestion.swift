import SwiftUI

/// The Frigy fridge mascot (the app-icon character) holding a notepad with the
/// current question written directly on it. The pen "writes" as the pad appears,
/// the fridge gently bobs and the pad sways — everything smooth and self-contained.
///
/// The notepad grows with its text, so every question fits comfortably. Drop it in
/// place of a plain question `Text(...)` header:
///
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
    @State private var sway = false
    @State private var penWiggle = false
    @State private var writeProgress: CGFloat = 0

    init(_ question: String, mascotSize: CGFloat = 58) {
        self.question = question
        self.mascotSize = mascotSize
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: -10) {
            mascot
            notepad
        }
        .onAppear {
            startIdle()
            runWrite()
        }
        .onChange(of: question) { _, _ in
            runWrite()
        }
    }

    // MARK: - Mascot (holds the pad from the lower-left)

    private var mascot: some View {
        ZStack {
            Image("FrigyMascot")
                .resizable()
                .scaledToFit()
                .frame(width: mascotSize, height: mascotSize)
            arms
        }
        .frame(width: mascotSize, height: mascotSize)
        .offset(y: bob ? -3 : 3)
        .rotationEffect(.degrees(appeared ? 0 : -10), anchor: .bottom)
        .scaleEffect(appeared ? 1 : 0.5, anchor: .bottom)
        .opacity(appeared ? 1 : 0)
        .animation(.spring(response: 0.55, dampingFraction: 0.6), value: appeared)
        .shadow(color: FrigyBrand.primaryDark.opacity(0.16), radius: 7, y: 4)
        .zIndex(1)
        .accessibilityHidden(true)
    }

    /// Two little arms reaching from the fridge to grip the notepad's near edge.
    private var arms: some View {
        let bodyGreen = LinearGradient(
            colors: [Color(hex: "#AFEEB0"), Color(hex: "#74CE86")],
            startPoint: .top, endPoint: .bottom
        )
        return ZStack {
            armHand(green: bodyGreen, y: mascotSize * 0.08, angle: -11)
            armHand(green: bodyGreen, y: mascotSize * 0.30, angle: 9)
        }
        .offset(x: mascotSize * 0.40)
    }

    private func armHand(green: LinearGradient, y: CGFloat, angle: Double) -> some View {
        HStack(spacing: -3) {
            Capsule()
                .fill(green)
                .overlay(Capsule().stroke(Color(hex: "#3FA552").opacity(0.55), lineWidth: 1))
                .frame(width: 15, height: 7)
            // Mitten hand, like the fridge's white face.
            Circle()
                .fill(Color.white)
                .overlay(Circle().stroke(Color(hex: "#BFE9C6"), lineWidth: 1))
                .frame(width: 12, height: 12)
                .shadow(color: .black.opacity(0.06), radius: 1, y: 1)
        }
        .rotationEffect(.degrees(angle), anchor: .leading)
        .offset(y: y)
    }

    // MARK: - Notepad

    private var notepad: some View {
        VStack(spacing: 0) {
            spiralBinding
            paper
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: Color(hex: "#39D47F").opacity(0.14), radius: 14, y: 7)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(FrigyBrand.borderMint.opacity(0.55), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .rotationEffect(.degrees(sway ? 0.7 : -0.7), anchor: .bottomLeading)
        .scaleEffect(appeared ? 1 : 0.9, anchor: .bottomLeading)
        .opacity(appeared ? 1 : 0)
        .animation(.spring(response: 0.5, dampingFraction: 0.75).delay(0.05), value: appeared)
    }

    private var spiralBinding: some View {
        ZStack {
            Rectangle()
                .fill(FrigyBrand.selectedBg)
                .frame(height: 16)
            HStack(spacing: 0) {
                ForEach(0..<8, id: \.self) { _ in
                    Circle()
                        .stroke(FrigyBrand.primaryDeep.opacity(0.5), lineWidth: 1.6)
                        .frame(width: 7, height: 7)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 12)
        }
    }

    private var paper: some View {
        ZStack(alignment: .topLeading) {
            ruledLines
            marginLine
            VStack(alignment: .leading, spacing: 8) {
                Text(question)
                    .font(.system(size: 16.5, weight: .semibold, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                    .tracking(-0.2)
                    .lineSpacing(7)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                writeUnderline
            }
            .padding(.leading, 30)
            .padding(.trailing, 14)
            .padding(.top, 12)
            .padding(.bottom, 14)
        }
    }

    /// Faint horizontal rules so the card reads as lined notepad paper.
    private var ruledLines: some View {
        GeometryReader { geo in
            let spacing: CGFloat = 27
            let count = Swift.max(Int(geo.size.height / spacing), 1)
            VStack(spacing: 0) {
                ForEach(0..<count, id: \.self) { _ in
                    Spacer().frame(height: spacing - 1)
                    Rectangle()
                        .fill(FrigyBrand.borderMint.opacity(0.16))
                        .frame(height: 1)
                }
            }
        }
        .allowsHitTesting(false)
    }

    /// Soft pink margin rule on the left, like a real notepad.
    private var marginLine: some View {
        HStack(spacing: 0) {
            Spacer().frame(width: 22)
            Rectangle()
                .fill(Color(hex: "#F4B8C4").opacity(0.45))
                .frame(width: 1.2)
            Spacer()
        }
        .allowsHitTesting(false)
    }

    /// The pen and the line it "writes" beneath the question.
    private var writeUnderline: some View {
        GeometryReader { geo in
            let w = geo.size.width
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(FrigyBrand.buttonGradient)
                    .frame(width: Swift.max(w * 0.55 * writeProgress, 0), height: 2.5)
                Image(systemName: "pencil")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(FrigyBrand.primaryDeep)
                    .rotationEffect(.degrees(penWiggle ? -8 : 8))
                    .offset(x: Swift.max(w * 0.55 * writeProgress - 5, -2), y: -7)
                    .opacity(writeProgress > 0.02 && writeProgress < 0.99 ? 1 : 0)
            }
            .frame(height: 3)
        }
        .frame(height: 6)
    }

    // MARK: - Animation driving

    private func startIdle() {
        appeared = true
        withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) { bob = true }
        withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) { sway = true }
        withAnimation(.easeInOut(duration: 0.3).repeatForever(autoreverses: true)) { penWiggle = true }
    }

    private func runWrite() {
        writeProgress = 0
        // Let the pad settle in, then "write" the underline smoothly.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.easeInOut(duration: 1.0)) { writeProgress = 1 }
        }
    }
}

#if DEBUG
#Preview {
    VStack(spacing: 28) {
        FrigyMascotQuestion("Wie groß bist du?")
        FrigyMascotQuestion("Hast du Allergien oder Unverträglichkeiten?")
        FrigyMascotQuestion("Wie schnell möchtest du dein Ziel erreichen und dabei gesund bleiben?")
    }
    .padding(20)
    .background(FrigyBrand.bg)
}
#endif
