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
    case entitlementNotActive
    case purchaseTimedOut

    var errorDescription: String? {
        switch self {
        case .packageNotFound:
            return "Dieses Abo konnte nicht gefunden werden. Bitte versuche es erneut."
        case .entitlementNotActive:
            return "Der Kauf konnte nicht bestätigt werden. Falls dir Geld abgebucht wurde, tippe auf „Käufe wiederherstellen“ oder versuche es in ein paar Minuten erneut."
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
@MainActor
final class RevenueCatSubscriptionService: SubscriptionServiceProtocol {
    static let shared = RevenueCatSubscriptionService()

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
    }

    func availablePackages() async -> [SubscriptionPackage] {
        guard RevenueCatConfig.isConfigured else { return [] }
        do {
            let offerings = try await Purchases.shared.offerings()
            guard let current = offerings.current else { return [] }
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
        if isPremiumActive(result.customerInfo) {
            return true
        }
        // StoreKit charged the user, but entitlement activation can lag receipt
        // validation — sandbox/TestFlight builds can lag noticeably longer than
        // production, so poll a few times with backoff instead of checking once.
        for delaySeconds in [2, 3, 5, 8] {
            try? await Task.sleep(nanoseconds: UInt64(delaySeconds) * 1_000_000_000)
            if let refreshed = try? await Purchases.shared.customerInfo(),
               isPremiumActive(refreshed) {
                return true
            }
        }
        throw SubscriptionServiceError.entitlementNotActive
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
    /// never finds the entitlement, so premium features stay locked after payment.
    func identify(userId: String) async {
        guard RevenueCatConfig.isConfigured, Purchases.isConfigured, !userId.isEmpty else { return }
        // No-op if already identified as this user (avoids a redundant network call).
        if Purchases.shared.appUserID == userId { return }
        _ = try? await Purchases.shared.logIn(userId)
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

    /// Presents the native manage-subscriptions sheet (where the user can cancel).
    /// Falls back to the App Store subscriptions URL if the sheet can't be shown.
    func showManageSubscriptions() async {
        if RevenueCatConfig.isConfigured, Purchases.isConfigured {
            do {
                try await Purchases.shared.showManageSubscriptions()
                return
            } catch {
                // fall through to URL fallback below
            }
        }
        if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
            await UIApplication.shared.open(url)
        }
    }
}
#endif
