import Foundation

/// Reads the RevenueCat config injected via Secrets.xcconfig → Info.plist.
enum RevenueCatConfig {
    static var apiKey: String? {
        guard let key = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String,
              !key.isEmpty,
              key.hasPrefix("appl_") else { return nil }
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
                return SubscriptionPackage(
                    id: pkg.identifier,
                    title: isYearly ? "Jährlich" : "Monatlich",
                    priceString: pkg.storeProduct.localizedPriceString,
                    period: isYearly ? "Jahr" : "Monat",
                    isYearly: isYearly
                )
            }
        } catch {
            return []
        }
    }

    func purchase(_ package: SubscriptionPackage) async throws -> Bool {
        guard let pkg = cachedPackages.first(where: { $0.identifier == package.id }) else { return false }
        let result = try await Purchases.shared.purchase(package: pkg)
        return result.customerInfo.entitlements[RevenueCatConfig.entitlementId]?.isActive == true
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
}
#endif
