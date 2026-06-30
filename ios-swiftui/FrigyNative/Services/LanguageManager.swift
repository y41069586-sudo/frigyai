import SwiftUI

/// The languages Frigy offers in Settings.
///
/// The app's source strings are written in German. `LanguageManager.t(_:)`
/// looks a German source string up in `Translations` and returns the variant
/// for the selected language, falling back to the German original when a string
/// has not been translated yet. This lets the UI be localized incrementally —
/// any not-yet-translated text simply stays German instead of breaking.
enum AppLanguage: String, CaseIterable, Identifiable, Codable {
    case de, en, fr, es, it, hi

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .de: "Deutsch"
        case .en: "English"
        case .fr: "Français"
        case .es: "Español"
        case .it: "Italiano"
        case .hi: "हिन्दी"
        }
    }

    /// Endonym shown as a subtitle (the language's name in German).
    var germanName: String {
        switch self {
        case .de: "Deutsch"
        case .en: "Englisch"
        case .fr: "Französisch"
        case .es: "Spanisch"
        case .it: "Italienisch"
        case .hi: "Hindi"
        }
    }

    var flag: String {
        switch self {
        case .de: "🇩🇪"
        case .en: "🇬🇧"
        case .fr: "🇫🇷"
        case .es: "🇪🇸"
        case .it: "🇮🇹"
        case .hi: "🇮🇳"
        }
    }

    /// Locale used for date/number formatting while this language is active.
    var localeIdentifier: String {
        switch self {
        case .de: "de_DE"
        case .en: "en_US"
        case .fr: "fr_FR"
        case .es: "es_ES"
        case .it: "it_IT"
        case .hi: "hi_IN"
        }
    }
}

@MainActor
@Observable
final class LanguageManager {
    static let shared = LanguageManager()

    private static let key = "frigy.appLanguage.v1"

    var language: AppLanguage {
        didSet { UserDefaults.standard.set(language.rawValue, forKey: Self.key) }
    }

    var locale: Locale { Locale(identifier: language.localeIdentifier) }

    init() {
        if let raw = UserDefaults.standard.string(forKey: Self.key),
           let lang = AppLanguage(rawValue: raw) {
            self.language = lang
        } else {
            self.language = .de
        }
    }

    func choose(_ language: AppLanguage) {
        self.language = language
    }

    /// Translate a German source string into the active language.
    /// Reading `language` here registers SwiftUI observation, so any view that
    /// calls `t(_:)` re-renders automatically when the language changes.
    func t(_ german: String) -> String {
        guard language != .de else { return german }
        return Translations.table[german]?[language] ?? german
    }
}

/// Lightweight runtime translation table keyed by the German source string.
///
/// Only a German→other map is stored (German is the source/fallback). Strings
/// not present here render in German regardless of the selected language.
enum Translations {
    static let table: [String: [AppLanguage: String]] = [
        // Tabs
        "Start": [.en: "Home", .fr: "Accueil", .es: "Inicio", .it: "Home", .hi: "होम"],
        "Plan": [.en: "Plan", .fr: "Plan", .es: "Plan", .it: "Piano", .hi: "योजना"],
        "Einkauf": [.en: "Shopping", .fr: "Courses", .es: "Compras", .it: "Spesa", .hi: "खरीदारी"],

        // Profile / Settings menu
        "Profil": [.en: "Profile", .fr: "Profil", .es: "Perfil", .it: "Profilo", .hi: "प्रोफ़ाइल"],
        "Mein Profil": [.en: "My profile", .fr: "Mon profil", .es: "Mi perfil", .it: "Il mio profilo", .hi: "मेरी प्रोफ़ाइल"],
        "Premium aktiv": [.en: "Premium active", .fr: "Premium actif", .es: "Premium activo", .it: "Premium attivo", .hi: "प्रीमियम सक्रिय"],
        "Kostenloser Plan": [.en: "Free plan", .fr: "Forfait gratuit", .es: "Plan gratuito", .it: "Piano gratuito", .hi: "मुफ़्त योजना"],
        "Profil bearbeiten": [.en: "Edit profile", .fr: "Modifier le profil", .es: "Editar perfil", .it: "Modifica profilo", .hi: "प्रोफ़ाइल संपादित करें"],
        "Transformation": [.en: "Transformation", .fr: "Transformation", .es: "Transformación", .it: "Trasformazione", .hi: "रूपांतरण"],
        "Benachrichtigungen": [.en: "Notifications", .fr: "Notifications", .es: "Notificaciones", .it: "Notifiche", .hi: "सूचनाएं"],
        "Darstellung": [.en: "Appearance", .fr: "Apparence", .es: "Apariencia", .it: "Aspetto", .hi: "दिखावट"],
        "Sprache": [.en: "Language", .fr: "Langue", .es: "Idioma", .it: "Lingua", .hi: "भाषा"],
        "Abonnement": [.en: "Subscription", .fr: "Abonnement", .es: "Suscripción", .it: "Abbonamento", .hi: "सदस्यता"],
        "Datenschutz": [.en: "Privacy", .fr: "Confidentialité", .es: "Privacidad", .it: "Privacy", .hi: "गोपनीयता"],
        "Impressum": [.en: "Imprint", .fr: "Mentions légales", .es: "Aviso legal", .it: "Note legali", .hi: "इम्प्रिंट"],
        "AGB": [.en: "Terms", .fr: "CGU", .es: "Términos", .it: "Termini", .hi: "शर्तें"],
        "Hilfe & Support": [.en: "Help & Support", .fr: "Aide et support", .es: "Ayuda y soporte", .it: "Aiuto e supporto", .hi: "सहायता और समर्थन"],
        "Käufe wiederherstellen": [.en: "Restore purchases", .fr: "Restaurer les achats", .es: "Restaurar compras", .it: "Ripristina acquisti", .hi: "खरीदारी पुनर्स्थापित करें"],
        "Abmelden": [.en: "Sign out", .fr: "Se déconnecter", .es: "Cerrar sesión", .it: "Esci", .hi: "साइन आउट"],
        "Konto löschen": [.en: "Delete account", .fr: "Supprimer le compte", .es: "Eliminar cuenta", .it: "Elimina account", .hi: "खाता हटाएं"],

        // Language screen
        "Wähle deine bevorzugte Sprache. Die Änderung wird sofort übernommen.":
            [.en: "Choose your preferred language. The change applies immediately.",
             .fr: "Choisis ta langue préférée. Le changement est appliqué immédiatement.",
             .es: "Elige tu idioma preferido. El cambio se aplica de inmediato.",
             .it: "Scegli la tua lingua preferita. La modifica viene applicata subito.",
             .hi: "अपनी पसंदीदा भाषा चुनें। परिवर्तन तुरंत लागू होता है।"],

        // Common actions
        "Speichern": [.en: "Save", .fr: "Enregistrer", .es: "Guardar", .it: "Salva", .hi: "सहेजें"],
        "Abbrechen": [.en: "Cancel", .fr: "Annuler", .es: "Cancelar", .it: "Annulla", .hi: "रद्द करें"],
        "Fertig": [.en: "Done", .fr: "Terminé", .es: "Hecho", .it: "Fatto", .hi: "पूर्ण"],
        "Los geht's": [.en: "Let's go", .fr: "C'est parti", .es: "Vamos", .it: "Iniziamo", .hi: "चलिए शुरू करें"],

        // Subscription screen
        "Frigy Premium": [.en: "Frigy Premium", .fr: "Frigy Premium", .es: "Frigy Premium", .it: "Frigy Premium", .hi: "Frigy Premium"],
        "Frigy Free": [.en: "Frigy Free", .fr: "Frigy Free", .es: "Frigy Free", .it: "Frigy Free", .hi: "Frigy Free"],
        "Du hast Zugriff auf alle Premium-Features.":
            [.en: "You have access to all premium features.",
             .fr: "Tu as accès à toutes les fonctionnalités premium.",
             .es: "Tienes acceso a todas las funciones premium.",
             .it: "Hai accesso a tutte le funzioni premium.",
             .hi: "आपके पास सभी प्रीमियम सुविधाओं तक पहुंच है।"],
        "Upgrade auf Premium für alle Features.":
            [.en: "Upgrade to Premium for all features.",
             .fr: "Passe à Premium pour toutes les fonctionnalités.",
             .es: "Mejora a Premium para todas las funciones.",
             .it: "Passa a Premium per tutte le funzioni.",
             .hi: "सभी सुविधाओं के लिए प्रीमियम में अपग्रेड करें।"],
    ]
}
