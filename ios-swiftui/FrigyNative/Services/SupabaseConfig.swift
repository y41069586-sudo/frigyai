import Foundation

enum SupabaseConfig {
    static var urlString: String? {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              !raw.isEmpty,
              !raw.contains("placeholder") else { return nil }
        return raw
    }

    static var url: URL? {
        guard let urlString else { return nil }
        return URL(string: urlString)
    }

    static var anonKey: String? {
        guard let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
              !key.isEmpty,
              key != "placeholder_anon_key" else { return nil }
        return key
    }

    static var appWebHost: String {
        (Bundle.main.object(forInfoDictionaryKey: "APP_WEB_HOST") as? String) ?? "app.frigy.app"
    }

    static var oauthRedirectScheme: String {
        (Bundle.main.object(forInfoDictionaryKey: "OAUTH_REDIRECT_SCHEME") as? String) ?? "frigy"
    }

    static var oauthCallbackHost: String {
        (Bundle.main.object(forInfoDictionaryKey: "OAUTH_CALLBACK_HOST") as? String) ?? "callback"
    }

    static var oauthRedirectURL: URL {
        // Never force-unwrap: a misconfigured xcconfig could produce an invalid
        // scheme/host. Fall back to the known-good default rather than crash.
        URL(string: "\(oauthRedirectScheme)://\(oauthCallbackHost)")
            ?? URL(string: "frigy://callback")!
    }

    static var isConfigured: Bool {
        url != nil && anonKey != nil
    }
}
