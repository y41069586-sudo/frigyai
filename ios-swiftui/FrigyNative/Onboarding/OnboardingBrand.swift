import SwiftUI

// MARK: - Brand colors

enum FrigyBrand {
    static let primary      = Color(hex: "#75FBB2")
    static let primaryDark  = Color(hex: "#39D47F")
    static let primaryDeep  = Color(hex: "#2EB56D")
    static let bg           = Color(adaptive: "#FBFFFD", dark: "#0A150E")
    static let selectedBg   = Color(adaptive: "#DCFEEF", dark: "#152A1E")
    static let text         = Color(adaptive: "#1F2937", dark: "#F9FAFB")
    static let textMuted    = Color(adaptive: "#6B7280", dark: "#9CA3AF")
    static let borderMint   = Color(adaptive: "#6EECC0", dark: "#2D6B4A")
    static let cardBorder   = Color(adaptive: "#BCFDDC", dark: "#1A3328")

    static var buttonGradient: LinearGradient {
        LinearGradient(
            colors: [primary, primaryDark],
            startPoint: .topLeading, endPoint: .bottomTrailing
        )
    }

    static var buttonDisabledGradient: LinearGradient {
        LinearGradient(
            colors: [Color(hex: "#DFF9EA"), Color(hex: "#C8F4DD")],
            startPoint: .topLeading, endPoint: .bottomTrailing
        )
    }
}

// MARK: - Color hex init

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    init(adaptive light: String, dark: String) {
        self.init(UIColor { traits in
            UIColor(hex: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

extension UIColor {
    convenience init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = CGFloat((int >> 16) & 0xFF) / 255
        let g = CGFloat((int >> 8) & 0xFF) / 255
        let b = CGFloat(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b, alpha: 1)
    }
}

// MARK: - Shared onboarding components

struct OnboardingContinueButton: View {
    let title: String
    let isEnabled: Bool
    let action: () -> Void

    @Environment(LanguageManager.self) private var lang

    // Most call sites don't pass an explicit title (`OnboardingContinueButton(action:)` /
    // `OnboardingContinueButton(isEnabled:action:)`), relying on this default. The default
    // stays a plain literal (translating it here would need a @MainActor-isolated
    // LanguageManager call inside a default-argument expression, which doesn't compile —
    // that's what broke the last archive). Instead the translation happens in `body` via
    // the injected `lang` environment, same as every other call site in this file.
    init(_ title: String = "Weiter", isEnabled: Bool = true, action: @escaping () -> Void) {
        self.title = title
        self.isEnabled = isEnabled
        self.action = action
    }

    var body: some View {
        Button(action: { if isEnabled { action() } }) {
            HStack(spacing: 10) {
                Text(lang.t(title))
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                // Arrow sits in its own subtle disc — gives the CTA a clear
                // "forward" affordance and a place for the eye to land.
                ZStack {
                    Circle()
                        .fill(.white.opacity(isEnabled ? 0.22 : 0.35))
                        .frame(width: 28, height: 28)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .bold))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            // Deeper green stops than the brand mint so white text always has
            // solid contrast (the light-mint gradient washed white text out).
            .background(
                isEnabled
                    ? AnyShapeStyle(LinearGradient(
                        colors: [FrigyBrand.primaryDark, FrigyBrand.primaryDeep],
                        startPoint: .topLeading, endPoint: .bottomTrailing))
                    : AnyShapeStyle(FrigyBrand.buttonDisabledGradient)
            )
            .foregroundColor(isEnabled ? .white : Color(hex: "#4AE896"))
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white.opacity(isEnabled ? 0.25 : 0), lineWidth: 1)
                    .blendMode(.plusLighter)
            )
            .shadow(color: isEnabled ? FrigyBrand.primaryDeep.opacity(0.38) : .clear, radius: 14, y: 7)
        }
        .buttonStyle(PressableButtonStyle())
        .disabled(!isEnabled)
        .animation(.easeInOut(duration: 0.18), value: isEnabled)
    }
}

/// Tactile press feedback: a gentle scale + dim that springs back. Used by the
/// primary onboarding CTA for an Apple-grade micro-interaction.
struct PressableButtonStyle: ButtonStyle {
    var scale: CGFloat = 0.96

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? scale : 1)
            .opacity(configuration.isPressed ? 0.92 : 1)
            .animation(.spring(response: 0.28, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

struct OnboardingBackButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: "chevron.left")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
                .frame(width: 38, height: 38)
                .background(.ultraThinMaterial, in: Circle())
                .overlay(Circle().stroke(FrigyBrand.cardBorder.opacity(0.8), lineWidth: 1))
                .shadow(color: .black.opacity(0.05), radius: 3, y: 1)
        }
        .buttonStyle(PressableButtonStyle(scale: 0.92))
    }
}

/// Legacy single-bar progress — kept for call sites outside the main flow.
struct OnboardingProgressBar: View {
    let fraction: Double

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(FrigyBrand.borderMint.opacity(0.28))
                    .frame(height: 4)
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .frame(width: max(geo.size.width * fraction, 4), height: 4)
                    .shadow(color: FrigyBrand.primary.opacity(0.55), radius: 5, y: 0)
                    // Confident, well-damped fill — glides to the new length.
                    .animation(.spring(response: 0.5, dampingFraction: 0.82), value: fraction)
            }
        }
        .frame(height: 4)
    }
}

/// The redesigned journey header: four phase segments (Entdecken · Dein Profil ·
/// Einrichtung · Dein Plan) with a live fill inside the current segment, plus a
/// phase label + in-phase counter row. Rendered by the scaffold on every step,
/// so the user always knows WHERE they are and how much of THIS chapter is left
/// — a single 24-step bar reads as endless; four short chapters feel quick.
struct OnboardingPhaseProgress: View {
    let progress: Double

    @Environment(LanguageManager.self) private var lang

    private var info: (phase: OnboardingPhase, stepInPhase: Int, phaseLength: Int)? {
        OnboardingFlow.phaseInfo(forProgress: progress)
    }

    var body: some View {
        VStack(spacing: 7) {
            HStack(spacing: 5) {
                ForEach(OnboardingPhase.allCases, id: \.rawValue) { phase in
                    segment(for: phase)
                }
            }
            if let info {
                HStack {
                    Text(lang.t(info.phase.germanLabel).uppercased())
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .tracking(1.3)
                        .foregroundColor(FrigyBrand.primaryDeep)
                    Spacer()
                    // The finale chapter carries no counter — it's the reveal.
                    if info.phase != .plan {
                        Text("\(info.stepInPhase)/\(info.phaseLength)")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundColor(FrigyBrand.textMuted)
                            .monospacedDigit()
                    }
                }
            }
        }
    }

    private func segment(for phase: OnboardingPhase) -> some View {
        let fill = OnboardingFlow.segmentFill(for: phase, progress: progress)
        let isCurrent = info?.phase == phase
        return GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(FrigyBrand.borderMint.opacity(0.25))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .frame(width: max(geo.size.width * fill, fill > 0 ? 5 : 0))
                    .shadow(color: isCurrent ? FrigyBrand.primary.opacity(0.6) : .clear, radius: 4)
                    .animation(.spring(response: 0.5, dampingFraction: 0.82), value: fill)
            }
        }
        .frame(height: 5)
    }
}

struct OnboardingQuestion: View {
    let text: String

    var body: some View {
        // The Frigy fridge mascot "asks" the question on its notepad.
        FrigyMascotQuestion(text)
            .padding(.horizontal, 20)
    }
}

struct OnboardingInputCard<Content: View>: View {
    let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        content()
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .frame(maxWidth: 320)
            .frigyCard(cornerRadius: 24)
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(FrigyBrand.borderMint.opacity(0.6), lineWidth: 1)
            )
    }
}

struct OnboardingSelectionCard: View {
    let title: String
    let subtitle: String?
    let systemImage: String
    let isSelected: Bool
    let action: () -> Void

    init(_ title: String, subtitle: String? = nil, systemImage: String, isSelected: Bool, action: @escaping () -> Void) {
        self.title = title
        self.subtitle = subtitle
        self.systemImage = systemImage
        self.isSelected = isSelected
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            isSelected
                                ? AnyShapeStyle(LinearGradient(
                                    colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                    startPoint: .topLeading, endPoint: .bottomTrailing))
                                : AnyShapeStyle(FrigyBrand.selectedBg.opacity(0.55))
                        )
                        .frame(width: 48, height: 48)
                        .shadow(color: isSelected ? FrigyBrand.primaryDark.opacity(0.35) : .clear, radius: 8, y: 3)
                    Image(systemName: systemImage)
                        .font(.system(size: 19, weight: .semibold))
                        .foregroundColor(isSelected ? .white : FrigyBrand.primaryDark)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(FrigyBrand.text)
                    if let subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                }
                Spacer()
                // Selection state is always visible: empty ring → filled check.
                ZStack {
                    Circle()
                        .stroke(isSelected ? FrigyBrand.primaryDeep : FrigyBrand.cardBorder, lineWidth: 2)
                        .frame(width: 24, height: 24)
                    if isSelected {
                        Circle()
                            .fill(FrigyBrand.primaryDeep)
                            .frame(width: 24, height: 24)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundColor(.white)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? FrigyBrand.selectedBg : Color(UIColor.systemBackground))
                    .shadow(
                        color: isSelected ? FrigyBrand.primaryDark.opacity(0.16) : Color.black.opacity(0.04),
                        radius: isSelected ? 12 : 6, y: 4
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isSelected ? FrigyBrand.primaryDeep : FrigyBrand.cardBorder, lineWidth: isSelected ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
        .scaleEffect(isSelected ? 1.015 : 1)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
    }
}

// MARK: - Step scaffold

struct OnboardingStepScaffold<Content: View>: View {
    let progress: Double
    let onBack: (() -> Void)?
    var showProgress: Bool = true
    @ViewBuilder let content: Content

    var body: some View {
        VStack(spacing: 0) {
            // Journey header: back button inline with the 4-phase segmented
            // progress (label + counter row underneath). One compact block
            // instead of the old two stacked rows — content starts higher.
            HStack(alignment: .top, spacing: 14) {
                if let back = onBack {
                    OnboardingBackButton(action: back)
                } else {
                    Color.clear.frame(width: 38, height: 38)
                }
                if showProgress {
                    OnboardingPhaseProgress(progress: progress)
                        .padding(.top, 5)
                } else {
                    Spacer()
                }
                Color.clear.frame(width: 38, height: 38)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, showProgress ? 18 : 4)

            content
        }
        // Constrain the column on large screens (iPad) so spacing/alignment stay
        // phone-like and centered instead of stretching edge-to-edge.
        .frame(maxWidth: 540)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(FrigyGlassBackground().ignoresSafeArea())
    }
}

// MARK: - Mint segmented control

struct MintSegmentedControl: View {
    let options: [(id: String, label: String)]
    let selected: String
    let onSelect: (String) -> Void

    @Namespace private var pillNS

    init(options: [(String, String)], selected: String, onSelect: @escaping (String) -> Void) {
        self.options = options.map { (id: $0.0, label: $0.1) }
        self.selected = selected
        self.onSelect = onSelect
    }

    var body: some View {
        HStack(spacing: 2) {
            ForEach(options, id: \.id) { opt in
                let active = opt.id == selected
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) {
                        onSelect(opt.id)
                    }
                } label: {
                    Text(opt.label)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(active ? FrigyBrand.primaryDeep : FrigyBrand.textMuted)
                        .frame(maxWidth: .infinity)
                        .frame(height: 38)
                        .background {
                            if active {
                                RoundedRectangle(cornerRadius: 11)
                                    .fill(Color(UIColor.systemBackground))
                                    .shadow(color: FrigyBrand.primaryDark.opacity(0.18), radius: 8, y: 3)
                                    .matchedGeometryEffect(id: "pill", in: pillNS)
                            }
                        }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(FrigyBrand.primary.opacity(0.13), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.borderMint.opacity(0.45), lineWidth: 1))
    }
}

