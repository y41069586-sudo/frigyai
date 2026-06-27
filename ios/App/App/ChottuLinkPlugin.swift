import Foundation
import Capacitor
import ChottuLinkSDK

@objc(ChottuLinkPlugin)
public class ChottuLinkPlugin: CAPPlugin, CAPBridgedPlugin, ChottuLinkDelegate {
    public let identifier = "ChottuLinkPlugin"
    public let jsName = "ChottuLink"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "handleLink", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAppLinkDataFromUrl", returnType: CAPPluginReturnPromise),
    ]

    @objc func initialize(_ call: CAPPluginCall) {
        guard let apiKey = call.getString("apiKey"), !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("apiKey is required")
            return
        }

        let debug = call.getBool("debug", false)
        let config = CLConfiguration(
            apiKey: apiKey.trimmingCharacters(in: .whitespacesAndNewlines),
            isDebugEnabled: debug,
            delegate: self
        )

        Task { @MainActor in
            ChottuLink.initialize(config: config)
            call.resolve()
        }
    }

    @objc func handleLink(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("url is required")
            return
        }

        Task { @MainActor in
            ChottuLink.handleLink(url)
            call.resolve()
        }
    }

    @objc func getAppLinkDataFromUrl(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), !urlString.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("url is required")
            return
        }

        Task { @MainActor in
            do {
                let appLinkData = try await ChottuLink.getAppLinkDataFromUrl(from: urlString)
                call.resolve([
                    "link": appLinkData.link?.absoluteString as Any,
                    "shortLink": appLinkData.shortLink?.absoluteString as Any,
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    public func chottuLink(didInitializeWith configuration: CLConfiguration) {
        notifyListeners("initializationSuccess", data: [
            "apiKey": configuration.apiKey,
        ], retainUntilConsumed: true)
    }

    public func chottuLink(didFailToInitializeWith error: any Error) {
        notifyListeners("deepLinkFailed", data: [
            "error": error.localizedDescription,
            "errorCode": Double((error as NSError).code),
        ], retainUntilConsumed: true)
    }

    public func chottuLink(didResolveDeepLink link: URL, metadata: [String : Any]?) {
        notifyListeners("deepLinkResolved", data: [
            "url": link.absoluteString,
            "metadata": stringMetadata(metadata),
        ], retainUntilConsumed: true)
    }

    public func chottuLink(didFailToResolveDeepLink originalURL: URL?, error: any Error) {
        notifyListeners("deepLinkFailed", data: [
            "originalUrl": originalURL?.absoluteString as Any,
            "error": error.localizedDescription,
            "errorCode": Double((error as NSError).code),
        ], retainUntilConsumed: true)
    }

    private func stringMetadata(_ metadata: [String: Any]?) -> [String: String] {
        guard let metadata else { return [:] }
        return metadata.reduce(into: [String: String]()) { result, entry in
            result[entry.key] = String(describing: entry.value)
        }
    }
}
