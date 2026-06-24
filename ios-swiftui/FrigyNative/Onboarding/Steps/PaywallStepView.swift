import SwiftUI

/// Native paywall — matches the web app's OnboardingPaywallStep design:
/// scrollable header (trial timeline OR feature list) + fixed bottom sheet
/// (plan cards → "no commitment" row → CTA → restore → legal footer).
struct PaywallStepView: View {
    let onNext: () -> Void

    @Environment(AppRouter.self) private var router

    @State private var packages: [SubscriptionPackage] = []
    @State private var selectedId: String = "monthly"
    @State private var isPurchasing = false
    @State private var isRestoring = false
    @State private var packagesLoading = true

    // MARK: - Helpers

    private var monthlyPkg: SubscriptionPackage? { packages.first { !$0.isYearly } }
    private var yearlyPkg:  SubscriptionPackage? { packages.first {  $0.isYearly } }
    private var selectedPkg: SubscriptionPackage? { packages.first { $0.id == selectedId } }
    private var isMonthly: Bool { selectedPkg?.isYearly == false || packages.isEmpty }

    private let trialEligible = true
    private var showTrialTimeline: Bool { isMonthly && trialEligible }

    private var billingDate: String {
        let d = Calendar.current.date(byAdding: .day, value: 3, to: Date()) ?? Date()
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateStyle = .long
        return f.string(from: d)
    }

    private var footerPriceText: String {
        if isMonthly {
            let p = monthlyPkg?.priceString ?? "—"
            return trialEligible ? "3 Tage kostenlos, danach \(p)" : "Nur \(p) pro Monat"
        }
        return "Jährlich – \(yearlyPkg?.priceString ?? "—")"
    }

    // MARK: - Colors

    private let primary      = Color(hex: "#75FBB2")
    private let primaryDark  = Color(hex: "#39D47F")
    private let primaryDeep  = Color(hex: "#2EB56D")
    private let textMain     = Color(hex: "#1F2937")
    private let textSub      = Color(hex: "#374151")
    private let textMuted    = Color(hex: "#6B7280")
    private let textFaint    = Color(hex: "#9CA3AF")
    private let borderIdle   = Color(hex: "#BCFDDC")

    // MARK: - Body

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.white.ignoresSafeArea()

            // Scrollable header
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    Spacer().frame(height: 52)

                    // Title — animates when plan toggles
                    Text(showTrialTimeline
                         ? "Starte deine 3-tägige\nKOSTENLOSE Testphase"
                         : "Schalte Frigy frei, um deine\nZiele schneller zu erreichen")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(textMain)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 28)
                        .animation(.easeInOut(duration: 0.22), value: showTrialTimeline)
                        .id(showTrialTimeline) // force re-render for transition

                    Spacer().frame(height: 28)

                    if showTrialTimeline {
                        trialTimelineSection
                            .transition(.asymmetric(
                                insertion: .move(edge: .trailing).combined(with: .opacity),
                                removal:   .move(edge: .leading).combined(with: .opacity)
                            ))
                    } else {
                        featuresSection
                            .transition(.asymmetric(
                                insertion: .move(edge: .leading).combined(with: .opacity),
                                removal:   .move(edge: .trailing).combined(with: .opacity)
                            ))
                    }

                    // Spacer so content doesn't hide under bottom bar
                    Spacer().frame(height: 320)
                }
            }

            // Fixed bottom bar
            bottomBar
        }
        .task {
            packagesLoading = true
            packages = await router.subscriptionService.availablePackages()
            // Default to monthly (first non-yearly), matching web app behaviour
            if let first = packages.first(where: { !$0.isYearly }) {
                selectedId = first.id
            } else if let first = packages.first {
                selectedId = first.id
            }
            packagesLoading = false
        }
    }

    // MARK: - Trial Timeline

    private var trialTimelineSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            timelineStep(icon: "lock.fill",  title: "Heute",
                         desc: "Alle Premium-Funktionen freischalten – KI-Scan, Tracker und mehr",
                         isLast: false)
            timelineStep(icon: "bell.fill",  title: "In 2 Tagen – Erinnerung",
                         desc: "Wir erinnern dich, dass deine Testphase bald endet",
                         isLast: false)
            timelineStep(icon: "crown.fill", title: "In 3 Tagen – Abrechnung",
                         desc: "Abrechnung am \(billingDate), sofern du nicht vorher kündigst",
                         isLast: true)
        }
        .padding(.horizontal, 24)
    }

    private func timelineStep(icon: String, title: String, desc: String, isLast: Bool) -> some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [primary, primaryDark],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(textMain)
                }
                if !isLast {
                    Rectangle()
                        .fill(LinearGradient(
                            colors: [primaryDark, borderIdle],
                            startPoint: .top,
                            endPoint: .bottom
                        ))
                        .frame(width: 2, height: 44)
                        .padding(.vertical, 4)
                }
            }

            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(textMain)
                Text(desc)
                    .font(.system(size: 14))
                    .foregroundColor(textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.bottom, isLast ? 0 : 28)

            Spacer()
        }
    }

    // MARK: - Features

    private var featuresSection: some View {
        let feats: [(String, String)] = [
            ("Einfaches Food-Scanning",              "Tracke deine Kalorien mit nur einem Bild"),
            ("Erreiche deine Ziele Schritt für Schritt", "Klare Mahlzeiten und Makros – ohne medizinische Versprechen"),
            ("Verfolge deinen Fortschritt",           "Bleib auf Kurs mit personalisierten Einblicken"),
        ]
        return VStack(spacing: 18) {
            ForEach(feats, id: \.0) { (title, desc) in
                HStack(alignment: .top, spacing: 12) {
                    ZStack {
                        Circle().fill(primary).frame(width: 28, height: 28)
                        Image(systemName: "checkmark")
                            .font(.system(size: 13, weight: .black))
                            .foregroundColor(textMain)
                    }
                    .padding(.top, 1)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(textMain)
                        Text(desc)
                            .font(.system(size: 14))
                            .foregroundColor(textMuted)
                    }
                    Spacer()
                }
            }
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 0) {
            // Fade in from scroll
            LinearGradient(
                colors: [Color.white.opacity(0), Color.white],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 24)
            .allowsHitTesting(false)

            VStack(spacing: 0) {
                // Plan cards 2-column
                HStack(spacing: 12) {
                    planCard(pkg: monthlyPkg, fallbackId: "monthly",
                             title: "Monatlich", showBadge: trialEligible)
                    planCard(pkg: yearlyPkg,  fallbackId: "yearly",
                             title: "Jährlich",  showBadge: false)
                }

                // "No commitment" row
                HStack(spacing: 8) {
                    Image(systemName: "checkmark")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(primaryDeep)
                    Text(showTrialTimeline
                         ? "Keine Zahlung jetzt fällig"
                         : "Keine Bindung – jederzeit kündbar")
                        .font(.system(size: 15))
                        .foregroundColor(textMain)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 16)

                // CTA button
                Button {
                    guard let pkg = selectedPkg else { return }
                    isPurchasing = true
                    Task {
                        let ok = (try? await router.subscriptionService.purchase(pkg)) ?? false
                        if ok { router.isPremium = true }
                        isPurchasing = false
                        if ok { onNext() }
                    }
                } label: {
                    HStack(spacing: 8) {
                        if isPurchasing {
                            ProgressView().tint(textMain).scaleEffect(0.85)
                        }
                        Text(isPurchasing
                             ? "Wird verarbeitet…"
                             : showTrialTimeline ? "3-tägige Testphase starten" : "Loslegen")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(textMain)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(LinearGradient(
                                colors: [primary, primaryDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .shadow(color: primaryDark.opacity(0.5), radius: 17, x: 0, y: 8)
                    )
                }
                .buttonStyle(.plain)
                .disabled(isPurchasing || isRestoring || selectedPkg == nil)
                .padding(.top, 16)

                // Restore
                Button {
                    isRestoring = true
                    Task {
                        let ok = (try? await router.subscriptionService.restorePurchases()) ?? false
                        if ok { router.isPremium = true; onNext() }
                        isRestoring = false
                    }
                } label: {
                    Group {
                        if isRestoring {
                            ProgressView().progressViewStyle(.circular).scaleEffect(0.8)
                        } else {
                            Text("Käufe wiederherstellen")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(textSub)
                                .underline()
                        }
                    }
                    .frame(height: 40)
                }
                .buttonStyle(.plain)
                .padding(.top, 4)

                // Legal footer
                VStack(spacing: 6) {
                    Divider().padding(.top, 8)
                    if let pkg = selectedPkg {
                        Text("Frigy Premium · \(pkg.isYearly ? "Jahresabo (1 Jahr)" : "Monatsabo (1 Monat)") · \(pkg.priceString)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(textMuted)
                            .multilineTextAlignment(.center)
                    }
                    Text("Das Abo verlängert sich automatisch, bis du es mindestens 24 Stunden vor Periodenende in den Einstellungen deines App-Store-Kontos kündigst. Die Zahlung wird bei Bestätigung über dein Store-Konto abgebucht.")
                        .font(.system(size: 11))
                        .foregroundColor(textFaint)
                        .multilineTextAlignment(.center)
                    Text(footerPriceText)
                        .font(.system(size: 13))
                        .foregroundColor(textFaint)
                        .padding(.bottom, 4)
                }
                .padding(.top, 4)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
            .background(Color.white)
            .shadow(color: .black.opacity(0.1), radius: 24, x: 0, y: -8)
        }
        .background(Color.white)
    }

    // MARK: - Plan Card

    private func planCard(pkg: SubscriptionPackage?, fallbackId: String, title: String, showBadge: Bool) -> some View {
        let id = pkg?.id ?? fallbackId
        let selected = selectedId == id
        return Button {
            withAnimation(.easeInOut(duration: 0.15)) { selectedId = id }
        } label: {
            ZStack(alignment: .top) {
                // Card body
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(title)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(textSub)

                        if packagesLoading {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(hex: "#E5E7EB"))
                                .frame(width: 72, height: 17)
                        } else {
                            Text(pkg?.priceString ?? "—")
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(textMain)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                    }

                    Spacer()

                    // Radio
                    ZStack {
                        Circle()
                            .stroke(selected ? primaryDark : borderIdle, lineWidth: 2)
                            .frame(width: 22, height: 22)
                        if selected {
                            Circle()
                                .fill(primaryDark)
                                .frame(width: 14, height: 14)
                            Image(systemName: "checkmark")
                                .font(.system(size: 8, weight: .black))
                                .foregroundColor(.white)
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 12)
                .padding(.top, showBadge ? 20 : 16)
                .frame(maxWidth: .infinity, minHeight: 88)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(selected ? primaryDark : borderIdle, lineWidth: selected ? 1.5 : 1)
                )
                .shadow(color: selected ? primary.opacity(0.4) : .clear, radius: 12, y: 4)

                // Trial badge (monthly only)
                if showBadge {
                    Text("3 TAGE KOSTENLOS")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(primaryDeep))
                        .offset(y: -10)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
