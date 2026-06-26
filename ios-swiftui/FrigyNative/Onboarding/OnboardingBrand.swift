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

    init(_ title: String = "Weiter", isEnabled: Bool = true, action: @escaping () -> Void) {
        self.title = title
        self.isEnabled = isEnabled
        self.action = action
    }

    var body: some View {
        Button(action: { if isEnabled { action() } }) {
            HStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(isEnabled ? AnyShapeStyle(FrigyBrand.buttonGradient) : AnyShapeStyle(FrigyBrand.buttonDisabledGradient))
            .foregroundColor(isEnabled ? .white : Color(hex: "#4AE896"))
            .clipShape(RoundedRectangle(cornerRadius: 18))
            // Soft top sheen — frosted-glass highlight catching light.
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(Color.white.opacity(isEnabled ? 0.22 : 0), lineWidth: 1)
                    .blendMode(.plusLighter)
            )
            .shadow(color: isEnabled ? Color(hex: "#4AE896").opacity(0.5) : .clear, radius: 12, y: 6)
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
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(FrigyBrand.primaryDark)
                .frame(width: 40, height: 40)
                .background(Color(UIColor.secondarySystemBackground))
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.05), radius: 2, y: 1)
        }
    }
}

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
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isSelected ? FrigyBrand.primary : FrigyBrand.selectedBg.opacity(0.5))
                        .frame(width: 44, height: 44)
                    Image(systemName: systemImage)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(isSelected ? .white : FrigyBrand.primaryDark)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(FrigyBrand.text)
                    if let subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(FrigyBrand.primaryDark)
                        .font(.system(size: 20))
                }
            }
            .padding(16)
            .modifier(FrigySelectionCardBackground(isSelected: isSelected))
        }
        .buttonStyle(.plain)
        .scaleEffect(isSelected ? 1.01 : 1)
        .animation(.spring(duration: 0.2), value: isSelected)
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
            // Nav bar
            HStack {
                if let back = onBack {
                    OnboardingBackButton(action: back)
                } else {
                    Color.clear.frame(width: 40, height: 40)
                }
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)

            // Progress
            if showProgress {
                OnboardingProgressBar(fraction: progress)
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    // Breathing room so the question never sits right under the bar.
                    .padding(.bottom, 20)
            }

            content
        }
        // Constrain the column on large screens (iPad) so spacing/alignment stay
        // phone-like and centered instead of stretching edge-to-edge.
        .frame(maxWidth: 540)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        // Translucent veil instead of a solid fill: the shared
        // OnboardingAmbientBackground glows through, tying every step to one
        // continuous cinematic backdrop while keeping content fully legible.
        .background(OnboardingScaffoldVeil().ignoresSafeArea())
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

