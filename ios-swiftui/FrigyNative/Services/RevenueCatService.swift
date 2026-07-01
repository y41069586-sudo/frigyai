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

    var errorDescription: String? {
        switch self {
        case .packageNotFound:
            return "Dieses Abo konnte nicht gefunden werden. Bitte versuche es erneut."
        case .entitlementNotActive:
            return "Der Kauf konnte nicht bestätigt werden. Falls dir Geld abgebucht wurde, tippe auf „Käufe wiederherstellen“ oder versuche es in ein paar Minuten erneut."
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

/// Live subscription service backed by RevenueCat. Loads store-localized
/// monthly/yearly prices and drives purchase / restore against the configured
/// premium entitlement.
@MainActor
final class RevenueCatSubscriptionService: SubscriptionServiceProtocol {
    static let shared = RevenueCatSubscriptionService()

    private var cachedPackages: [Package] = []

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
        let result = try await Purchases.shared.purchase(package: pkg)
        if result.userCancelled { return false }
        if result.customerInfo.entitlements[RevenueCatConfig.entitlementId]?.isActive == true {
            return true
        }
        // StoreKit charged the user, but entitlement activation can lag receipt
        // validation by a moment — without this retry, a legitimate purchase can
        // read as "not active" and the paywall silently does nothing after payment.
        try? await Task.sleep(nanoseconds: 1_500_000_000)
        if let refreshed = try? await Purchases.shared.customerInfo(),
           refreshed.entitlements[RevenueCatConfig.entitlementId]?.isActive == true {
            return true
        }
        throw SubscriptionServiceError.entitlementNotActive
    }

    func refreshPremiumState() async throws -> Bool {
        guard RevenueCatConfig.isConfigured else { return false }
        let info = try await Purchases.shared.customerInfo()
        return info.entitlements[RevenueCatConfig.entitlementId]?.isActive == true
    }

    func restorePurchases() async throws -> Bool {
        guard RevenueCatConfig.isConfigured else { return false }
        let info = try await Purchases.shared.restorePurchases()
        return info.entitlements[RevenueCatConfig.entitlementId]?.isActive == true
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
}
#endif
