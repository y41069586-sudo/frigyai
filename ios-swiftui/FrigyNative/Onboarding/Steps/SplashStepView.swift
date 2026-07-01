import SwiftUI

struct SplashStepView: View {
    let onNext: () -> Void
    var onSignIn: (() -> Void)? = nil

    @State private var opacity = 0.0
    @State private var mascotOffset = 18.0
    @State private var textOffset = 18.0
    @State private var showLanguagePicker = false

    @Environment(LanguageManager.self) private var lang

    var body: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            VStack(spacing: 0) {
                // Top bar: wordmark + language picker
                HStack(alignment: .center) {
                    Text("Frigy")
                        .font(.system(size: 28, weight: .black))
                        .foregroundColor(FrigyBrand.primaryDark)
                        .tracking(-1.5)

                    Spacer()

                    Button { showLanguagePicker = true } label: {
                        HStack(spacing: 5) {
                            Text(lang.language.flag)
                                .font(.system(size: 15))
                            Text(lang.language.rawValue.uppercased())
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(FrigyBrand.text)
                        }
                        .padding(.horizontal, 11)
                        .padding(.vertical, 7)
                        .background(
                            Capsule()
                                .fill(Color(UIColor.secondarySystemBackground))
                                .overlay(Capsule().stroke(FrigyBrand.cardBorder, lineWidth: 1))
                        )
                    }
                    .buttonStyle(.plain)
                    .sheet(isPresented: $showLanguagePicker) {
                        SplashLanguagePickerSheet()
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)

                // Mascot — floating
                MascotFloatingView()
                    .frame(height: UIScreen.main.bounds.height * 0.32)
                    .offset(y: mascotOffset)

                // Headline + subline
                VStack(spacing: 0) {
                    VStack(alignment: .center, spacing: 0) {
                        Text(lang.t("Iss smarter."))
                            .font(.system(size: 43, weight: .heavy))
                            .foregroundColor(FrigyBrand.text)
                            .tracking(-3.5)
                            .lineLimit(1)

                        Text(lang.t("Leb leichter."))
                            .font(.system(size: 43, weight: .heavy))
                            .foregroundColor(FrigyBrand.text)
                            .tracking(-3.5)
                            .lineLimit(1)
                            .fixedSize()
                            .background(alignment: .bottom) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(FrigyBrand.primary.opacity(0.45))
                                    .frame(height: 14)
                                    .padding(.horizontal, -2)
                                    .offset(y: -3)
                            }
                    }
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)

                    Text(lang.t("Generiere Wochenpläne, scanne deinen Kühlschrank und bekomme automatisch deine Einkaufsliste."))
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)
                        .tracking(-0.4)
                        .padding(.horizontal, 32)
                        .padding(.top, 20)
                }
                .offset(y: textOffset)

                Spacer()

                // CTA
                VStack(spacing: 16) {
                    Button(action: onNext) {
                        HStack(spacing: 8) {
                            Text(lang.t("Loslegen"))
                                .font(.system(size: 17, weight: .black))
                                .tracking(-0.6)
                            Image(systemName: "arrow.right")
                                .font(.system(size: 15, weight: .bold))
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .background(FrigyBrand.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 28))
                        .shadow(color: FrigyBrand.primaryDark.opacity(0.25), radius: 16, y: 8)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 24)

                    if let signIn = onSignIn {
                        Button(action: signIn) {
                            Text(lang.t("Bereits ein Konto? Anmelden"))
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(FrigyBrand.textMuted)
                                .tracking(-0.3)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.bottom, max(32, 16))
            }
        }
        .opacity(opacity)
        .onAppear {
            withAnimation(.easeOut(duration: 0.45)) {
                opacity = 1
                mascotOffset = 0
                textOffset = 0
            }
        }
    }
}

// MARK: - Language picker sheet

private struct SplashLanguagePickerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var lang

    var body: some View {
        NavigationStack {
            List {
                ForEach(AppLanguage.allCases) { language in
                    Button {
                        lang.choose(language)
                        dismiss()
                    } label: {
                        HStack(spacing: 14) {
                            Text(language.flag)
                                .font(.system(size: 26))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(language.displayName)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.primary)
                                Text(language.germanName)
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            if lang.language == language {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(FrigyBrand.primaryDark)
                                    .font(.system(size: 20))
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .listStyle(.plain)
            .navigationTitle(lang.t("Sprache wählen"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(lang.t("Schließen")) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Floating mascot

private struct MascotFloatingView: View {
    @State private var floatOffset = 0.0

    var body: some View {
        Image("FrigyMascot")
            .resizable()
            .scaledToFit()
            .padding(24)
            .shadow(color: Color(hex: "#2E7D32").opacity(0.16), radius: 45, y: 30)
            .offset(y: floatOffset)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 5)
                    .repeatForever(autoreverses: true)
                ) {
                    floatOffset = -8
                }
            }
    }
}
