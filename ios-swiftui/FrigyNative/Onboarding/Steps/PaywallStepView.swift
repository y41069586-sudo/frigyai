import SwiftUI

struct PaywallStepView: View {
    let onNext: () -> Void

    @Environment(AppRouter.self) private var router

    @State private var isLoadingRestore = false

    private let features = [
        ("waveform.path.ecg", "Unbegrenzte KI-Mahlzeiten-Analyse"),
        ("camera.fill",        "Kühlschrank-Scan & Rezeptvorschläge"),
        ("calendar",           "Personalisierte Wochenpläne"),
        ("chart.line.uptrend.xyaxis", "Detaillierte Fortschrittstracking"),
        ("bubble.left.and.bubble.right.fill", "KI-Ernährungscoach, 24/7"),
    ]

    var body: some View {
        ZStack {
            FrigyBrand.bg.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    Spacer().frame(height: 40)

                    // Badge
                    HStack(spacing: 6) {
                        Image(systemName: "crown.fill")
                            .foregroundColor(Color(hex: "#F59E0B"))
                        Text("Frigy Premium")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(hex: "#F59E0B"))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color(hex: "#FFFBEB"))
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color(hex: "#FCD34D"), lineWidth: 1))

                    VStack(spacing: 8) {
                        Text("Erreiche dein Ziel")
                            .font(.system(size: 28, weight: .black))
                            .foregroundColor(FrigyBrand.text)
                        Text("mit wissenschaftlich fundierter KI-Ernährung")
                            .font(.system(size: 15))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                    }

                    // Feature list
                    VStack(spacing: 10) {
                        ForEach(features, id: \.0) { (icon, label) in
                            HStack(spacing: 12) {
                                ZStack {
                                    Circle()
                                        .fill(FrigyBrand.primary.opacity(0.2))
                                        .frame(width: 36, height: 36)
                                    Image(systemName: icon)
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(FrigyBrand.primaryDeep)
                                }
                                Text(label)
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundColor(FrigyBrand.text)
                                Spacer()
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                    }
                    .padding(.horizontal, 24)

                    // Pricing card
                    VStack(spacing: 6) {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("€4,99")
                                .font(.system(size: 32, weight: .black, design: .rounded))
                                .foregroundColor(FrigyBrand.text)
                            Text("/ Monat")
                                .font(.system(size: 16))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                        Text("7 Tage gratis testen")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .background(FrigyBrand.selectedBg)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(FrigyBrand.borderMint, lineWidth: 1.5))
                    .padding(.horizontal, 24)

                    // Subscribe CTA
                    OnboardingContinueButton("Jetzt 7 Tage gratis testen", action: onNext)
                        .padding(.horizontal, 24)

                    // Legal
                    VStack(spacing: 4) {
                        Text("Das Abo verlängert sich automatisch um 1 Monat zum Preis von €4,99 / Monat, bis du es mindestens 24 Stunden vor dem Ende des jeweiligen Abozeitraums im App Store kündigst.")
                            .font(.system(size: 11))
                            .foregroundColor(FrigyBrand.textMuted.opacity(0.8))
                            .multilineTextAlignment(.center)

                        Button {
                            isLoadingRestore = true
                            Task {
                                _ = try? await router.subscriptionService.restorePurchases()
                                isLoadingRestore = false
                                onNext()
                            }
                        } label: {
                            if isLoadingRestore {
                                ProgressView().progressViewStyle(.circular)
                            } else {
                                Text("Käufe wiederherstellen")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(FrigyBrand.primaryDark)
                                    .underline()
                            }
                        }
                        .padding(.top, 4)
                    }
                    .padding(.horizontal, 24)

                    // Skip
                    Button {
                        onNext()
                    } label: {
                        Text("Nicht jetzt")
                            .font(.system(size: 14))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .padding(.bottom, 32)
                }
            }
        }
    }
}
