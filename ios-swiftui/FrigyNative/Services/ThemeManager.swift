import SwiftUI

/// User-facing appearance preference. `.system` follows the device setting.
enum ThemePreference: String, CaseIterable, Codable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    /// SwiftUI color scheme to force, or nil to follow the system.
    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light:  .light
        case .dark:   .dark
        }
    }

    var label: String {
        switch self {
        case .system: "System"
        case .light:  "Hell"
        case .dark:   "Dunkel"
        }
    }

    var subtitle: String {
        switch self {
        case .system: "Folgt deinen Geräte-Einstellungen"
        case .light:  "Immer heller Hintergrund"
        case .dark:   "Schont die Augen bei Nacht"
        }
    }

    var icon: String {
        switch self {
        case .system: "circle.lefthalf.filled"
        case .light:  "sun.max.fill"
        case .dark:   "moon.stars.fill"
        }
    }
}

/// App-wide appearance manager. Persists the choice and exposes it as an
/// `@Observable` so the root view re-applies `preferredColorScheme` live.
@MainActor
@Observable
final class ThemeManager {
    static let shared = ThemeManager()

    private static let key = "frigy.themePreference.v1"
    /// Whether the user has made an explicit choice (drives the onboarding prompt).
    private static let chosenKey = "frigy.hasChosenTheme.v1"

    var preference: ThemePreference {
        didSet { UserDefaults.standard.set(preference.rawValue, forKey: Self.key) }
    }

    var hasChosen: Bool {
        didSet { UserDefaults.standard.set(hasChosen, forKey: Self.chosenKey) }
    }

    var colorScheme: ColorScheme? { preference.colorScheme }

    init() {
        let raw = UserDefaults.standard.string(forKey: Self.key)
        if let raw, let pref = ThemePreference(rawValue: raw) {
            self.preference = pref
            self.hasChosen = UserDefaults.standard.bool(forKey: Self.chosenKey)
        } else {
            // No stored preference: default to light mode and treat as chosen so no
            // popup is ever shown to users who skipped or never saw the theme step.
            self.preference = .light
            self.hasChosen = true
        }
    }

    /// Apply a choice and mark the onboarding prompt as resolved.
    func choose(_ preference: ThemePreference) {
        self.preference = preference
        self.hasChosen = true
    }
}
