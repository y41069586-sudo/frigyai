import Foundation

/// Parses `frigy://`, Universal Links, and legacy web paths into typed `AppDeepLink` values.
/// Ported from `src/lib/appDeepLink.ts`.
enum DeepLinkParser {
    static let appScheme = "frigy"

    static func parse(_ rawURL: String, appWebHost: String = SupabaseConfig.appWebHost) -> AppDeepLink? {
        let trimmed = rawURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if let url = URL(string: trimmed), let link = parse(url: url, appWebHost: appWebHost) {
            return link
        }

        return parseFallback(trimmed)
    }

    static func parse(url: URL, appWebHost: String = SupabaseConfig.appWebHost) -> AppDeepLink? {
        if url.scheme?.lowercased() == appScheme {
            return parseFrigyScheme(url)
        }

        if url.scheme == "https" || url.scheme == "http" {
            return parseUniversalLink(url, appWebHost: appWebHost)
        }

        return nil
    }

    static func legacyWebPath(from url: URL) -> LegacyWebPath {
        let path = url.path.lowercased()
        let query = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []

        if path == "/profile" { return .profile }
        if path == "/badges" { return .badges }
        if path == "/scan" { return .scan }
        if path == "/premium-pricing" || path == "/premium" { return .premiumPricing }
        if path == "/auth" { return .auth }
        if path == "/meal-plans" {
            let tab = query.first(where: { $0.name == "tab" })?.value
            return .mealPlans(tab: tab)
        }
        if path == "/" || path.isEmpty {
            return .root(query: query)
        }
        if isSignupPath(path) {
            let ref = referralCode(from: query)
            return .signup(ref: ref)
        }

        return .unknown(url.absoluteString)
    }

    static func deepLink(from legacy: LegacyWebPath) -> AppDeepLink? {
        switch legacy {
        case .profile:
            return .home(.profile)
        case .badges:
            return .home(.badges)
        case .scan:
            return .openTracker
        case .premiumPricing:
            return .subscriptionSuccess
        case .auth:
            return .authCallback(URL(string: "\(appScheme)://callback")!)
        case .mealPlans(let tab):
            switch tab?.lowercased() {
            case "shopping": return .tab(.shopping)
            case "reminders": return .plans(.reminders)
            default: return .tab(.plans)
            }
        case .root(let query):
            if query.contains(where: { $0.name == "logMeal" && $0.value == "1" }) {
                return .openTracker
            }
            if query.contains(where: { $0.name == "subscription" && $0.value == "success" }) {
                return .subscriptionSuccess
            }
            if let step = query.first(where: { $0.name == "onboardingStep" })?.value,
               step == "referral-code" {
                let ref = referralCode(from: query)
                return .onboardingReferral(code: ref)
            }
            return .tab(.home)
        case .signup(let ref):
            return .signup(referralCode: ref)
        case .unknown:
            return nil
        }
    }

    // MARK: - Private

    private static func parseFrigyScheme(_ url: URL) -> AppDeepLink? {
        let host = url.host?.lowercased() ?? ""
        let path = url.path.lowercased()
        let query = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []

        if host == "callback" || host == "subscription" || host == "payment" {
            if query.contains(where: { $0.name == "code" }) || query.contains(where: { $0.name == "access_token" }) {
                return .authCallback(url)
            }
            if query.contains(where: { $0.name == "subscription" && $0.value == "success" }) {
                return .subscriptionSuccess
            }
            return .authCallback(url)
        }

        if host == "signup" || host == "invite" || host == "referral" || isSignupPath(path) {
            return .signup(referralCode: referralCode(from: query))
        }

        if query.contains(where: { $0.name == "subscription" && $0.value == "success" }) {
            return .subscriptionSuccess
        }

        if host == "profile" { return .home(.profile) }
        if host == "badges" { return .home(.badges) }
        if host == "scan" { return .openTracker }

        return nil
    }

    private static func parseUniversalLink(_ url: URL, appWebHost: String) -> AppDeepLink? {
        guard url.host?.lowercased() == appWebHost.lowercased() else { return nil }
        return deepLink(from: legacyWebPath(from: url))
    }

    private static func parseFallback(_ raw: String) -> AppDeepLink? {
        let lower = raw.lowercased()
        if lower.contains("subscription=success") { return .subscriptionSuccess }
        if lower.contains("frigy://signup") || lower.contains("frigy://invite") {
            let query = raw.contains("?") ? String(raw[raw.firstIndex(of: "?")!...]) : ""
            var items: [URLQueryItem] = []
            if let components = URLComponents(string: "https://x\(query)") {
                items = components.queryItems ?? []
            }
            return .signup(referralCode: referralCode(from: items))
        }
        return nil
    }

    private static func isSignupPath(_ path: String) -> Bool {
        let normalized = path.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return normalized == "signup" || normalized == "invite" || normalized == "referral"
    }

    private static func referralCode(from query: [URLQueryItem]) -> String? {
        query.first(where: { $0.name == "ref" })?.value
    }
}
