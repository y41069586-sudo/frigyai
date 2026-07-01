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

// MARK: - LiquidGlassPrimaryButton

/// Full-width or auto-width primary CTA with mint gradient, glass overlay stroke, and spring press animation.
struct LiquidGlassPrimaryButton: View {
    let title: String
    var systemImage: String? = nil
    var cornerRadius: CGFloat = 16
    var height: CGFloat = 50
    var isEnabled: Bool = true
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = systemImage {
                    Image(systemName: icon)
                        .font(.system(size: 15, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(
                        LinearGradient(
                            colors: isEnabled
                                ? [Color(hex: "#75FBB2"), Color(hex: "#39D47F")]
                                : [Color(hex: "#BCFDDC"), Color(hex: "#BCFDDC")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.white.opacity(0.35), lineWidth: 1)
                    .blendMode(.overlay)
            )
            .shadow(
                color: isEnabled ? Color(hex: "#39D47F").opacity(0.28) : .clear,
                radius: 12, y: 6
            )
            .scaleEffect(isPressed ? 0.97 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isPressed)
        }
        .disabled(!isEnabled)
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - LiquidGlassSecondaryButton

/// Ghost / secondary button with ultraThinMaterial fill and mint border.
struct LiquidGlassSecondaryButton: View {
    let title: String
    var systemImage: String? = nil
    var cornerRadius: CGFloat = 14
    var height: CGFloat = 44
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = systemImage {
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundColor(FrigyBrand.primaryDark)
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .realGlass(
                in: RoundedRectangle(cornerRadius: cornerRadius),
                interactive: true,
                fallbackBorder: FrigyBrand.primary.opacity(0.5)
            )
            .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
            .scaleEffect(isPressed ? 0.97 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - LiquidGlassCircleButton

/// Premium liquid glass circle button (e.g. FAB, header actions).
struct LiquidGlassCircleButton: View {
    let systemImage: String
    var size: CGFloat = 44
    var iconSize: CGFloat = 18
    var usePrimaryGradient: Bool = false
    let action: () -> Void

    @State private var isPressed = false

    @ViewBuilder
    private var iconLabel: some View {
        Image(systemName: systemImage)
            .font(.system(size: iconSize, weight: .semibold))
            .foregroundColor(usePrimaryGradient ? .white : FrigyBrand.primaryDark)
            .frame(width: size, height: size)
    }

    var body: some View {
        Button(action: action) {
            Group {
                if usePrimaryGradient {
                    if #available(iOS 26, *) {
                        // Tinted REAL Apple glass.
                        iconLabel
                            .glassEffect(.regular.tint(FrigyBrand.primaryDeep).interactive(), in: .circle)
                            .shadow(color: Color(hex: "#39D47F").opacity(0.25), radius: 8, y: 4)
                    } else {
                        // Mint gradient fill fallback.
                        iconLabel
                            .background(
                                Circle()
                                    .fill(LinearGradient(
                                        colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    .overlay(Circle().stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                            )
                            .shadow(color: Color(hex: "#39D47F").opacity(0.25), radius: 8, y: 4)
                    }
                } else {
                    iconLabel
                        .realGlass(in: Circle(), interactive: true)
                        .shadow(color: .black.opacity(0.05), radius: 8, y: 4)
                }
            }
            .scaleEffect(isPressed ? 0.93 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - LiquidGlassInputField

/// Glass-styled text input field (for standalone use outside of Form).
struct LiquidGlassInputField: View {
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var cornerRadius: CGFloat = 14
    @FocusState.Binding var focused: Bool

    var body: some View {
        TextField(placeholder, text: $text)
            .keyboardType(keyboardType)
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .realGlass(in: RoundedRectangle(cornerRadius: cornerRadius), interactive: false)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(
                        focused ? FrigyBrand.primary.opacity(0.6) : Color.clear,
                        lineWidth: 1.5
                    )
            )
            .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
            .focused($focused)
    }
}

// MARK: - LiquidGlassSegmentedPicker

/// Custom segmented control using glass pills. Mint-filled active pill.
struct LiquidGlassSegmentedPicker<T: Hashable>: View {
    let options: [(label: String, icon: String?, value: T)]
    @Binding var selection: T

    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(options.enumerated()), id: \.offset) { _, opt in
                let isSelected = selection == opt.value
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) {
                        selection = opt.value
                    }
                } label: {
                    HStack(spacing: 6) {
                        if let icon = opt.icon {
                            Image(systemName: icon)
                                .font(.system(size: 12, weight: .semibold))
                        }
                        Text(opt.label)
                            .font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundColor(isSelected ? .white : FrigyBrand.primaryDark)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        Capsule()
                            .fill(isSelected
                                ? AnyShapeStyle(LinearGradient(
                                    colors: [Color(hex: "#75FBB2"), Color(hex: "#39D47F")],
                                    startPoint: .topLeading, endPoint: .bottomTrailing))
                                : AnyShapeStyle(Color.clear))
                    )
                    .overlay(
                        Capsule()
                            .stroke(isSelected ? Color.white.opacity(0.35) : Color.clear, lineWidth: 1)
                            .blendMode(.overlay)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .realGlass(in: Capsule(), interactive: false, fallbackBorder: FrigyBrand.cardBorder.opacity(0.5))
    }
}

// MARK: - LiquidGlassCheckbox

/// Glass-styled checkbox with animated check fill using category accent color.
struct LiquidGlassCheckbox: View {
    let isChecked: Bool
    var accentColor: Color = FrigyBrand.primaryDark
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            ZStack {
                Circle()
                    .fill(isChecked
                        ? AnyShapeStyle(LinearGradient(
                            colors: [accentColor.opacity(0.8), accentColor],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                        : AnyShapeStyle(.ultraThinMaterial))
                    .frame(width: 26, height: 26)
                Circle()
                    .stroke(isChecked ? accentColor : FrigyBrand.cardBorder, lineWidth: 1.5)
                    .frame(width: 26, height: 26)
                if isChecked {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .shadow(color: isChecked ? accentColor.opacity(0.25) : .clear, radius: 4, y: 2)
            .scaleEffect(isChecked ? 1.05 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.65), value: isChecked)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - App-wide Liquid Glass utilities

struct FrigyGlassBackground: View {
    @Environment(\.colorScheme) private var colorScheme
    var body: some View {
        colorScheme == .dark ? Color(hex: "#0A150E") : Color(hex: "#FBFFFD")
    }
}

/// Custom navigation header — replaces the system nav bar in every pushed screen and sheet.
struct FrigyNavBar: View {
    let title: String
    var showBack: Bool = true
    var dismissLabel: String? = nil
    var trailingIcon: String? = nil
    var trailingAction: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang

    var body: some View {
        HStack(spacing: 0) {
            Group {
                if showBack {
                    Button { dismiss() } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 15, weight: .semibold))
                            Text(dismissLabel ?? lang.t("Zurück"))
                                .font(.system(size: 15, weight: .medium))
                        }
                        .foregroundColor(FrigyBrand.primaryDark)
                    }
                    .buttonStyle(.plain)
                } else {
                    Color.clear
                }
            }
            .frame(width: 80, alignment: .leading)

            Spacer()
            Text(title)
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(FrigyBrand.text)
            Spacer()

            Group {
                if let icon = trailingIcon, let action = trailingAction {
                    Button(action: action) {
                        Image(systemName: icon)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(FrigyBrand.primaryDark)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(FrigyBrand.primary.opacity(0.15)))
                    }
                    .buttonStyle(.plain)
                } else {
                    Color.clear
                }
            }
            .frame(width: 80, alignment: .trailing)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}

extension View {
    /// Constrains scrollable content to a readable centered column (max 700pt)
    /// and top-aligns it. On iPhone this is a no-op visually (screen < 700), but
    /// on iPad it stops cards from stretching edge-to-edge across the whole width
    /// and stops the content from floating vertically centered. Apply to the
    /// inner content VStack of a ScrollView on pushed detail screens.
    func detailContentColumn(maxWidth: CGFloat = 700) -> some View {
        // Full-width, top-aligned. (Previously constrained to a 700pt column, which
        // on iPad made detail content look like a narrow card floating in the
        // centre instead of filling the screen.)
        self
            .frame(maxWidth: .infinity, alignment: .top)
    }

    /// Wraps a whole pushed detail SCREEN so it (a) fills the navigation area and
    /// top-aligns — fixing the iPad bug where the content floated vertically
    /// centered / "way down the screen" — and (b) constrains the screen to a
    /// centered 700pt column so cards don't stretch edge-to-edge on iPad, with a
    /// full-bleed background filling the sides. Applied once at the routing layer
    /// so every pushed detail view is fixed in one place. No-op look on iPhone.
    func frigyDetailContainer(maxWidth: CGFloat = 700) -> some View {
        // Top-anchor pushed detail screens on iPad.
        //
        // Root screens (dashboard) fill fine, but PUSHED NavigationStack
        // destinations on iPad receive an effectively UNBOUNDED height proposal.
        // Under that, `.frame(maxHeight: .infinity)`, a GeometryReader, and even a
        // Color background all collapse to their content height, and the detail
        // area then CENTRES the block — the "everything floats in the middle /
        // gap at the top" bug.
        //
        // `containerRelativeFrame([.vertical])` sizes the view to the enclosing
        // container's real height regardless of the proposal, giving the inner
        // ScrollView a concrete height (so it scrolls) and pinning the nav bar to
        // the top.
        self
            .frame(maxWidth: .infinity, alignment: .top)
            .containerRelativeFrame([.vertical], alignment: .top)
            .background(FrigyGlassBackground().ignoresSafeArea())
    }

    /// Liquid Glass card on iOS 26+; white rounded card with shadow on older OS.
    func frigyCard(cornerRadius: CGFloat = 16) -> some View {
        modifier(FrigyCardModifier(cornerRadius: cornerRadius))
    }

    /// Liquid Glass circle button on iOS 26+; mint fill circle on older OS.
    func frigyCircleButton() -> some View {
        modifier(FrigyCircleButtonModifier())
    }

    /// REAL Apple Liquid Glass (iOS 26 `.glassEffect`) with a graceful
    /// `.ultraThinMaterial` fallback for iOS 17–25. `tint` adds a colored glass,
    /// `interactive` enables Apple's built-in press refraction/scale feedback.
    @ViewBuilder
    func realGlass<S: Shape>(
        in shape: S,
        tint: Color? = nil,
        interactive: Bool = true,
        fallbackBorder: Color = FrigyBrand.primary.opacity(0.4)
    ) -> some View {
        if #available(iOS 26, *) {
            modifier(RealGlassModifier(shape: shape, tint: tint, interactive: interactive))
        } else {
            background(.ultraThinMaterial, in: shape)
                .overlay(shape.stroke(fallbackBorder, lineWidth: 1))
        }
    }
}

@available(iOS 26, *)
private struct RealGlassModifier<S: Shape>: ViewModifier {
    let shape: S
    let tint: Color?
    let interactive: Bool

    func body(content: Content) -> some View {
        switch (tint, interactive) {
        case let (.some(color), true):
            content.glassEffect(.regular.tint(color).interactive(), in: shape)
        case let (.some(color), false):
            content.glassEffect(.regular.tint(color), in: shape)
        case (.none, true):
            content.glassEffect(.regular.interactive(), in: shape)
        case (.none, false):
            content.glassEffect(.regular, in: shape)
        }
    }
}

struct FrigySelectionCardBackground: ViewModifier {
    let isSelected: Bool
    var cornerRadius: CGFloat = 16

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(isSelected ? FrigyBrand.selectedBg : Color(UIColor.systemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .stroke(
                                isSelected ? FrigyBrand.primary : FrigyBrand.cardBorder,
                                lineWidth: isSelected ? 1.5 : 1
                            )
                    )
            )
    }
}

private struct FrigyCardModifier: ViewModifier {
    let cornerRadius: CGFloat
    @Environment(\.colorScheme) private var colorScheme
    func body(content: Content) -> some View {
        content
            .background(colorScheme == .dark ? Color(hex: "#111F17") : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .shadow(color: .black.opacity(colorScheme == .dark ? 0.25 : 0.05), radius: 6, y: 2)
    }
}

private struct FrigyCircleButtonModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(FrigyBrand.selectedBg)
            .clipShape(Circle())
    }
}

// MARK: - Demo

#if DEBUG
@available(iOS 26, *)
private struct GlassToolbar: View {
    @Namespace private var glassNamespace
    @State private var expanded = false

    var body: some View {
        GlassEffectContainer {
            HStack(spacing: 20) {
                Image(systemName: "heart.fill")
                    .frame(width: 56, height: 56)
                    .glassEffect(.regular)
                    .glassEffectID("heart", in: glassNamespace)

                if expanded {
                    Image(systemName: "bookmark.fill")
                        .frame(width: 56, height: 56)
                        .glassEffect(.regular)
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
