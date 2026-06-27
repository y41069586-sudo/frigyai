import Foundation
import ChottuLinkSDK
import UIKit

/// Native ChottuLink attribution service (no Capacitor bridge).
/// Call `ChottuLinkService.shared.setup()` from `FrigyNativeApp.init`
/// and forward incoming URLs via `handle(url:)`.
@MainActor
final class ChottuLinkService: NSObject {
    static let shared = ChottuLinkService()

    private override init() {}

    func setup(apiKey: String, debug: Bool = false) {
        let config = CLConfiguration(
            apiKey: apiKey,
            isDebugEnabled: debug,
            delegate: self
        )
        ChottuLink.initialize(config: config)
    }

    func handle(url: URL) {
        ChottuLink.handleLink(url)
    }

    func identify(id: String, name: String? = nil, email: String? = nil) {
        let customer = CLCustomerMeta(id: id, name: name, email: email, phone: nil, emailSha256: nil, phoneSha256: nil)
        ChottuLink.identify(customer)
    }

    func trackConversion(revenue: Double, currency: String? = nil, productId: String? = nil) {
        let meta = CLConversionMeta(
            revenue: revenue,
            currency: currency,
            eventName: "conversion",
            productId: productId,
            transactionId: nil,
            metadata: nil
        )
        ChottuLink.trackConversion(meta)
    }

    func trackEvent(name: String, data: [String: Any]? = nil) {
        ChottuLink.trackEvent(name: name, data: data)
    }
}

extension ChottuLinkService: ChottuLinkDelegate {
    nonisolated func chottuLink(didInitializeWith configuration: CLConfiguration) {}

    nonisolated func chottuLink(didFailToInitializeWith error: any Error) {
        print("[ChottuLink] init failed:", error.localizedDescription)
    }

    nonisolated func chottuLink(didResolveDeepLink link: URL, metadata: [String: Any]?) {
        Task { @MainActor in
            NotificationCenter.default.post(name: .chottuDidResolveDeepLink, object: link, userInfo: metadata)
        }
    }

    nonisolated func chottuLink(didFailToResolveDeepLink originalURL: URL?, error: any Error) {
        print("[ChottuLink] deep link failed:", error.localizedDescription)
    }
}

extension Notification.Name {
    static let chottuDidResolveDeepLink = Notification.Name("chottuDidResolveDeepLink")
}
