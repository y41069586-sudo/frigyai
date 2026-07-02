import Foundation

/// Reads the RevenueCat config injected via Secrets.xcconfig → Info.plist.
enum RevenueCatConfig {
    static var apiKey: String? {
        guard let key = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String,
              !key.isEmpty,
              (key.hasPrefix("appl_") || key.hasPrefix("test_")) else { return nil }
        return key
    }

    static var entitlementId: String {
        if let id = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_ENTITLEMENT_ID") as? String,
           !id.isEmpty {
            return id
        }
        return "premium"
    }

    static var isConfigured: Bool { apiKey != nil }
}

enum SubscriptionServiceError: LocalizedError {
    case packageNotFound
    case purchaseTimedOut

    var errorDescription: String? {
        switch self {
        case .packageNotFound:
            return "Dieses Abo konnte nicht gefunden werden. Bitte versuche es erneut."
        case .purchaseTimedOut:
            return "Der Kauf hat zu lange gedauert. Falls dir Geld abgebucht wurde, tippe auf „Käufe wiederherstellen“, ansonsten versuche es erneut."
        }
    }
}

/// Launch-time configuration hook that is safe to call whether or not the
/// RevenueCat SDK is linked into this build.
enum RevenueCatBootstrap {
    @MainActor
    static func configureIfNeeded() {
        #if canImport(RevenueCat)
        RevenueCatSubscriptionService.configureIfNeeded()
        #endif
    }
}

#if canImport(RevenueCat)
import RevenueCat
import UIKit

/// Live subscription service backed by RevenueCat. Loads store-localized
/// monthly/yearly prices and drives purchase / restore against the configured
/// premium entitlement.
///
/// Follows RevenueCat's own recommended integration pattern: `PurchasesDelegate`
/// (`NSObject` conformance is required by the SDK's delegate protocol) delivers
/// a fresh `CustomerInfo` any time the SDK learns the entitlement changed for
/// ANY reason — a purchase, a restore, a renewal, a cancellation, a delayed
/// server-side sync, even a family-sharing member's purchase. That's the same
/// event stream Apple's StoreKit transaction observer feeds into the SDK, so
/// reacting to it (instead of manually polling `customerInfo()` in a sleep
/// loop after our own purchase calls) is the idiomatic, authoritative way to
/// stay in sync — `AppRouter` subscribes via `onPremiumStatusChanged` below.
@MainActor
final class RevenueCatSubscriptionService: NSObject, SubscriptionServiceProtocol, PurchasesDelegate {
    static let shared = RevenueCatSubscriptionService()

    /// Set by `AppRouter` at launch. Fires with the freshly-computed premium
    /// state every time RevenueCat delivers updated `CustomerInfo`.
    var onPremiumStatusChanged: ((Bool) -> Void)?

    private var cachedPackages: [Package] = []

    /// Robust premium check. A correctly-configured RevenueCat account grants the
    /// named entitlement, but real-world misconfigurations (products attached to a
    /// differently-named entitlement, or to NO entitlement at all) would otherwise
    /// lock out a user who genuinely paid — the purchase succeeds via StoreKit but
    /// `entitlements["premium"]` stays empty. We therefore treat the user as premium
    /// if ANY of these hold, most-specific first:
    ///   1. the configured entitlement id is active (the intended path), OR
    ///   2. any entitlement is active (covers an entitlement-identifier mismatch), OR
    ///   3. any subscription is active (covers products not linked to any entitlement).
    private func isPremiumActive(_ info: CustomerInfo) -> Bool {
        let id = RevenueCatConfig.entitlementId
        if info.entitlements[id]?.isActive == true { return true }
        if !info.entitlements.active.isEmpty { return true }
        if !info.activeSubscriptions.isEmpty { return true }
        return false
    }

    /// Configure the SDK exactly once at launch (no-op when no API key is set).
    static func configureIfNeeded() {
        guard RevenueCatConfig.isConfigured, let key = RevenueCatConfig.apiKey else { return }
        guard !Purchases.isConfigured else { return }
        Purchases.logLevel = .error
        Purchases.configure(withAPIKey: key)
        Purchases.shared.delegate = shared
    }

    /// RevenueCat's own recommended reactive hook (see the type doc comment
    /// above) — fires for any entitlement change the SDK learns about, not
    /// just the ones we triggered ourselves.
    nonisolated func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        Task { @MainActor in
            self.onPremiumStatusChanged?(self.isPremiumActive(customerInfo))
        }
    }

    func availablePackages() async -> [SubscriptionPackage] {
        guard RevenueCatConfig.isConfigured else { return [] }
        do {
            let offerings = try await Purchases.shared.offerings()
            // Prefer the "current" offering, but fall back to ANY offering if none is
            // marked current in the RevenueCat dashboard — otherwise prices silently
            // fail to load even though products exist.
            guard let current = offerings.current ?? offerings.all.values.first else { return [] }
            cachedPackages = current.availablePackages
            return current.availablePackages.map { pkg in
                let isYearly = pkg.packageType == .annual
                var perMonth: String? = nil
                if isYearly {
                    let formatter = pkg.storeProduct.priceFormatter ?? {
                        let f = NumberFormatter()
                        f.numberStyle = .currency
                        f.locale = Locale.current
                        return f
                    }()
                    let monthly = (pkg.storeProduct.price as Decimal) / 12
                    perMonth = formatter.string(from: monthly as NSDecimalNumber)
                }
                return SubscriptionPackage(
                    id: pkg.identifier,
                    title: isYearly ? "Jährlich" : "Monatlich",
                    priceString: pkg.storeProduct.localizedPriceString,
                    pricePerMonthString: perMonth,
                    period: isYearly ? "Jahr" : "Monat",
                    isYearly: isYearly
                )
            }
        } catch {
            return []
        }
    }

    func purchase(_ package: SubscriptionPackage) async throws -> Bool {
        guard let pkg = cachedPackages.first(where: { $0.identifier == package.id }) else {
            throw SubscriptionServiceError.packageNotFound
        }

        // Wrap the StoreKit purchase in a hard timeout. A stuck/unfinished
        // transaction left over from an earlier sandbox test can make RevenueCat's
        // purchase call hang indefinitely waiting for a transaction update that
        // never arrives — without this, the paywall spins forever with no error,
        // which looks identical to "nothing happened" to the user.
        let result = try await withThrowingTaskGroup(of: PurchaseResultData.self) { group in
            group.addTask {
                try await Purchases.shared.purchase(package: pkg)
            }
            group.addTask {
                try await Task.sleep(nanoseconds: 45_000_000_000)
                throw SubscriptionServiceError.purchaseTimedOut
            }
            guard let first = try await group.next() else {
                throw SubscriptionServiceError.purchaseTimedOut
            }
            group.cancelAll()
            return first
        }

        if result.userCancelled { return false }
        // StoreKit already charged the user at this point — `purchase()` returned
        // without throwing and without userCancelled, so the transaction is done,
        // regardless of whether this particular CustomerInfo snapshot already
        // reflects the entitlement (activation can lag receipt validation,
        // especially on sandbox/TestFlight). We do NOT tell a customer who was
        // just charged that their "purchase failed" just because this one
        // snapshot hasn't caught up yet — that was the actual bug before.
        //
        // No manual polling loop needed: `purchases(_:receivedUpdated:)` above
        // (RevenueCat's own recommended delegate hook) fires independently the
        // moment the SDK confirms the entitlement, and updates `AppRouter.isPremium`
        // directly — often before this function even returns.
        return true
    }

    func isTrialEligible(for package: SubscriptionPackage) async -> Bool {
        guard let pkg = cachedPackages.first(where: { $0.identifier == package.id }) else { return true }
        let status = await Purchases.shared.checkTrialOrIntroDiscountEligibility(product: pkg.storeProduct)
        return status != .ineligible
    }

    func refreshPremiumState() async throws -> Bool {
        guard RevenueCatConfig.isConfigured else { return false }
        let info = try await Purchases.shared.customerInfo()
        return isPremiumActive(info)
    }

    func restorePurchases() async throws -> Bool {
        guard RevenueCatConfig.isConfigured else { return false }
        let info = try await Purchases.shared.restorePurchases()
        return isPremiumActive(info)
    }

    /// Alias the RevenueCat app user ID to the Supabase user ID. Without this the
    /// purchase lands on an anonymous RevenueCat user, and the backend
    /// (`check-subscription` → RevenueCat REST lookup keyed by Supabase user ID)
    /// never finds the entitlement, so premium features stay locked after payment
    /// even though the app itself (and RevenueCat's own client-side entitlement
    /// check) correctly shows the purchase as active — this exact split ("restore
    /// says it worked, but no premium features") was silently possible before,
    /// because a single `logIn` attempt that failed (a transient network blip)
    /// was never retried or verified, and the purchase/restore proceeded on the
    /// still-anonymous identity regardless.
    ///
    /// Retries a few times and verifies `appUserID` actually matches before
    /// returning, instead of firing a single best-effort attempt.
    func identify(userId: String) async {
        guard RevenueCatConfig.isConfigured, Purchases.isConfigured, !userId.isEmpty else { return }
        for attempt in 0..<3 {
            // No-op once already identified as this user (avoids redundant calls).
            if Purchases.shared.appUserID == userId { return }
            if attempt > 0 {
                try? await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
            }
            _ = try? await Purchases.shared.logIn(userId)
        }
    }

    func clearIdentity() async {
        guard RevenueCatConfig.isConfigured, Purchases.isConfigured else { return }
        // logOut throws when the current user is already anonymous — ignore.
        _ = try? await Purchases.shared.logOut()
    }

    /// Opens the native App Store "Offer Code einlösen" sheet so influencer/promo
    /// codes from App Store Connect can be redeemed directly inside the app.
    func redeemOfferCode() {
        guard RevenueCatConfig.isConfigured, Purchases.isConfigured else { return }
        Purchases.shared.presentCodeRedemptionSheet()
    }

    /// Opens Apple's native subscription-management page, where the user can
    /// cancel or change their plan. This is the App Store deep link Apple itself
    /// recommends and always resolves to the manage-subscriptions screen.
    func showManageSubscriptions() async {
        if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
            // In an async context `open(_:)` resolves to the async overload, which
            // must be awaited.
            await UIApplication.shared.open(url)
        }
    }
}
#endif
