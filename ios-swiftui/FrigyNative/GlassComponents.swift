import SwiftUI

// MARK: - Basis: einzelnes Glass-Element

struct GlassCard<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(20)
            .glassEffect(.regular, in: .rect(cornerRadius: 24))
    }
}

// MARK: - Getönter, interaktiver Glass-Button

struct GlassActionButton: View {
    let title: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
        }
        // .tint() = semantische Bedeutung, .interactive() = Scale/Bounce on tap
        .glassEffect(.regular.tint(.blue).interactive(), in: .capsule)
    }
}

// MARK: - Mehrere Elemente, die verschmelzen + morphen

struct GlassToolbar: View {
    @Namespace private var glassNamespace
    @State private var expanded = false

    var body: some View {
        GlassEffectContainer(spacing: 20) {
            HStack(spacing: 20) {
                Image(systemName: "heart.fill")
                    .frame(width: 56, height: 56)
                    .glassEffect()
                    .glassEffectID("heart", in: glassNamespace)

                if expanded {
                    Image(systemName: "bookmark.fill")
                        .frame(width: 56, height: 56)
                        .glassEffect()
                        .glassEffectID("bookmark", in: glassNamespace)
                }

                Image(systemName: expanded ? "xmark" : "ellipsis")
                    .frame(width: 56, height: 56)
                    .glassEffect(.regular.interactive())
                    .glassEffectID("more", in: glassNamespace)
                    .onTapGesture {
                        withAnimation(.bouncy) { expanded.toggle() }
                    }
            }
            .font(.system(size: 22))
        }
    }
}

// MARK: - Demo-Hintergrund (ersetzbar durch Image("background") aus Assets)

private struct GlassDemoBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.12, green: 0.45, blue: 0.95),
                    Color(red: 0.55, green: 0.22, blue: 0.82),
                    Color(red: 0.98, green: 0.45, blue: 0.18),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Image(systemName: "leaf.fill")
                .font(.system(size: 220, weight: .ultraLight))
                .foregroundStyle(.white.opacity(0.12))
                .rotationEffect(.degrees(-18))
                .offset(x: 40, y: -80)
        }
        .ignoresSafeArea()
    }
}

// MARK: - Demo-Screen

#if DEBUG
struct GlassDemoView: View {
    var body: some View {
        ZStack {
            // Content-Ebene: Hintergrund, über den das Glas refraktiert
            GlassDemoBackground()

            VStack(spacing: 32) {
                Text("Liquid Glass")
                    .font(.title.bold())

                GlassCard {
                    Label("Functional chrome only", systemImage: "sparkles")
                        .font(.headline)
                }

                GlassActionButton(title: "Aktion", systemImage: "sparkles") {}

                GlassToolbar()
            }
            .padding()
        }
    }
}
#endif
