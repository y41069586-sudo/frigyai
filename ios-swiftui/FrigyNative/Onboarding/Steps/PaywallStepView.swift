import SwiftUI

struct PaywallStepView: View {
    let onNext: () -> Void

    @Environment(AppRouter.self) private var router

    @State private var isLoadingRestore = false
    @State private var packages: [SubscriptionPackage] = []
    @State private var selectedPackageId: String?
    @State private var isPurchasing = false

    private var selectedPackage: SubscriptionPackage? {
        packages.first { $0.id == selectedPackageId } ?? packages.first
    }

    private var legalText: String {
        if let pkg = selectedPackage {
            return "Das Abo verlängert sich automatisch um 1 \(pkg.period) zum Preis von \(pkg.priceString), bis du es mindestens 24 Stunden vor Ende des jeweiligen Abozeitraums im App Store kündigst."
        }
        return "Das Abo verlängert sich automatisch, bis du es mindestens 24 Stunden vor Ende des jeweiligen Abozeitraums im App Store kündigst."
    }

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

                    // Pricing options (store-localized via RevenueCat)
                    VStack(spacing: 10) {
                        ForEach(packages) { pkg in
                            packageCard(pkg)
                        }
                    }
                    .padding(.horizontal, 24)

                    // Subscribe CTA — purchases the selected package
                    Button {
                        guard let pkg = selectedPackage else { return }
                        isPurchasing = true
                        Task {
                            let ok = (try? await router.subscriptionService.purchase(pkg)) ?? false
                            if ok { router.isPremium = true }
                            isPurchasing = false
                            if ok { onNext() }
                        }
                    } label: {
                        HStack(spacing: 8) {
                            if isPurchasing { ProgressView().tint(.white) }
                            Text(isPurchasing ? "Wird verarbeitet…" : "Premium freischalten")
                                .font(.system(size: 16, weight: .bold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(FrigyBrand.buttonGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                    }
                    .buttonStyle(.plain)
                    .disabled(isPurchasing || selectedPackage == nil)
                    .padding(.horizontal, 24)

                    // Legal + Restore
                    VStack(spacing: 4) {
                        Text(legalText)
                            .font(.system(size: 11))
                            .foregroundColor(FrigyBrand.textMuted.opacity(0.8))
                            .multilineTextAlignment(.center)

                        Button {
                            isLoadingRestore = true
                            Task {
                                let ok = (try? await router.subscriptionService.restorePurchases()) ?? false
                                if ok { router.isPremium = true }
                                isLoadingRestore = false
                                if ok { onNext() }
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
                    .padding(.bottom, 32)
                }
            }
        }
        .task {
            packages = await router.subscriptionService.availablePackages()
            // Default to the yearly plan when available (best value).
            selectedPackageId = (packages.first { $0.isYearly } ?? packages.first)?.id
        }
    }

    // MARK: - Package card

    @ViewBuilder private func packageCard(_ pkg: SubscriptionPackage) -> some View {
        let selected = (selectedPackageId ?? selectedPackage?.id) == pkg.id
        Button {
            selectedPackageId = pkg.id
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .stroke(selected ? FrigyBrand.primaryDark : FrigyBrand.cardBorder, lineWidth: 2)
                        .frame(width: 22, height: 22)
                    if selected {
                        Circle().fill(FrigyBrand.primaryDark).frame(width: 12, height: 12)
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(pkg.title)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                        if pkg.isYearly {
                            Text("Beliebt")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 8).padding(.vertical, 3)
                                .background(Capsule().fill(FrigyBrand.primaryDark))
                        }
                    }
                    Text("\(pkg.priceString) / \(pkg.period)")
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                }
                Spacer()
            }
            .padding(16)
            .background(selected ? FrigyBrand.selectedBg : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(selected ? FrigyBrand.borderMint : FrigyBrand.cardBorder.opacity(0.6),
                            lineWidth: selected ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
