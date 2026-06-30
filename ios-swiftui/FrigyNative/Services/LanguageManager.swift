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
        // ===== TABS =====
        "Start": [.en: "Home", .fr: "Accueil", .es: "Inicio", .it: "Home", .hi: "होम"],
        "Plan": [.en: "Plan", .fr: "Plan", .es: "Plan", .it: "Piano", .hi: "योजना"],
        "Einkauf": [.en: "Shopping", .fr: "Courses", .es: "Compras", .it: "Spesa", .hi: "खरीदारी"],

        // ===== PROFILE / SETTINGS MENU =====
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

        // ===== LANGUAGE SCREEN =====
        "Wähle deine bevorzugte Sprache. Die Änderung wird sofort übernommen.":
            [.en: "Choose your preferred language. The change applies immediately.",
             .fr: "Choisis ta langue préférée. Le changement est appliqué immédiatement.",
             .es: "Elige tu idioma preferido. El cambio se aplica de inmediato.",
             .it: "Scegli la tua lingua preferita. La modifica viene applicata subito.",
             .hi: "अपनी पसंदीदा भाषा चुनें। परिवर्तन तुरंत लागू होता है।"],

        // ===== COMMON ACTIONS =====
        "Speichern": [.en: "Save", .fr: "Enregistrer", .es: "Guardar", .it: "Salva", .hi: "सहेजें"],
        "Abbrechen": [.en: "Cancel", .fr: "Annuler", .es: "Cancelar", .it: "Annulla", .hi: "रद्द करें"],
        "Fertig": [.en: "Done", .fr: "Terminé", .es: "Hecho", .it: "Fatto", .hi: "पूर्ण"],
        "Los geht's": [.en: "Let's go", .fr: "C'est parti", .es: "Vamos", .it: "Iniziamo", .hi: "चलिए शुरू करें"],
        "Schließen": [.en: "Close", .fr: "Fermer", .es: "Cerrar", .it: "Chiudi", .hi: "बंद करें"],
        "Erneut": [.en: "Retry", .fr: "Réessayer", .es: "Reintentar", .it: "Riprova", .hi: "पुनः प्रयास करें"],

        // ===== SUBSCRIPTION SCREEN =====
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

        // ===== HOME DASHBOARD =====
        "HEUTE": [.en: "TODAY", .fr: "AUJOURD'HUI", .es: "HOY", .it: "OGGI", .hi: "आज"],
        "Daten konnten nicht geladen werden.": [.en: "Data could not be loaded.", .fr: "Les données n'ont pas pu être chargées.", .es: "No se pudieron cargar los datos.", .it: "Impossibile caricare i dati.", .hi: "डेटा लोड नहीं हो सका।"],
        "über dem Tagesziel von": [.en: "over daily goal of", .fr: "au-dessus de l'objectif quotidien de", .es: "por encima del objetivo diario de", .it: "sopra l'obiettivo giornaliero di", .hi: "दैनिक लक्ष्य से अधिक"],
        "übrig von": [.en: "remaining of", .fr: "restant de", .es: "restante de", .it: "rimasto di", .hi: "बचा हुआ"],
        "Gegessen": [.en: "Eaten", .fr: "Consommé", .es: "Consumido", .it: "Consumato", .hi: "खाया गया"],
        "Leichter Überschuss": [.en: "Light surplus", .fr: "Léger excédent", .es: "Ligero excedente", .it: "Leggero eccesso", .hi: "हल्का अतिरिक्त"],
        "Überschuss!": [.en: "Surplus!", .fr: "Excédent !", .es: "¡Excedente!", .it: "Eccesso!", .hi: "अतिरिक्त!"],
        "Heute": [.en: "Today", .fr: "Aujourd'hui", .es: "Hoy", .it: "Oggi", .hi: "आज"],
        "Schnell hinzufügen": [.en: "Quick add", .fr: "Ajout rapide", .es: "Agregar rápido", .it: "Aggiungi veloce", .hi: "तेजी से जोड़ें"],
        "Frühstück": [.en: "Breakfast", .fr: "Petit-déjeuner", .es: "Desayuno", .it: "Colazione", .hi: "नाश्ता"],
        "Mittagessen": [.en: "Lunch", .fr: "Déjeuner", .es: "Almuerzo", .it: "Pranzo", .hi: "दोपहर का भोजन"],
        "Abendessen": [.en: "Dinner", .fr: "Dîner", .es: "Cena", .it: "Cena", .hi: "रात का खाना"],
        "Snack": [.en: "Snack", .fr: "Collation", .es: "Merienda", .it: "Snack", .hi: "स्नैक"],
        "Mittag": [.en: "Lunch", .fr: "Midi", .es: "Tarde", .it: "Pranzo", .hi: "दोपहर"],
        "Abend": [.en: "Dinner", .fr: "Soir", .es: "Noche", .it: "Sera", .hi: "शाम"],
        "⚠️ Gestern warst du im Kalorienüberschuss": [.en: "⚠️ You had a calorie surplus yesterday", .fr: "⚠️ Tu avais un excédent calorique hier", .es: "⚠️ Tuviste un excedente calórico ayer", .it: "⚠️ Ieri hai avuto un eccesso calorico", .hi: "⚠️ कल आपके पास कैलोरी अतिरिक्त था"],

        // ===== MEAL PLANS =====
        "Mahlzeit-Vorlagen": [.en: "Meal templates", .fr: "Modèles de repas", .es: "Plantillas de comidas", .it: "Modelli di pasti", .hi: "भोजन टेम्पलेट"],
        "Tippe auf eine Vorlage, um das Rezept und Nährwerte zu sehen.": [.en: "Tap a template to see the recipe and nutrition facts.", .fr: "Appuie sur un modèle pour voir la recette et les valeurs nutritionnelles.", .es: "Toca una plantilla para ver la receta y los valores nutricionales.", .it: "Tocca un modello per vedere la ricetta e i valori nutrizionali.", .hi: "रेसिपी और पोषण तथ्य देखने के लिए एक टेम्पलेट पर टैप करें।"],

        // ===== SHOPPING LIST =====
        "Einkaufsliste": [.en: "Shopping list", .fr: "Liste d'courses", .es: "Lista de compras", .it: "Lista della spesa", .hi: "खरीदारी सूची"],
        "geschätzt": [.en: "estimated", .fr: "estimé", .es: "estimado", .it: "stimato", .hi: "अनुमानित"],
        "erledigt": [.en: "done", .fr: "fait", .es: "hecho", .it: "fatto", .hi: "पूर्ण"],
        "Erledigt": [.en: "Done", .fr: "Fait", .es: "Hecho", .it: "Fatto", .hi: "पूर्ण"],
        "Erledigte entfernen": [.en: "Remove completed", .fr: "Supprimer les articles terminés", .es: "Eliminar completados", .it: "Rimuovi completati", .hi: "पूर्ण को हटाएं"],
        "Einkaufsliste ist leer": [.en: "Shopping list is empty", .fr: "La liste d'courses est vide", .es: "La lista de compras está vacía", .it: "La lista della spesa è vuota", .hi: "खरीदारी सूची खाली है"],
        "Tippe auf +, um Artikel hinzuzufügen, oder generiere eine Liste aus deinem Wochenplan.": [.en: "Tap + to add items or generate a list from your meal plan.", .fr: "Appuie sur + pour ajouter des articles ou génère une liste à partir de ton plan de repas.", .es: "Toca + para agregar artículos o genera una lista de tu plan de comidas.", .it: "Tocca + per aggiungere articoli o genera un elenco dal tuo piano dei pasti.", .hi: "आइटम जोड़ने के लिए + पर टैप करें या अपनी भोजन योजना से एक सूची उत्पन्न करें।"],

        // ===== SHOPPING CATEGORIES =====
        "Obst & Gemüse": [.en: "Produce", .fr: "Fruits & légumes", .es: "Frutas y verduras", .it: "Frutta e verdura", .hi: "उपज"],
        "Protein": [.en: "Protein", .fr: "Protéines", .es: "Proteína", .it: "Proteine", .hi: "प्रोटीन"],
        "Milchprodukte": [.en: "Dairy", .fr: "Produits laitiers", .es: "Productos lácteos", .it: "Latticini", .hi: "डेयरी"],
        "Getreide & Körner": [.en: "Grains", .fr: "Céréales et grains", .es: "Cereales y granos", .it: "Cereali", .hi: "अनाज"],
        "Vorratskammer": [.en: "Pantry", .fr: "Garde-manger", .es: "Despensa", .it: "Dispensa", .hi: "पेंट्री"],
        "Sonstiges": [.en: "Other", .fr: "Autre", .es: "Otro", .it: "Altro", .hi: "अन्य"],

        // ===== TRACKER / LOGGING =====
        "Lebensmittel suchen...": [.en: "Search foods...", .fr: "Rechercher des aliments...", .es: "Buscar alimentos...", .it: "Cerca alimenti...", .hi: "खाद्य पदार्थ खोजें..."],
        "tracken": [.en: "log", .fr: "enregistrer", .es: "registrar", .it: "registra", .hi: "लॉग करें"],

        // ===== ACCOUNT / DIALOGS =====
        "Konto wirklich löschen?": [.en: "Really delete account?", .fr: "Vraiment supprimer le compte ?", .es: "¿Eliminar realmente la cuenta?", .it: "Eliminare davvero l'account?", .hi: "वास्तव में खाता हटाएं?"],
        "Dein Konto und alle lokalen Daten werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.": [.en: "Your account and all local data will be deleted. This action cannot be undone.", .fr: "Ton compte et toutes les données locales seront supprimés. Cette action ne peut pas être annulée.", .es: "Tu cuenta y todos los datos locales se eliminarán. Esta acción no se puede deshacer.", .it: "Il tuo account e tutti i dati locali verranno eliminati. Questa azione non può essere annullata.", .hi: "आपका खाता और सभी स्थानीय डेटा हटा दिए जाएंगे। यह क्रिया पूर्ववत नहीं की जा सकती।"],
        "Serverdaten konnten nicht gelöscht werden": [.en: "Server data could not be deleted", .fr: "Les données du serveur n'ont pas pu être supprimées", .es: "No se pudieron eliminar los datos del servidor", .it: "I dati del server non hanno potuto essere eliminati", .hi: "सर्वर डेटा हटाया नहीं जा सका"],
        "Du wurdest abgemeldet und lokale Daten wurden entfernt, aber dein Konto auf dem Server konnte nicht gelöscht werden. Bitte versuche es später erneut oder kontaktiere den Support.": [.en: "You were signed out and local data was removed, but your server account could not be deleted. Please try again later or contact support.", .fr: "Tu as été déconnecté et les données locales ont été supprimées, mais ton compte serveur n'a pas pu être supprimé. Veuillez réessayer plus tard ou contacter le support.", .es: "Fuiste desconectado y se eliminaron los datos locales, pero tu cuenta de servidor no pudo ser eliminada. Intenta de nuevo más tarde o contacta con soporte.", .it: "Sei stato disconnesso e i dati locali sono stati rimossi, ma il tuo account server non ha potuto essere eliminato. Per favore riprova più tardi o contatta il supporto.", .hi: "आप साइन आउट किए गए और स्थानीय डेटा हटा दिए गए, लेकिन आपके सर्वर खाते को हटाया नहीं जा सका। कृपया बाद में पुनः प्रयास करें या सहायता से संपर्क करें।"],
        "Wird gelöscht…": [.en: "Deleting...", .fr: "Suppression en cours...", .es: "Eliminando...", .it: "Eliminazione in corso...", .hi: "हटाया जा रहा है..."],
        "Dein Konto und alle lokalen Daten werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.": [.en: "Your account and all local data will be deleted. This action cannot be undone.", .fr: "Ton compte et toutes les données locales seront supprimés. Cette action ne peut pas être annulée.", .es: "Tu cuenta y todos los datos locales se eliminarán. Esta acción no se puede deshacer.", .it: "Il tuo account e tutti i dati locali verranno eliminati. Questa azione non può essere annullata.", .hi: "आपका खाता और सभी स्थानीय डेटा हटा दिए जाएंगे। यह क्रिया पूर्ववत नहीं की जा सकती।"],
    ]
}
