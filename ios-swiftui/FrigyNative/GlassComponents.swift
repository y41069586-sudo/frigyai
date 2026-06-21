import SwiftUI

// MARK: - GlassCard

struct GlassCard<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(20)
            .modifier(GlassCardModifier())
    }
}

private struct GlassCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            content
                .glassEffect(.regular, in: .rect(cornerRadius: 24))
        } else {
            content
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 24))
        }
    }
}

// MARK: - GlassActionButton

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
        .modifier(GlassButtonModifier())
    }
}

private struct GlassButtonModifier: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26, *) {
            content
                .glassEffect(.regular.tint(.blue).interactive(), in: .capsule)
        } else {
            content
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
        }
    }
}

// MARK: - GlassToolbar (iOS 26 only demo)

@available(iOS 26, *)
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

// MARK: - Demo

#if DEBUG
@available(iOS 26, *)
struct GlassDemoView: View {
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
            .ignoresSafeArea()

            VStack(spacing: 32) {
                Text("Liquid Glass")
                    .font(.title.bold())

                GlassCard {
                    Label("Frigy", systemImage: "sparkles")
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
