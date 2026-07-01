import SwiftUI
import UserNotifications

/// Native paywall — matches the web app's OnboardingPaywallStep design:
/// scrollable header (trial timeline OR feature list) + fixed bottom sheet
/// (plan cards → commitment row → CTA → restore → legal footer).
///
/// After a successful monthly-trial purchase a local notification is scheduled
/// for day 2 of the trial reminding the user before they are charged.
struct PaywallStepView: View {
    let onBack: (() -> Void)?
    let onNext: () -> Void

    @Environment(AppRouter.self) private var router
    @Environment(LanguageManager.self) private var lang

    @State private var packages: [SubscriptionPackage] = []
    @State private var selectedId: String = "monthly"
    @State private var isPurchasing = false
    @State private var isRestoring = false
    @State private var packagesLoading = true
    @State private var showTerms = false
    @State private var showPrivacy = false
    @State private var restoreAlertMessage: String?
    @State private var purchaseErrorMessage: String?
    @State private var showCelebration = false

    // MARK: - Derived state

    private var monthlyPkg: SubscriptionPackage? { packages.first { !$0.isYearly } }
    private var yearlyPkg:  SubscriptionPackage? { packages.first {  $0.isYearly } }
    private var selectedPkg: SubscriptionPackage? { packages.first { $0.id == selectedId } }
    private var isMonthly: Bool {
        if packages.isEmpty { return selectedId != "yearly" }
        return selectedPkg?.isYearly == false
    }

    // Determined from the App Store account's real intro-offer eligibility (see
    // `.task` below) — showing trial terms to an already-used-trial account would
    // misstate pricing right at the point of purchase (App Review Guideline 3.1.2).
    @State private var trialEligible = true
    private var showTrialTimeline: Bool { isMonthly && trialEligible }

    private var billingDate: String {
        let d = Calendar.current.date(byAdding: .day, value: 3, to: Date()) ?? Date()
        let f = DateFormatter()
        f.locale = lang.locale
        f.dateStyle = .long
        return f.string(from: d)
    }

    private var footerPriceText: String {
        if isMonthly {
            let p = monthlyPkg?.priceString ?? "—"
            return trialEligible
                ? lang.t("3 Tage kostenlos, danach %@").replacingOccurrences(of: "%@", with: p)
                : lang.t("Nur %@ pro Monat").replacingOccurrences(of: "%@", with: p)
        }
        return lang.t("Jährlich – %@").replacingOccurrences(of: "%@", with: yearlyPkg?.priceString ?? "—")
    }

    // MARK: - Body

    var body: some View {
        ZStack {
            FrigyGlassBackground().ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Back button row
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

                    Spacer().frame(height: 16)

                    // Title switches with plan selection
                    Text(showTrialTimeline
                         ? lang.t("Starte deine 3-tägige\nKOSTENLOSE Testphase")
                         : lang.t("Schalte Frigy frei, um deine\nZiele schneller zu erreichen"))
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 28)

                    Spacer().frame(height: 28)

                    // Timeline (monthly + trial) or feature list — a plain crossfade
                    // instead of a sliding move transition, which fought the ScrollView
                    // and caused the content to jump/snap while scrolling.
                    Group {
                        if showTrialTimeline {
                            trialTimelineSection
                        } else {
                            featuresSection
                        }
                    }
                    .transition(.opacity)

                    Spacer().frame(height: 24)
                }
            }
            // Reserve space for the bottom bar so the ScrollView knows its true content
            // area — content is always reachable and there is no empty spacer to
            // rubber-band against.
            .safeAreaInset(edge: .bottom, spacing: 0) {
                bottomBar
            }

            if showCelebration {
                PremiumCelebrationView(isYearly: selectedPkg?.isYearly ?? false) {
                    onNext()
                }
                .transition(.opacity)
                .zIndex(10)
            }
        }
        .sheet(isPresented: $showTerms) {
            AGBView()
        }
        .sheet(isPresented: $showPrivacy) {
            PrivacyView()
        }
        .alert(lang.t("Käufe wiederherstellen"), isPresented: Binding(
            get: { restoreAlertMessage != nil },
            set: { if !$0 { restoreAlertMessage = nil } }
        )) {
            Button(lang.t("OK"), role: .cancel) { restoreAlertMessage = nil }
        } message: {
            Text(restoreAlertMessage ?? "")
        }
        .alert(lang.t("Kauf fehlgeschlagen"), isPresented: Binding(
            get: { purchaseErrorMessage != nil },
            set: { if !$0 { purchaseErrorMessage = nil } }
        )) {
            Button(lang.t("OK"), role: .cancel) { purchaseErrorMessage = nil }
        } message: {
            Text(purchaseErrorMessage ?? "")
        }
        .task {
            // Link the store identity to this Supabase user BEFORE any purchase, so the
            // entitlement attaches to the right account and the backend recognizes it.
            if let session = try? await router.authService.currentSession() {
                await router.subscriptionService.identify(userId: session.userId)

                // Dev/tester account — skip paywall entirely.
                if router.isPaywallBypassed(for: session.email) {
                    router.isPremium = true
                    onNext()
                    return
                }
            }

            packagesLoading = true
            packages = await router.subscriptionService.availablePackages()
            // If user already explicitly tapped "Jährlich" during loading, resolve to
            // the real package id and keep it selected. Otherwise default to monthly.
            let userPickedYearly = selectedId == "yearly"
            if userPickedYearly {
                if let yPkg = packages.first(where: { $0.isYearly }) { selectedId = yPkg.id }
            } else {
                if let first = packages.first(where: { !$0.isYearly }) {
                    selectedId = first.id
                } else if let first = packages.first {
                    selectedId = first.id
                }
            }
            packagesLoading = false

            if let monthly = monthlyPkg {
                trialEligible = await router.subscriptionService.isTrialEligible(for: monthly)
            }
        }
    }

    // MARK: - Trial Timeline

    private var trialTimelineSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            timelineStep(
                icon: "lock.fill",
                title: lang.t("Heute"),
                desc: lang.t("Alle Premium-Funktionen freischalten – KI-Scan, Tracker und mehr"),
                isLast: false
            )
            timelineStep(
                icon: "bell.fill",
                title: lang.t("In 2 Tagen – Erinnerung"),
                desc: lang.t("Wir erinnern dich, dass deine Testphase bald endet"),
                isLast: false
            )
            timelineStep(
                icon: "crown.fill",
                title: lang.t("In 3 Tagen – Abrechnung"),
                desc: lang.t("Abrechnung am %@, sofern du nicht vorher kündigst").replacingOccurrences(of: "%@", with: billingDate),
                isLast: true
            )
        }
        .padding(.horizontal, 24)
    }

    private func timelineStep(icon: String, title: String, desc: String, isLast: Bool) -> some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(FrigyBrand.text)
                }
                if !isLast {
                    Rectangle()
                        .fill(LinearGradient(
                            colors: [FrigyBrand.primaryDark, FrigyBrand.cardBorder],
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
                    .foregroundColor(FrigyBrand.text)
                Text(desc)
                    .font(.system(size: 14))
                    .foregroundColor(FrigyBrand.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.bottom, isLast ? 0 : 28)

            Spacer()
        }
    }

    // MARK: - Yearly savings section

    private var featuresSection: some View {
        VStack(spacing: 16) {
            // Feature list
            VStack(spacing: 14) {
                ForEach([
                    ("checkmark.circle.fill", lang.t("Alle Premium-Funktionen"), lang.t("KI-Scan, Tracker, Wochenpläne & mehr")),
                    ("arrow.clockwise.circle.fill", lang.t("Jederzeit kündbar"), lang.t("Über deine App-Store-Einstellungen")),
                    ("lock.shield.fill", lang.t("Sichere Zahlung"), lang.t("Abrechnung über deinen App-Store-Account")),
                ], id: \.0) { icon, title, desc in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: icon)
                            .font(.system(size: 22))
                            .foregroundColor(FrigyBrand.primaryDark)
                            .frame(width: 28)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(title)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            Text(desc)
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)
                        }
                        Spacer()
                    }
                }
            }
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 0) {
            LinearGradient(
                colors: [Color(UIColor.systemBackground).opacity(0), Color(UIColor.systemBackground)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 24)
            .allowsHitTesting(false)

            VStack(spacing: 0) {
                // 2-column plan cards
                HStack(spacing: 12) {
                    planCard(pkg: monthlyPkg, fallbackId: "monthly",
                             title: lang.t("Monatlich"), showBadge: trialEligible)
                    planCard(pkg: yearlyPkg,  fallbackId: "yearly",
                             title: lang.t("Jährlich"),  showBadge: false)
                }

                // Commitment row — "no payment now" for trial, "cancel anytime" for yearly
                HStack(spacing: 8) {
                    Image(systemName: "checkmark")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(FrigyBrand.primaryDeep)
                    Text(showTrialTimeline
                         ? lang.t("Keine Zahlung jetzt fällig")
                         : lang.t("Keine Bindung – jederzeit kündbar"))
                        .font(.system(size: 15))
                        .foregroundColor(FrigyBrand.text)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 16)
                .animation(.easeInOut(duration: 0.2), value: showTrialTimeline)

                // CTA
                Button {
                    guard let pkg = selectedPkg else { return }
                    isPurchasing = true
                    Task {
                        do {
                            let ok = try await router.subscriptionService.purchase(pkg)
                            isPurchasing = false
                            if ok {
                                router.isPremium = true
                                // Schedule a local reminder on day 2 of a monthly trial so the
                                // user is notified before they are charged on day 3.
                                if !pkg.isYearly {
                                    scheduleTrialReminderNotification()
                                }
                                // Show the celebration screen first; "Los geht's" then advances.
                                withAnimation(.easeOut(duration: 0.25)) { showCelebration = true }
                            }
                            // !ok means the user cancelled the payment sheet — stay on the
                            // paywall silently, no error (that's expected behavior).
                        } catch {
                            isPurchasing = false
                            purchaseErrorMessage = lang.t(error.localizedDescription)
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        if isPurchasing {
                            ProgressView().tint(FrigyBrand.text).scaleEffect(0.85)
                        }
                        Text(isPurchasing
                             ? lang.t("Wird verarbeitet…")
                             : showTrialTimeline ? lang.t("3-tägige Testphase starten") : lang.t("Loslegen"))
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(LinearGradient(
                                colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .shadow(color: FrigyBrand.primaryDark.opacity(0.5), radius: 17, x: 0, y: 8)
                    )
                }
                .buttonStyle(.plain)
                .disabled(isPurchasing || isRestoring || selectedPkg == nil)
                .padding(.top, 16)

                // Restore + Redeem row
                HStack(spacing: 24) {
                    Button {
                        isRestoring = true
                        Task {
                            do {
                                let ok = try await router.subscriptionService.restorePurchases()
                                isRestoring = false
                                if ok {
                                    router.isPremium = true
                                    UNUserNotificationCenter.current()
                                        .removePendingNotificationRequests(withIdentifiers: ["frigy.trial.day2"])
                                    withAnimation(.easeOut(duration: 0.25)) { showCelebration = true }
                                } else {
                                    // Restore ran but found no active entitlement — always
                                    // give feedback (Apple requires it; silent = broken UX).
                                    restoreAlertMessage = lang.t("Keine aktiven Käufe gefunden. Falls du Frigy Premium hast, melde dich mit derselben Apple-ID an, mit der du gekauft hast.")
                                }
                            } catch {
                                isRestoring = false
                                restoreAlertMessage = lang.t("Wiederherstellung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.")
                            }
                        }
                    } label: {
                        Group {
                            if isRestoring {
                                ProgressView().progressViewStyle(.circular).scaleEffect(0.8)
                            } else {
                                Text(lang.t("Käufe wiederherstellen"))
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(FrigyBrand.text)
                                    .underline()
                            }
                        }
                        .frame(height: 40)
                    }
                    .buttonStyle(.plain)

                    Text("·")
                        .foregroundColor(FrigyBrand.textMuted)
                        .font(.system(size: 14))

                    Button {
                        router.subscriptionService.redeemOfferCode()
                    } label: {
                        Text(lang.t("Code einlösen"))
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                            .underline()
                            .frame(height: 40)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 4)

                // Legal footer
                VStack(spacing: 6) {
                    Divider().padding(.top, 8)
                    if let pkg = selectedPkg {
                        Text(lang.t("Frigy Premium · %1@ · %2@")
                            .replacingOccurrences(of: "%1@", with: pkg.isYearly ? lang.t("Jahresabo (1 Jahr)") : lang.t("Monatsabo (1 Monat)"))
                            .replacingOccurrences(of: "%2@", with: pkg.priceString))
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                    }
                    Text(lang.t("Das Abo verlängert sich automatisch, bis du es mindestens 24 Stunden vor Periodenende in den Einstellungen deines App-Store-Kontos kündigst. Die Zahlung wird bei Bestätigung über dein Store-Konto abgebucht."))
                        .font(.system(size: 11))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                    Text(footerPriceText)
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)

                    // Legal links — required by App Review (Guideline 3.1.2) for
                    // auto-renewable subscriptions: functional Terms (EULA) and
                    // Privacy Policy links right where the purchase happens.
                    HStack(spacing: 6) {
                        Button(lang.t("Nutzungsbedingungen")) { showTerms = true }
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                        Text("·")
                            .font(.system(size: 11))
                            .foregroundColor(FrigyBrand.textMuted)
                        Button(lang.t("Datenschutz")) { showPrivacy = true }
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(FrigyBrand.primaryDark)
                    }
                    .buttonStyle(.plain)
                    .padding(.bottom, 4)
                }
                .padding(.top, 4)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
            .background(Color(UIColor.systemBackground))
            .shadow(color: .black.opacity(0.1), radius: 24, x: 0, y: -8)
        }
        .background(Color(UIColor.systemBackground))
    }

    // MARK: - Plan Card

    private func planCard(pkg: SubscriptionPackage?, fallbackId: String, title: String, showBadge: Bool) -> some View {
        let id = pkg?.id ?? fallbackId
        let selected = selectedId == id
        return Button {
            withAnimation(.easeInOut(duration: 0.15)) { selectedId = id }
        } label: {
            ZStack(alignment: .top) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(FrigyBrand.text)

                        if packagesLoading {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(hex: "#E5E7EB"))
                                .frame(width: 72, height: 17)
                                .shimmering()
                        } else {
                            // For the yearly plan show the MONTHLY equivalent as the
                            // headline figure (not the annual total), with the annual
                            // billing shown as a small subtitle underneath.
                            let isYearlyCard = pkg?.isYearly == true
                            let headline = (isYearlyCard ? pkg?.pricePerMonthString : pkg?.priceString) ?? pkg?.priceString ?? "—"
                            HStack(alignment: .firstTextBaseline, spacing: 2) {
                                Text(headline)
                                    .font(.system(size: 17, weight: .bold))
                                    .foregroundColor(FrigyBrand.text)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                                Text(lang.t("/ Monat"))
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(FrigyBrand.textMuted)
                            }
                            if isYearlyCard, let annual = pkg?.priceString {
                                Text(lang.t("%@ / Jahr").replacingOccurrences(of: "%@", with: annual))
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(FrigyBrand.primaryDeep)
                            }
                        }
                    }

                    Spacer()

                    // Radio button
                    ZStack {
                        Circle()
                            .stroke(selected ? FrigyBrand.primaryDark : FrigyBrand.cardBorder, lineWidth: 2)
                            .frame(width: 22, height: 22)
                        if selected {
                            Circle().fill(FrigyBrand.primaryDark).frame(width: 14, height: 14)
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
                .background(Color(UIColor.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(selected ? FrigyBrand.primaryDark : FrigyBrand.cardBorder, lineWidth: selected ? 1.5 : 1)
                )
                .shadow(color: selected ? FrigyBrand.primary.opacity(0.4) : .clear, radius: 12, y: 4)

                if showBadge {
                    Text(lang.t("3 TAGE KOSTENLOS"))
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(FrigyBrand.primaryDeep))
                        .offset(y: -10)
                }
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Notifications

    /// Schedules a local notification for day 2 of the monthly trial reminding the user
    /// that they will be charged tomorrow unless they cancel.
    private func scheduleTrialReminderNotification() {
        Task {
            let center = UNUserNotificationCenter.current()
            let settings = await center.notificationSettings()

            switch settings.authorizationStatus {
            case .authorized, .provisional:
                addTrialReminderRequest(to: center)
            case .notDetermined:
                let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
                if granted { addTrialReminderRequest(to: center) }
            default:
                break  // denied — iOS silently ignores further requests, skip
            }
        }
    }

    private func addTrialReminderRequest(to center: UNUserNotificationCenter) {
        center.removePendingNotificationRequests(withIdentifiers: ["frigy.trial.day2"])
        let content = UNMutableNotificationContent()
        content.title = lang.t("⏰ Testphase endet morgen!")
        content.body = lang.t("Deine kostenlose Testphase endet morgen. Kündige jetzt in den App-Store-Einstellungen, wenn du nicht abgerechnet werden möchtest.")
        content.sound = .default

        var fireComponents = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        fireComponents.day = (fireComponents.day ?? 0) + 2
        fireComponents.hour = 9; fireComponents.minute = 0; fireComponents.second = 0

        let trigger: UNNotificationTrigger
        if let fireDate = Calendar.current.date(from: fireComponents) {
            trigger = UNTimeIntervalNotificationTrigger(
                timeInterval: max(60, fireDate.timeIntervalSinceNow), repeats: false)
        } else {
            trigger = UNTimeIntervalNotificationTrigger(timeInterval: 48 * 3600, repeats: false)
        }

        center.add(UNNotificationRequest(identifier: "frigy.trial.day2", content: content, trigger: trigger))
    }
}

// MARK: - Shimmer modifier for loading skeleton

private extension View {
    func shimmering() -> some View {
        self.overlay(
            LinearGradient(
                colors: [
                    Color.white.opacity(0),
                    Color.white.opacity(0.6),
                    Color.white.opacity(0),
                ],
                startPoint: .leading,
                endPoint: .trailing
            )
            .rotationEffect(.degrees(20))
        )
    }
}
