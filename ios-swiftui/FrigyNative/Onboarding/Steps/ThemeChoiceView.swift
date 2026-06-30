import SwiftUI

/// First-launch appearance picker shown as a full-screen step. Selecting an
/// option updates the live `ThemeManager` so the whole screen animates between
/// light and dark as a preview before the user commits.
struct ThemeChoiceView: View {
    @Environment(ThemeManager.self) private var theme
    @Environment(LanguageManager.self) private var lang
    let onContinue: () -> Void

    @State private var selection: ThemePreference = ThemeManager.shared.preference
    @State private var appear = false

    var body: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer().frame(height: 24)

                // Icon badge
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 76, height: 76)
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.3), radius: 18, y: 8)
                    Image(systemName: selection.icon)
                        .font(.system(size: 34, weight: .semibold))
                        .foregroundColor(.white)
                        .contentTransition(.symbolEffect(.replace))
                }
                .padding(.bottom, 22)

                Text(lang.t("Wie soll Frigy aussehen?"))
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundColor(FrigyBrand.text)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                Text(lang.t("Du kannst das jederzeit in den Einstellungen ändern."))
                    .font(.system(size: 15))
                    .foregroundColor(FrigyBrand.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                    .padding(.top, 8)

                Spacer().frame(height: 30)

                VStack(spacing: 14) {
                    ForEach(ThemePreference.allCases) { pref in
                        themeCard(pref)
                    }
                }
                .padding(.horizontal, 22)

                Spacer()

                Button {
                    theme.choose(selection)
                    onContinue()
                } label: {
                    HStack(spacing: 8) {
                        Text(lang.t("Weiter"))
                            .font(.system(size: 17, weight: .black))
                            .tracking(-0.4)
                        Image(systemName: "arrow.right")
                            .font(.system(size: 15, weight: .bold))
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
                    .background(FrigyBrand.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 26))
                    .shadow(color: FrigyBrand.primaryDark.opacity(0.25), radius: 16, y: 8)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 24)
                .padding(.bottom, 28)
            }
            .opacity(appear ? 1 : 0)
            .offset(y: appear ? 0 : 16)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.4)) { appear = true }
        }
    }

    private func themeCard(_ pref: ThemePreference) -> some View {
        let selected = selection == pref
        return Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                selection = pref
                theme.preference = pref   // live preview
            }
        } label: {
            HStack(spacing: 16) {
                miniPreview(pref)

                VStack(alignment: .leading, spacing: 3) {
                    Text(lang.t(pref.label))
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t(pref.subtitle))
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer()

                ZStack {
                    Circle()
                        .stroke(selected ? FrigyBrand.primaryDark : FrigyBrand.cardBorder, lineWidth: 2)
                        .frame(width: 24, height: 24)
                    if selected {
                        Circle().fill(FrigyBrand.primaryDark).frame(width: 24, height: 24)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(.white)
                    }
                }
            }
            .padding(14)
            .background(selected ? FrigyBrand.selectedBg : Color(UIColor.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(selected ? FrigyBrand.primaryDark : FrigyBrand.cardBorder,
                            lineWidth: selected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
    }

    /// Tiny phone-screen mockup that shows what the theme looks like.
    private func miniPreview(_ pref: ThemePreference) -> some View {
        let isDark: Bool = pref == .dark
        let bg = isDark ? Color(hex: "#0E1A14") : Color(hex: "#F4FBF7")
        let card = isDark ? Color(hex: "#1A2B22") : Color.white
        let line = isDark ? Color(hex: "#2D6B4A") : Color(hex: "#D7F2E3")

        return ZStack {
            RoundedRectangle(cornerRadius: 12).fill(bg)
            VStack(spacing: 4) {
                RoundedRectangle(cornerRadius: 3).fill(FrigyBrand.primary).frame(width: 26, height: 6)
                RoundedRectangle(cornerRadius: 3).fill(card).frame(width: 34, height: 9)
                    .overlay(RoundedRectangle(cornerRadius: 3).stroke(line, lineWidth: 1))
                RoundedRectangle(cornerRadius: 3).fill(card).frame(width: 34, height: 9)
                    .overlay(RoundedRectangle(cornerRadius: 3).stroke(line, lineWidth: 1))
            }
        }
        .frame(width: 52, height: 52)
        .overlay(
            // System = split light/dark diagonally.
            Group {
                if pref == .system {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(hex: "#0E1A14"))
                        .frame(width: 52, height: 52)
                        .mask(
                            Triangle().frame(width: 52, height: 52)
                        )
                        .overlay(
                            VStack(spacing: 4) {
                                RoundedRectangle(cornerRadius: 3).fill(FrigyBrand.primary).frame(width: 26, height: 6)
                                RoundedRectangle(cornerRadius: 3).fill(Color(hex: "#1A2B22")).frame(width: 34, height: 9)
                                RoundedRectangle(cornerRadius: 3).fill(Color(hex: "#1A2B22")).frame(width: 34, height: 9)
                            }
                            .mask(Triangle().frame(width: 52, height: 52))
                        )
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(FrigyBrand.cardBorder, lineWidth: 1))
    }
}

/// Bottom-left triangle mask used for the "System" split preview.
private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.maxX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        p.closeSubpath()
        return p
    }
}
