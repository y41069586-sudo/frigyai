import SwiftUI

/// The Frigy fridge mascot (the app-icon character) next to a compact notepad on
/// which the current question is "written" quickly, letter by letter, as it
/// appears. The fridge gently bobs and the pad sways — smooth and self-contained.
///
/// Kept deliberately small so it only occupies the top of the screen (never
/// growing to fill it). Drop it in place of a plain question `Text(...)` header:
///
/// ```swift
/// FrigyMascotQuestion("Wie groß bist du?")
///     .padding(.horizontal, 20)
/// ```
struct FrigyMascotQuestion: View {
    let question: String
    let mascotSize: CGFloat

    @State private var appeared = false
    @State private var bob = false
    @State private var sway = false
    @State private var penWiggle = false
    @State private var typed = ""
    @State private var typingTask: Task<Void, Never>? = nil

    init(_ question: String, mascotSize: CGFloat = 50) {
        self.question = question
        self.mascotSize = mascotSize
    }

    var body: some View {
        HStack(alignment: .center, spacing: 8) {
            mascot
            notepad
        }
        // Critical: prevent the HStack from stretching to fill all available
        // vertical space — the notepad should only be as tall as its content.
        .fixedSize(horizontal: false, vertical: true)
        .onAppear {
            startIdle()
            runType()
        }
        .onDisappear { typingTask?.cancel() }
        .onChange(of: question) { _, _ in
            runType()
        }
    }

    // MARK: - Mascot (no arms/feet — just the fridge, gently bobbing)

    private var mascot: some View {
        Image("FrigyMascot")
            .resizable()
            .scaledToFit()
            .frame(width: mascotSize, height: mascotSize)
            .offset(y: bob ? -3 : 3)
            .rotationEffect(.degrees(appeared ? 0 : -10), anchor: .bottom)
            .scaleEffect(appeared ? 1 : 0.5, anchor: .bottom)
            .opacity(appeared ? 1 : 0)
            .animation(.spring(response: 0.55, dampingFraction: 0.6), value: appeared)
            .shadow(color: FrigyBrand.primaryDark.opacity(0.16), radius: 6, y: 3)
            .accessibilityHidden(true)
    }

    // MARK: - Notepad (compact — sized to its text, never the whole screen)

    private var notepad: some View {
        VStack(spacing: 0) {
            spiralBinding
            paper
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white)
                .shadow(color: Color(hex: "#39D47F").opacity(0.14), radius: 12, y: 6)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(FrigyBrand.borderMint.opacity(0.55), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .rotationEffect(.degrees(sway ? 0.6 : -0.6), anchor: .bottomLeading)
        .scaleEffect(appeared ? 1 : 0.9, anchor: .bottomLeading)
        .opacity(appeared ? 1 : 0)
        .animation(.spring(response: 0.5, dampingFraction: 0.75).delay(0.05), value: appeared)
    }

    private var spiralBinding: some View {
        ZStack {
            Rectangle()
                .fill(FrigyBrand.selectedBg)
                .frame(height: 13)
            HStack(spacing: 0) {
                ForEach(0..<8, id: \.self) { _ in
                    Circle()
                        .stroke(FrigyBrand.primaryDeep.opacity(0.5), lineWidth: 1.4)
                        .frame(width: 6, height: 6)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 10)
        }
    }

    private var paper: some View {
        ZStack(alignment: .topLeading) {
            marginLine
            HStack(alignment: .top, spacing: 1) {
                Text(typed)
                    .font(.system(size: 15.5, weight: .semibold, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                    .tracking(-0.2)
                    .lineSpacing(4)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                // Little pen that follows the text while it's still being written.
                if typed.count < question.count {
                    Image(systemName: "pencil")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                        .rotationEffect(.degrees(penWiggle ? -10 : 6))
                        .offset(y: 1)
                }
            }
            .padding(.leading, 22)
            .padding(.trailing, 12)
            .padding(.vertical, 10)
        }
    }

    /// Soft pink margin rule on the left, like a real notepad.
    private var marginLine: some View {
        HStack(spacing: 0) {
            Spacer().frame(width: 16)
            Rectangle()
                .fill(Color(hex: "#F4B8C4").opacity(0.45))
                .frame(width: 1.2)
            Spacer()
        }
        .allowsHitTesting(false)
    }

    // MARK: - Animation driving

    private func startIdle() {
        appeared = true
        withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) { bob = true }
        withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) { sway = true }
        withAnimation(.easeInOut(duration: 0.3).repeatForever(autoreverses: true)) { penWiggle = true }
    }

    /// Quickly "writes" the question one character at a time — fast but smooth.
    private func runType() {
        typingTask?.cancel()
        let full = question
        typed = ""
        typingTask = Task { @MainActor in
            // Small settle-in before the pen starts.
            try? await Task.sleep(nanoseconds: 200_000_000)
            for index in full.indices {
                if Task.isCancelled { return }
                typed = String(full[full.startIndex...index])
                try? await Task.sleep(nanoseconds: 22_000_000) // ~22ms/char — quick
            }
        }
    }
}

#if DEBUG
#Preview {
    VStack(spacing: 28) {
        FrigyMascotQuestion("Wie groß bist du?")
        FrigyMascotQuestion("Hast du Allergien oder Unverträglichkeiten?")
        FrigyMascotQuestion("Wie schnell möchtest du dein Ziel erreichen und dabei gesund bleiben?")
        Spacer()
    }
    .padding(20)
    .background(FrigyBrand.bg)
}
#endif
