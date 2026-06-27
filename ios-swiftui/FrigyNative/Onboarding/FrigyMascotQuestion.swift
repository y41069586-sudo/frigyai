import SwiftUI

/// A question header that "writes" itself letter by letter when the screen
/// appears — a smooth pen-on-paper typewriter effect, nothing more.
///
/// Drop-in replacement for a plain `Text(...)` question header:
///
/// ```swift
/// FrigyMascotQuestion("Wie groß bist du?")
///     .padding(.horizontal, 20)
/// ```
struct FrigyMascotQuestion: View {
    let question: String

    @State private var typed = ""
    @State private var typingTask: Task<Void, Never>? = nil

    // mascotSize kept for API compatibility — unused.
    init(_ question: String, mascotSize: CGFloat = 50) {
        self.question = question
    }

    var body: some View {
        Text(typed)
            .font(.system(size: 22, weight: .bold, design: .rounded))
            .foregroundColor(FrigyBrand.text)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .onAppear { runType() }
            .onDisappear { typingTask?.cancel() }
            .onChange(of: question) { _, _ in runType() }
    }

    private func runType() {
        typingTask?.cancel()
        let full = question
        typed = ""
        typingTask = Task { @MainActor in
            // Brief moment before the pen starts moving.
            try? await Task.sleep(nanoseconds: 180_000_000)
            for index in full.indices {
                if Task.isCancelled { return }
                typed = String(full[full.startIndex...index])
                // ~20 ms per character — fast and smooth.
                try? await Task.sleep(nanoseconds: 20_000_000)
            }
        }
    }
}

#if DEBUG
#Preview {
    VStack(alignment: .leading, spacing: 32) {
        FrigyMascotQuestion("Wie groß bist du?")
        FrigyMascotQuestion("Hast du Allergien oder Unverträglichkeiten?")
        FrigyMascotQuestion("Wie schnell möchtest du dein Ziel erreichen?")
        Spacer()
    }
    .padding(24)
    .background(FrigyBrand.bg)
}
#endif
