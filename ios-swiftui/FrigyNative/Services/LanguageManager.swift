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

        // ===== DASHBOARD WIDGETS =====
        "AKTIVITÄT": [.en: "ACTIVITY", .fr: "ACTIVITÉ", .es: "ACTIVIDAD", .it: "ATTIVITÀ", .hi: "गतिविधि"],
        "WASSER": [.en: "WATER", .fr: "EAU", .es: "AGUA", .it: "ACQUA", .hi: "पानी"],
        "ARTIKEL": [.en: "ITEMS", .fr: "ARTICLES", .es: "ARTÍCULOS", .it: "ARTICOLI", .hi: "वस्तुएं"],
        "NÄHRWERTE (PRO 100g)": [.en: "NUTRITION (PER 100g)", .fr: "VALEURS NUTRITIONNELLES (PAR 100g)", .es: "NUTRICIÓN (POR 100g)", .it: "VALORI NUTRIZIONALI (PER 100g)", .hi: "पोषण (प्रति 100g)"],
        "Geloggte Mahlzeiten": [.en: "Logged meals", .fr: "Repas enregistrés", .es: "Comidas registradas", .it: "Pasti registrati", .hi: "लॉग किए गए भोजन"],
        "Zuletzt gegessen": [.en: "Recently eaten", .fr: "Mangé récemment", .es: "Comido recientemente", .it: "Mangiato di recente", .hi: "हाल ही में खाया"],
        "Hinzufügen": [.en: "Add", .fr: "Ajouter", .es: "Agregar", .it: "Aggiungi", .hi: "जोड़ें"],
        "Plan ansehen": [.en: "View plan", .fr: "Voir le plan", .es: "Ver plan", .it: "Visualizza piano", .hi: "योजना देखें"],
        "Noch nichts geloggt": [.en: "Nothing logged yet", .fr: "Rien enregistré pour le moment", .es: "Nada registrado aún", .it: "Niente registrato ancora", .hi: "अभी तक कुछ नहीं लॉग किया गया"],
        "Noch kein Plan für diesen Tag": [.en: "No plan for this day yet", .fr: "Aucun plan pour ce jour", .es: "Sin plan para este día", .it: "Nessun piano per questo giorno", .hi: "इस दिन के लिए अभी कोई योजना नहीं"],
        "Noch kein Wochenplan": [.en: "No weekly plan yet", .fr: "Pas encore de plan hebdomadaire", .es: "Sin plan semanal aún", .it: "Nessun piano settimanale ancora", .hi: "अभी तक कोई साप्ताहिक योजना नहीं"],
        "Tagesziel erreicht! Super!": [.en: "Daily goal reached! Great!", .fr: "Objectif quotidien atteint ! Excellent !", .es: "¡Objetivo diario alcanzado! ¡Excelente!", .it: "Obiettivo giornaliero raggiunto! Fantastico!", .hi: "दैनिक लक्ष्य प्राप्त! बहुत अच्छा!"],

        // ===== MEAL PLANNING =====
        "Wochenplan": [.en: "Weekly plan", .fr: "Plan hebdomadaire", .es: "Plan semanal", .it: "Piano settimanale", .hi: "साप्ताहिक योजना"],
        "Wochenplan erstellen": [.en: "Create weekly plan", .fr: "Créer un plan hebdomadaire", .es: "Crear plan semanal", .it: "Crea piano settimanale", .hi: "साप्ताहिक योजना बनाएं"],
        "Wochenplan wird erstellt": [.en: "Creating weekly plan", .fr: "Création d'un plan hebdomadaire", .es: "Creando plan semanal", .it: "Creazione del piano settimanale", .hi: "साप्ताहिक योजना बनाई जा रही है"],
        "Wird erstellt…": [.en: "Creating...", .fr: "Création en cours...", .es: "Creando...", .it: "Creazione in corso...", .hi: "बनाया जा रहा है..."],
        "KATEGORIE": [.en: "CATEGORY", .fr: "CATÉGORIE", .es: "CATEGORÍA", .it: "CATEGORIA", .hi: "श्रेणी"],
        "Vorlage": [.en: "Template", .fr: "Modèle", .es: "Plantilla", .it: "Modello", .hi: "टेम्पलेट"],

        // ===== BARCODE / FOOD RECOGNITION =====
        "Scanne einen Barcode oder suche nach einem Lebensmittel.": [.en: "Scan a barcode or search for a food.", .fr: "Scanne un code-barres ou cherche un aliment.", .es: "Escanea un código de barras o busca un alimento.", .it: "Scansiona un codice a barre o cerca un alimento.", .hi: "बारकोड स्कैन करें या खाद्य पदार्थ खोजें।"],
        "Produkt hinzufügen": [.en: "Add product", .fr: "Ajouter un produit", .es: "Agregar producto", .it: "Aggiungi prodotto", .hi: "उत्पाद जोड़ें"],
        "LEBENSMITTEL": [.en: "FOOD", .fr: "ALIMENT", .es: "ALIMENTO", .it: "CIBO", .hi: "खाद्य पदार्थ"],
        "MAHLZEIT": [.en: "MEAL", .fr: "REPAS", .es: "COMIDA", .it: "PASTO", .hi: "भोजन"],
        "Artikel hinzufügen": [.en: "Add item", .fr: "Ajouter un article", .es: "Agregar artículo", .it: "Aggiungi articolo", .hi: "वस्तु जोड़ें"],
        "Suchergebnisse": [.en: "Search results", .fr: "Résultats de recherche", .es: "Resultados de búsqueda", .it: "Risultati di ricerca", .hi: "खोज परिणाम"],

        // ===== AI FEATURES =====
        "Dein KI-Ernährungscoach": [.en: "Your AI nutrition coach", .fr: "Votre coach en nutrition IA", .es: "Tu entrenador de nutrición IA", .it: "Il tuo coach nutrizionista AI", .hi: "आपका AI पोषण कोच"],
        "Frag deinen Coach": [.en: "Ask your coach", .fr: "Demande à ton coach", .es: "Pregunta a tu entrenador", .it: "Chiedi al tuo coach", .hi: "अपने कोच से पूछें"],
        "KI-BERATER": [.en: "AI ADVISOR", .fr: "CONSEILLER IA", .es: "ASESOR IA", .it: "CONSULENTE AI", .hi: "AI सलाहकार"],
        "KI Analyse starten": [.en: "Start AI analysis", .fr: "Démarrer l'analyse IA", .es: "Iniciar análisis IA", .it: "Avvia analisi AI", .hi: "AI विश्लेषण शुरू करें"],
        "KI analysiert dein Essen…": [.en: "AI is analyzing your food...", .fr: "L'IA analyse votre nourriture...", .es: "La IA está analizando tu comida...", .it: "L'IA sta analizzando il tuo cibo...", .hi: "AI आपके खाने का विश्लेषण कर रहा है..."],
        "Kalorien und Makros werden erkannt": [.en: "Calories and macros are detected", .fr: "Les calories et les macros sont détectées", .es: "Se detectan calorías y macros", .it: "Calorie e macros rilevate", .hi: "कैलोरी और मैक्रो का पता लगाया जा रहा है"],

        // ===== FRIDGE SCAN =====
        "Kühlschrank scannen": [.en: "Scan fridge", .fr: "Scanner le réfrigérateur", .es: "Escanear nevera", .it: "Scansiona frigorifero", .hi: "फ्रिज स्कैन करें"],
        "Zutaten erkennen": [.en: "Recognize ingredients", .fr: "Reconnaître les ingrédients", .es: "Reconocer ingredientes", .it: "Riconoscere ingredienti", .hi: "सामग्री पहचानें"],
        "Alles erkannt, was dein Wochenplan benötigt – nichts fehlt! 🎉": [.en: "All recognized ingredients match your plan – nothing missing! 🎉", .fr: "Tous les ingrédients reconnus correspondent à votre plan – rien ne manque ! 🎉", .es: "Todos los ingredientes reconocidos coinciden con su plan – ¡nada falta! 🎉", .it: "Tutti gli ingredienti riconosciuti corrispondono al tuo piano – niente manca! 🎉", .hi: "सभी मान्यता प्राप्त सामग्री आपकी योजना से मेल खाती है – कुछ नहीं छूटा! 🎉"],
        "Es wurden keine Zutaten erkannt. Versuche ein deutlicheres Foto.": [.en: "No ingredients were recognized. Try a clearer photo.", .fr: "Aucun ingrédient n'a été reconnu. Essayez une photo plus claire.", .es: "No se reconocieron ingredientes. Intente una foto más clara.", .it: "Nessun ingrediente è stato riconosciuto. Prova una foto più nitida.", .hi: "कोई सामग्री मान्यता प्राप्त नहीं की गई। एक स्पष्ट फोटो की कोशिश करें।"],
        "Noch keine Fotos": [.en: "No photos yet", .fr: "Pas encore de photos", .es: "Sin fotos aún", .it: "Nessuna foto ancora", .hi: "अभी कोई फोटो नहीं"],
        "Mache ein oder mehrere Fotos deines Kühlschranks oder wähle sie aus der Galerie. Die KI erkennt automatisch alle vorhandenen Zutaten und zeigt, was für deinen Wochenplan noch fehlt.": [.en: "Take one or more photos of your fridge or select them from the gallery. AI automatically recognizes all available ingredients and shows what's missing for your meal plan.", .fr: "Prenez une ou plusieurs photos de votre réfrigérateur ou sélectionnez-les dans la galerie. L'IA reconnaît automatiquement tous les ingrédients disponibles et montre ce qui manque pour votre plan de repas.", .es: "Toma una o más fotos de tu nevera o selecciónalas de la galería. La IA reconoce automáticamente todos los ingredientes disponibles y muestra lo que falta para tu plan de comidas.", .it: "Scatta una o più foto del tuo frigorifero o selezionale dalla galleria. L'IA riconosce automaticamente tutti gli ingredienti disponibili e mostra cosa manca per il tuo piano dei pasti.", .hi: "अपने फ्रिज की एक या अधिक तस्वीरें लें या गैलरी से चुनें। AI स्वचालित रूप से सभी उपलब्ध सामग्री को पहचानता है और दिखाता है कि आपकी भोजन योजना के लिए क्या गायब है।"],

        // ===== CAMERA & SETTINGS =====
        "Kamera-Zugriff verweigert": [.en: "Camera access denied", .fr: "Accès à la caméra refusé", .es: "Acceso a la cámara denegado", .it: "Accesso alla fotocamera negato", .hi: "कैमरा एक्सेस अस्वीकृत"],
        "Aktiviere den Kamera-Zugriff in den Einstellungen.": [.en: "Enable camera access in settings.", .fr: "Activez l'accès à la caméra dans les paramètres.", .es: "Habilita el acceso a la cámara en la configuración.", .it: "Abilita l'accesso alla fotocamera nelle impostazioni.", .hi: "सेटिंग्स में कैमरा एक्सेस सक्षम करें।"],
        "Einstellungen": [.en: "Settings", .fr: "Paramètres", .es: "Configuración", .it: "Impostazioni", .hi: "सेटिंग्स"],
        "Verbinden": [.en: "Connect", .fr: "Connecter", .es: "Conectar", .it: "Connetti", .hi: "कनेक्ट करें"],
        "Trennen": [.en: "Disconnect", .fr: "Déconnecter", .es: "Desconectar", .it: "Scollega", .hi: "डिस्कनेक्ट करें"],
        "Für heute sind noch keine Mahlzeiten geplant.": [.en: "No meals planned for today yet.", .fr: "Aucun repas prévu pour aujourd'hui.", .es: "Sin comidas planeadas para hoy.", .it: "Nessun pasto pianificato per oggi.", .hi: "आज के लिए अभी कोई भोजन योजनाबद्ध नहीं है।"],
        "Tippe, um deinen Wochenplan zu öffnen und Mahlzeiten zu generieren.": [.en: "Tap to open your meal plan and generate meals.", .fr: "Appuyez pour ouvrir votre plan de repas et générer des repas.", .es: "Toca para abrir tu plan de comidas y generar comidas.", .it: "Tocca per aprire il tuo piano pasti e generare pasti.", .hi: "अपनी भोजन योजना खोलने और भोजन उत्पन्न करने के लिए टैप करें।"],
        "Wie viele Kalorien sollte ich essen?": [.en: "How many calories should I eat?", .fr: "Combien de calories devrais-je manger ?", .es: "¿Cuántas calorías debería comer?", .it: "Quante calorie dovrei mangiare?", .hi: "मुझे कितनी कैलोरी खानी चाहिए?"],
        "Noch": [.en: "Still", .fr: "Encore", .es: "Aún", .it: "Ancora", .hi: "अभी भी"],
        "bis zum Tagesziel": [.en: "until daily goal", .fr: "jusqu'à l'objectif quotidien", .es: "hasta el objetivo diario", .it: "fino all'obiettivo giornaliero", .hi: "दैनिक लक्ष्य तक"],
        "Schritte": [.en: "Steps", .fr: "Pas", .es: "Pasos", .it: "Passi", .hi: "कदम"],
        "Aktiv kcal": [.en: "Active kcal", .fr: "kcal actif", .es: "kcal activo", .it: "kcal attivo", .hi: "सक्रिय किलो कैलोरी"],
        "Netto kcal": [.en: "Net kcal", .fr: "kcal net", .es: "kcal neto", .it: "kcal netto", .hi: "नेट किलो कैलोरी"],

        // ===== BARCODE SCANNER =====
        "🔍 Barcode erkannt": [.en: "🔍 Barcode scanned", .fr: "🔍 Code-barres scannné", .es: "🔍 Código de barras escaneado", .it: "🔍 Codice a barre scansionato", .hi: "🔍 बारकोड स्कैन किया गया"],
        "🤖 KI analysiert Produkt…": [.en: "🤖 AI analyzing product...", .fr: "🤖 L'IA analyse le produit...", .es: "🤖 La IA analiza el producto...", .it: "🤖 L'IA sta analizzando il prodotto...", .hi: "🤖 AI उत्पाद का विश्लेषण कर रहा है..."],
        "📊 Nährwerte werden geladen…": [.en: "📊 Loading nutrition facts...", .fr: "📊 Chargement des valeurs nutritionnelles...", .es: "📊 Cargando información nutricional...", .it: "📊 Caricamento dei valori nutrizionali...", .hi: "📊 पोषण तथ्य लोड किए जा रहे हैं..."],

        // ===== ONBOARDING: ACTIVITY / ALLERGIES / ANALYZING / APP MODE / BIRTHDATE =====
        "Wie aktiv bist du?": [.en: "How active are you?", .fr: "Quel est ton niveau d'activité ?", .es: "¿Qué tan activo eres?", .it: "Quanto sei attivo?", .hi: "आप कितने सक्रिय हैं?"],
        "Wenig aktiv": [.en: "Sedentary", .fr: "Peu actif", .es: "Poco activo", .it: "Poco attivo", .hi: "कम सक्रिय"],
        "0 Tage pro Woche": [.en: "0 days per week", .fr: "0 jour par semaine", .es: "0 días por semana", .it: "0 giorni a settimana", .hi: "सप्ताह में 0 दिन"],
        "Leicht aktiv": [.en: "Lightly active", .fr: "Légèrement actif", .es: "Ligeramente activo", .it: "Leggermente attivo", .hi: "हल्का सक्रिय"],
        "1–2 Tage pro Woche": [.en: "1–2 days per week", .fr: "1 à 2 jours par semaine", .es: "1-2 días por semana", .it: "1-2 giorni a settimana", .hi: "सप्ताह में 1–2 दिन"],
        "Aktiv": [.en: "Active", .fr: "Actif", .es: "Activo", .it: "Attivo", .hi: "सक्रिय"],
        "3–5 Tage pro Woche": [.en: "3–5 days per week", .fr: "3 à 5 jours par semaine", .es: "3-5 días por semana", .it: "3-5 giorni a settimana", .hi: "सप्ताह में 3–5 दिन"],
        "Sehr aktiv": [.en: "Very active", .fr: "Très actif", .es: "Muy activo", .it: "Molto attivo", .hi: "बहुत सक्रिय"],
        "6–7 Tage pro Woche": [.en: "6–7 days per week", .fr: "6 à 7 jours par semaine", .es: "6-7 días por semana", .it: "6-7 giorni a settimana", .hi: "सप्ताह में 6–7 दिन"],
        "Hast du Allergien oder Unverträglichkeiten?": [.en: "Do you have any allergies or intolerances?", .fr: "As-tu des allergies ou intolérances ?", .es: "¿Tienes alergias o intolerancias?", .it: "Hai allergie o intolleranze?", .hi: "क्या आपको कोई एलर्जी या असहिष्णुता है?"],
        "Keine Allergien": [.en: "No allergies", .fr: "Aucune allergie", .es: "Sin alergias", .it: "Nessuna allergia", .hi: "कोई एलर्जी नहीं"],
        "Erdnüsse": [.en: "Peanuts", .fr: "Arachides", .es: "Cacahuetes", .it: "Arachidi", .hi: "मूंगफली"],
        "Schalenfrüchte": [.en: "Tree nuts", .fr: "Fruits à coque", .es: "Frutos secos", .it: "Frutta a guscio", .hi: "मेवे"],
        "Milch": [.en: "Milk", .fr: "Lait", .es: "Leche", .it: "Latte", .hi: "दूध"],
        "Eier": [.en: "Eggs", .fr: "Œufs", .es: "Huevos", .it: "Uova", .hi: "अंडे"],
        "Fisch": [.en: "Fish", .fr: "Poisson", .es: "Pescado", .it: "Pesce", .hi: "मछली"],
        "Schalentiere": [.en: "Shellfish", .fr: "Crustacés", .es: "Mariscos", .it: "Crostacei", .hi: "शंख-मछली"],
        "Soja": [.en: "Soy", .fr: "Soja", .es: "Soja", .it: "Soia", .hi: "सोया"],
        "Weizen": [.en: "Wheat", .fr: "Blé", .es: "Trigo", .it: "Grano", .hi: "गेहूं"],
        "Andere": [.en: "Other", .fr: "Autre", .es: "Otro", .it: "Altro", .hi: "अन्य"],
        "Beschreibe deine Allergie…": [.en: "Describe your allergy...", .fr: "Décris ton allergie...", .es: "Describe tu alergia...", .it: "Descrivi la tua allergia...", .hi: "अपनी एलर्जी का वर्णन करें..."],
        "Körperdaten analysieren": [.en: "Analyzing body data", .fr: "Analyse des données corporelles", .es: "Analizando datos corporales", .it: "Analisi dei dati corporei", .hi: "शारीरिक डेटा का विश्लेषण"],
        "Kalorienbedarf berechnen": [.en: "Calculating calorie needs", .fr: "Calcul des besoins caloriques", .es: "Calculando necesidades calóricas", .it: "Calcolo del fabbisogno calorico", .hi: "कैलोरी आवश्यकता की गणना"],
        "Makronährstoffe festlegen": [.en: "Setting macronutrients", .fr: "Définition des macronutriments", .es: "Estableciendo macronutrientes", .it: "Impostazione dei macronutrienti", .hi: "मैक्रोन्यूट्रिएंट्स निर्धारित करना"],
        "KI-Plan personalisieren": [.en: "Personalizing AI plan", .fr: "Personnalisation du plan IA", .es: "Personalizando plan de IA", .it: "Personalizzazione del piano IA", .hi: "AI योजना को निजीकृत करना"],
        "Plan ist bereit": [.en: "Plan is ready", .fr: "Le plan est prêt", .es: "El plan está listo", .it: "Il piano è pronto", .hi: "योजना तैयार है"],
        "Plan ist bereit! 🎉": [.en: "Plan is ready! 🎉", .fr: "Le plan est prêt ! 🎉", .es: "¡El plan está listo! 🎉", .it: "Il piano è pronto! 🎉", .hi: "योजना तैयार है! 🎉"],
        "Dein Plan wird erstellt": [.en: "Your plan is being created", .fr: "Ton plan est en cours de création", .es: "Tu plan se está creando", .it: "Il tuo piano è in fase di creazione", .hi: "आपकी योजना बनाई जा रही है"],
        "KI berechnet deine optimalen Werte": [.en: "AI is calculating your optimal values", .fr: "L'IA calcule tes valeurs optimales", .es: "La IA está calculando tus valores óptimos", .it: "L'IA sta calcolando i tuoi valori ottimali", .hi: "AI आपके इष्टतम मूल्यों की गणना कर रहा है"],
        "Wie möchtest du Frigy verwenden?": [.en: "How would you like to use Frigy?", .fr: "Comment souhaites-tu utiliser Frigy ?", .es: "¿Cómo te gustaría usar Frigy?", .it: "Come vorresti usare Frigy?", .hi: "आप Frigy का उपयोग कैसे करना चाहेंगे?"],
        "Mit Wochenplan": [.en: "With a weekly plan", .fr: "Avec un plan hebdomadaire", .es: "Con un plan semanal", .it: "Con un piano settimanale", .hi: "साप्ताहिक योजना के साथ"],
        "Frigy plant deine Mahlzeiten für die ganze Woche": [.en: "Frigy plans your meals for the whole week", .fr: "Frigy planifie tes repas pour toute la semaine", .es: "Frigy planifica tus comidas para toda la semana", .it: "Frigy pianifica i tuoi pasti per tutta la settimana", .hi: "Frigy पूरे सप्ताह के लिए आपके भोजन की योजना बनाता है"],
        "Beliebt": [.en: "Popular", .fr: "Populaire", .es: "Popular", .it: "Popolare", .hi: "लोकप्रिय"],
        "Spontan tracken": [.en: "Track spontaneously", .fr: "Suivi spontané", .es: "Seguimiento espontáneo", .it: "Traccia spontaneamente", .hi: "स्वतःस्फूर्त ट्रैक करें"],
        "Trage ein was du isst, ohne festen Plan": [.en: "Log what you eat, without a fixed plan", .fr: "Enregistre ce que tu manges, sans plan fixe", .es: "Registra lo que comes, sin un plan fijo", .it: "Registra cosa mangi, senza un piano fisso", .hi: "बिना किसी निश्चित योजना के जो खाते हैं उसे लॉग करें"],
        "Wann wurdest du geboren?": [.en: "When were you born?", .fr: "Quand es-tu né(e) ?", .es: "¿Cuándo naciste?", .it: "Quando sei nato/a?", .hi: "आपका जन्म कब हुआ था?"],

        // ===== ONBOARDING: BODY BASICS / CAMERA / CELEBRATION / COMPARISON / COOKING =====
        "Körperdaten": [.en: "Body data", .fr: "Données corporelles", .es: "Datos corporales", .it: "Dati corporei", .hi: "शारीरिक डेटा"],
        "Damit Frigy deinen persönlichen Kalorienbedarf genau berechnen kann.": [.en: "So Frigy can accurately calculate your personal calorie needs.", .fr: "Pour que Frigy puisse calculer précisément tes besoins caloriques personnels.", .es: "Para que Frigy pueda calcular con precisión tus necesidades calóricas personales.", .it: "Affinché Frigy possa calcolare con precisione il tuo fabbisogno calorico personale.", .hi: "ताकि Frigy आपकी व्यक्तिगत कैलोरी आवश्यकताओं की सटीक गणना कर सके।"],
        "Aktuelles Gewicht": [.en: "Current weight", .fr: "Poids actuel", .es: "Peso actual", .it: "Peso attuale", .hi: "वर्तमान वजन"],
        "Ausgangspunkt für deinen Plan": [.en: "Starting point for your plan", .fr: "Point de départ de ton plan", .es: "Punto de partida para tu plan", .it: "Punto di partenza per il tuo piano", .hi: "आपकी योजना के लिए शुरुआती बिंदु"],
        "Körpergröße": [.en: "Height", .fr: "Taille", .es: "Estatura", .it: "Altezza", .hi: "ऊंचाई"],
        "Für den BMI-Berechnung": [.en: "For BMI calculation", .fr: "Pour le calcul de l'IMC", .es: "Para el cálculo del IMC", .it: "Per il calcolo del BMI", .hi: "BMI गणना के लिए"],
        "Alter": [.en: "Age", .fr: "Âge", .es: "Edad", .it: "Età", .hi: "आयु"],
        "Beeinflusst deinen Stoffwechsel": [.en: "Affects your metabolism", .fr: "Influence ton métabolisme", .es: "Afecta tu metabolismo", .it: "Influisce sul tuo metabolismo", .hi: "आपके चयापचय को प्रभावित करता है"],
        "Geschlecht": [.en: "Gender", .fr: "Sexe", .es: "Género", .it: "Genere", .hi: "लिंग"],
        "Für genaue Kalorienberechnung": [.en: "For accurate calorie calculation", .fr: "Pour un calcul calorique précis", .es: "Para un cálculo calórico preciso", .it: "Per un calcolo calorico preciso", .hi: "सटीक कैलोरी गणना के लिए"],
        "Verstanden": [.en: "Got it", .fr: "Compris", .es: "Entendido", .it: "Capito", .hi: "समझ गया"],
        "Kamera-Zugriff": [.en: "Camera access", .fr: "Accès à la caméra", .es: "Acceso a la cámara", .it: "Accesso alla fotocamera", .hi: "कैमरा एक्सेस"],
        "Für den Kühlschrank-Scan und Barcode-Scanner braucht Frigy deine Kamera.": [.en: "Frigy needs your camera for fridge scanning and the barcode scanner.", .fr: "Frigy a besoin de ta caméra pour scanner le réfrigérateur et les codes-barres.", .es: "Frigy necesita tu cámara para escanear la nevera y los códigos de barras.", .it: "Frigy ha bisogno della tua fotocamera per la scansione del frigorifero e dei codici a barre.", .hi: "फ्रिज स्कैन और बारकोड स्कैनर के लिए Frigy को आपके कैमरे की आवश्यकता है।"],
        "KI erkennt alle Zutaten per Foto": [.en: "AI recognizes all ingredients from a photo", .fr: "L'IA reconnaît tous les ingrédients à partir d'une photo", .es: "La IA reconoce todos los ingredientes a partir de una foto", .it: "L'IA riconosce tutti gli ingredienti da una foto", .hi: "AI एक फोटो से सभी सामग्री को पहचानता है"],
        "Barcode-Scanner": [.en: "Barcode scanner", .fr: "Scanner de codes-barres", .es: "Escáner de códigos de barras", .it: "Scanner di codici a barre", .hi: "बारकोड स्कैनर"],
        "Nährwerte direkt aus dem Barcode": [.en: "Nutrition facts directly from the barcode", .fr: "Valeurs nutritionnelles directement à partir du code-barres", .es: "Información nutricional directamente del código de barras", .it: "Valori nutrizionali direttamente dal codice a barre", .hi: "बारकोड से सीधे पोषण तथ्य"],
        "Kamera erlauben": [.en: "Allow camera", .fr: "Autoriser la caméra", .es: "Permitir cámara", .it: "Consenti fotocamera", .hi: "कैमरे की अनुमति दें"],
        "Überspringen": [.en: "Skip", .fr: "Passer", .es: "Omitir", .it: "Salta", .hi: "छोड़ें"],
        "Dein Plan ist fertig!": [.en: "Your plan is ready!", .fr: "Ton plan est prêt !", .es: "¡Tu plan está listo!", .it: "Il tuo piano è pronto!", .hi: "आपकी योजना तैयार है!"],
        "Alles ist eingerichtet. Starte jetzt\ndeine Reise zu einem gesünderen Ich.": [.en: "Everything is set up. Start your journey\nto a healthier you now.", .fr: "Tout est prêt. Commence maintenant\nton voyage vers un toi en meilleure santé.", .es: "Todo está listo. Comienza ahora\ntu viaje hacia un tú más saludable.", .it: "Tutto è pronto. Inizia ora\nil tuo viaggio verso un te più sano.", .hi: "सब कुछ तैयार है। अभी शुरू करें\nएक स्वस्थ स्वयं की ओर अपनी यात्रा।"],
        "Frigy starten": [.en: "Start Frigy", .fr: "Démarrer Frigy", .es: "Iniciar Frigy", .it: "Avvia Frigy", .hi: "Frigy शुरू करें"],
        "Mit & ohne Frigy": [.en: "With & without Frigy", .fr: "Avec & sans Frigy", .es: "Con & sin Frigy", .it: "Con & senza Frigy", .hi: "Frigy के साथ और बिना"],
        "Ohne Frigy": [.en: "Without Frigy", .fr: "Sans Frigy", .es: "Sin Frigy", .it: "Senza Frigy", .hi: "Frigy के बिना"],
        "Unstrukturiert essen": [.en: "Unstructured eating", .fr: "Alimentation désorganisée", .es: "Alimentación desorganizada", .it: "Alimentazione disorganizzata", .hi: "अव्यवस्थित खाना"],
        "Keine Übersicht": [.en: "No overview", .fr: "Aucune vue d'ensemble", .es: "Sin visión general", .it: "Nessuna panoramica", .hi: "कोई अवलोकन नहीं"],
        "Zeitaufwändiges Planen": [.en: "Time-consuming planning", .fr: "Planification chronophage", .es: "Planificación que consume tiempo", .it: "Pianificazione che richiede tempo", .hi: "समय लेने वाली योजना"],
        "Lebensmittel vergessen": [.en: "Forgotten groceries", .fr: "Aliments oubliés", .es: "Alimentos olvidados", .it: "Alimenti dimenticati", .hi: "भूले हुए खाद्य पदार्थ"],
        "Mit Frigy": [.en: "With Frigy", .fr: "Avec Frigy", .es: "Con Frigy", .it: "Con Frigy", .hi: "Frigy के साथ"],
        "Klarer Wochenplan": [.en: "Clear weekly plan", .fr: "Plan hebdomadaire clair", .es: "Plan semanal claro", .it: "Piano settimanale chiaro", .hi: "स्पष्ट साप्ताहिक योजना"],
        "Makros im Blick": [.en: "Macros at a glance", .fr: "Macros en un coup d'œil", .es: "Macros de un vistazo", .it: "Macro a colpo d'occhio", .hi: "एक नज़र में मैक्रो"],
        "Automatisch planen": [.en: "Automatic planning", .fr: "Planification automatique", .es: "Planificación automática", .it: "Pianificazione automatica", .hi: "स्वचालित योजना"],
        "Einkauf optimiert": [.en: "Optimized shopping", .fr: "Courses optimisées", .es: "Compras optimizadas", .it: "Spesa ottimizzata", .hi: "अनुकूलित खरीदारी"],
        "Wie sind deine Kochkenntnisse?": [.en: "What's your cooking experience?", .fr: "Quel est ton niveau en cuisine ?", .es: "¿Cuál es tu experiencia culinaria?", .it: "Qual è la tua esperienza in cucina?", .hi: "आपका खाना पकाने का अनुभव कैसा है?"],
        "Anfänger": [.en: "Beginner", .fr: "Débutant", .es: "Principiante", .it: "Principiante", .hi: "शुरुआती"],
        "Einfache Rezepte mit wenigen Zutaten": [.en: "Simple recipes with few ingredients", .fr: "Recettes simples avec peu d'ingrédients", .es: "Recetas simples con pocos ingredientes", .it: "Ricette semplici con pochi ingredienti", .hi: "कुछ सामग्री वाली सरल रेसिपी"],
        "Fortgeschritten": [.en: "Intermediate", .fr: "Intermédiaire", .es: "Intermedio", .it: "Intermedio", .hi: "मध्यवर्ती"],
        "Ich koche gerne & experimentiere": [.en: "I enjoy cooking & experimenting", .fr: "J'aime cuisiner et expérimenter", .es: "Me gusta cocinar y experimentar", .it: "Mi piace cucinare e sperimentare", .hi: "मुझे खाना बनाना और प्रयोग करना पसंद है"],
        "Profi": [.en: "Expert", .fr: "Expert", .es: "Experto", .it: "Esperto", .hi: "विशेषज्ञ"],
        "Komplexe Gerichte & Techniken": [.en: "Complex dishes & techniques", .fr: "Plats et techniques complexes", .es: "Platos y técnicas complejas", .it: "Piatti e tecniche complesse", .hi: "जटिल व्यंजन और तकनीकें"],

        // ===== ONBOARDING: COOKING TIME / DIETARY PREFERENCES / FRIDGE INTRO / GENDER / GENERIC INFO =====
        "Wie viel Zeit nimmst du dir zum Kochen?": [.en: "How much time do you spend cooking?", .fr: "Combien de temps consacres-tu à la cuisine ?", .es: "¿Cuánto tiempo dedicas a cocinar?", .it: "Quanto tempo dedichi alla cucina?", .hi: "आप खाना पकाने में कितना समय देते हैं?"],
        "< 30 Minuten": [.en: "< 30 minutes", .fr: "< 30 minutes", .es: "< 30 minutos", .it: "< 30 minuti", .hi: "< 30 मिनट"],
        "Schnelle Gerichte für den Alltag": [.en: "Quick meals for everyday life", .fr: "Repas rapides pour le quotidien", .es: "Comidas rápidas para el día a día", .it: "Pasti veloci per la vita quotidiana", .hi: "रोज़मर्रा के लिए त्वरित भोजन"],
        "30–60 Minuten": [.en: "30–60 minutes", .fr: "30 à 60 minutes", .es: "30–60 minutos", .it: "30–60 minuti", .hi: "30–60 मिनट"],
        "Ausgewogene Mahlzeiten mit mehr Abwechslung": [.en: "Balanced meals with more variety", .fr: "Repas équilibrés avec plus de variété", .es: "Comidas equilibradas con más variedad", .it: "Pasti equilibrati con più varietà", .hi: "अधिक विविधता वाले संतुलित भोजन"],
        "> 60 Minuten": [.en: "> 60 minutes", .fr: "> 60 minutes", .es: "> 60 minutos", .it: "> 60 minuti", .hi: "> 60 मिनट"],
        "Aufwändige Gerichte & Meal Prep": [.en: "Elaborate dishes & meal prep", .fr: "Plats élaborés et meal prep", .es: "Platos elaborados y meal prep", .it: "Piatti elaborati e meal prep", .hi: "विस्तृत व्यंजन और मील प्रेप"],

        "Wie ist dein Ernährungsziel?": [.en: "What's your dietary goal?", .fr: "Quel est ton objectif alimentaire ?", .es: "¿Cuál es tu objetivo alimenticio?", .it: "Qual è il tuo obiettivo alimentare?", .hi: "आपका आहार लक्ष्य क्या है?"],
        "Ausgewogene Ernährung": [.en: "Balanced diet", .fr: "Alimentation équilibrée", .es: "Dieta equilibrada", .it: "Dieta equilibrata", .hi: "संतुलित आहार"],
        "Vegan": [.en: "Vegan", .fr: "Végan", .es: "Vegano", .it: "Vegano", .hi: "शाकाहारी (वीगन)"],
        "Vegetarisch": [.en: "Vegetarian", .fr: "Végétarien", .es: "Vegetariano", .it: "Vegetariano", .hi: "शाकाहारी"],
        "Keto-Diät": [.en: "Keto diet", .fr: "Régime cétogène", .es: "Dieta keto", .it: "Dieta keto", .hi: "कीटो आहार"],
        "Kohlenhydratarme Diät": [.en: "Low-carb diet", .fr: "Régime pauvre en glucides", .es: "Dieta baja en carbohidratos", .it: "Dieta a basso contenuto di carboidrati", .hi: "कम कार्ब आहार"],
        "Paleo-Diät": [.en: "Paleo diet", .fr: "Régime paléo", .es: "Dieta paleo", .it: "Dieta paleo", .hi: "पेलियो आहार"],

        "Dein Kühlschrank": [.en: "Your fridge", .fr: "Ton réfrigérateur", .es: "Tu nevera", .it: "Il tuo frigorifero", .hi: "आपका फ्रिज"],
        "Scanne deinen Kühlschrank und lass Frigy den Rest erledigen.": [.en: "Scan your fridge and let Frigy do the rest.", .fr: "Scanne ton réfrigérateur et laisse Frigy faire le reste.", .es: "Escanea tu nevera y deja que Frigy haga el resto.", .it: "Scansiona il tuo frigorifero e lascia che Frigy faccia il resto.", .hi: "अपना फ्रिज स्कैन करें और बाकी काम Frigy पर छोड़ दें।"],
        "Foto aufnehmen": [.en: "Take a photo", .fr: "Prendre une photo", .es: "Tomar una foto", .it: "Scatta una foto", .hi: "फोटो लें"],
        "KI erkennt Lebensmittel": [.en: "AI recognizes groceries", .fr: "L'IA reconnaît les aliments", .es: "La IA reconoce los alimentos", .it: "L'IA riconosce gli alimenti", .hi: "AI खाद्य पदार्थों को पहचानता है"],
        "Rezepte aus deinen Zutaten": [.en: "Recipes from your ingredients", .fr: "Recettes à partir de tes ingrédients", .es: "Recetas con tus ingredientes", .it: "Ricette dai tuoi ingredienti", .hi: "आपकी सामग्री से रेसिपी"],
        "Weniger Lebensmittelverschwendung": [.en: "Less food waste", .fr: "Moins de gaspillage alimentaire", .es: "Menos desperdicio de alimentos", .it: "Meno spreco alimentare", .hi: "कम खाद्य बर्बादी"],

        "Was ist dein biologisches Geschlecht?": [.en: "What's your biological sex?", .fr: "Quel est ton sexe biologique ?", .es: "¿Cuál es tu sexo biológico?", .it: "Qual è il tuo sesso biologico?", .hi: "आपका जैविक लिंग क्या है?"],
        "Männlich": [.en: "Male", .fr: "Homme", .es: "Hombre", .it: "Uomo", .hi: "पुरुष"],
        "Weiblich": [.en: "Female", .fr: "Femme", .es: "Mujer", .it: "Donna", .hi: "महिला"],
        "Non-Binär / Divers": [.en: "Non-binary / Other", .fr: "Non-binaire / Divers", .es: "No binario / Otro", .it: "Non binario / Altro", .hi: "नॉन-बाइनरी / अन्य"],

        "Willkommen bei Frigy!": [.en: "Welcome to Frigy!", .fr: "Bienvenue chez Frigy !", .es: "¡Bienvenido a Frigy!", .it: "Benvenuto su Frigy!", .hi: "Frigy में आपका स्वागत है!"],
        "Was ist dein Ziel?": [.en: "What's your goal?", .fr: "Quel est ton objectif ?", .es: "¿Cuál es tu objetivo?", .it: "Qual è il tuo obiettivo?", .hi: "आपका लक्ष्य क्या है?"],
        "Was motiviert dich?": [.en: "What motivates you?", .fr: "Qu'est-ce qui te motive ?", .es: "¿Qué te motiva?", .it: "Cosa ti motiva?", .hi: "आपको क्या प्रेरित करता है?"],
        "Andere schaffen es — du auch!": [.en: "Others have made it — you can too!", .fr: "D'autres y sont arrivés — toi aussi !", .es: "Otros lo han logrado — ¡tú también puedes!", .it: "Altri ce l'hanno fatta — anche tu puoi!", .hi: "दूसरों ने यह कर दिखाया है — आप भी कर सकते हैं!"],
        "So funktioniert Frigy": [.en: "How Frigy works", .fr: "Comment fonctionne Frigy", .es: "Cómo funciona Frigy", .it: "Come funziona Frigy", .hi: "Frigy कैसे काम करता है"],
        "KI-Scan Feedback": [.en: "AI scan feedback", .fr: "Retour du scan IA", .es: "Comentarios del escaneo IA", .it: "Feedback della scansione IA", .hi: "AI स्कैन फीडबैक"],
        "Wie es funktioniert": [.en: "How it works", .fr: "Comment ça marche", .es: "Cómo funciona", .it: "Come funziona", .hi: "यह कैसे काम करता है"],
        "Berechtigungen": [.en: "Permissions", .fr: "Autorisations", .es: "Permisos", .it: "Autorizzazioni", .hi: "अनुमतियाँ"],
        "Erinnerungen": [.en: "Reminders", .fr: "Rappels", .es: "Recordatorios", .it: "Promemoria", .hi: "अनुस्मारक"],
        "Dein Wochenplan": [.en: "Your weekly plan", .fr: "Ton plan hebdomadaire", .es: "Tu plan semanal", .it: "Il tuo piano settimanale", .hi: "आपकी साप्ताहिक योजना"],
        "Vergleich": [.en: "Comparison", .fr: "Comparaison", .es: "Comparación", .it: "Confronto", .hi: "तुलना"],
        "Deine Transformation": [.en: "Your transformation", .fr: "Ta transformation", .es: "Tu transformación", .it: "La tua trasformazione", .hi: "आपका परिवर्तन"],
        "Kurzes Tutorial": [.en: "Quick tutorial", .fr: "Tutoriel rapide", .es: "Tutorial rápido", .it: "Tutorial rapido", .hi: "त्वरित ट्यूटोरियल"],
        "Mahlzeiten tracken": [.en: "Track meals", .fr: "Suivre les repas", .es: "Registrar comidas", .it: "Traccia i pasti", .hi: "भोजन ट्रैक करें"],
        "Einführung": [.en: "Introduction", .fr: "Introduction", .es: "Introducción", .it: "Introduzione", .hi: "परिचय"],
        "Dein Plan ist bereit": [.en: "Your plan is ready", .fr: "Ton plan est prêt", .es: "Tu plan está listo", .it: "Il tuo piano è pronto", .hi: "आपकी योजना तैयार है"],
        "Wie viel Zeit zum Kochen?": [.en: "How much time to cook?", .fr: "Combien de temps pour cuisiner ?", .es: "¿Cuánto tiempo para cocinar?", .it: "Quanto tempo per cucinare?", .hi: "खाना पकाने में कितना समय?"],
        "Kochkenntnisse": [.en: "Cooking experience", .fr: "Expérience culinaire", .es: "Experiencia culinaria", .it: "Esperienza culinaria", .hi: "खाना पकाने का अनुभव"],
        "Planung einrichten": [.en: "Set up planning", .fr: "Configurer la planification", .es: "Configurar la planificación", .it: "Configura la pianificazione", .hi: "योजना सेट करें"],
        "Ziel-Modus": [.en: "Goal mode", .fr: "Mode objectif", .es: "Modo objetivo", .it: "Modalità obiettivo", .hi: "लक्ष्य मोड"],
        "Zielauswahl": [.en: "Goal selection", .fr: "Sélection de l'objectif", .es: "Selección de objetivo", .it: "Selezione obiettivo", .hi: "लक्ष्य चयन"],
        "Modus wählen": [.en: "Choose mode", .fr: "Choisir le mode", .es: "Elegir modo", .it: "Scegli modalità", .hi: "मोड चुनें"],
        "Spontan-Modus": [.en: "Spontaneous mode", .fr: "Mode spontané", .es: "Modo espontáneo", .it: "Modalità spontanea", .hi: "स्वतःस्फूर्त मोड"],
        "Strukturierter Modus": [.en: "Structured mode", .fr: "Mode structuré", .es: "Modo estructurado", .it: "Modalità strutturata", .hi: "संरचित मोड"],
        "Profil einrichten": [.en: "Set up profile", .fr: "Configurer le profil", .es: "Configurar el perfil", .it: "Configura il profilo", .hi: "प्रोफ़ाइल सेट करें"],
        "Sprache wählen": [.en: "Choose language", .fr: "Choisir la langue", .es: "Elegir idioma", .it: "Scegli la lingua", .hi: "भाषा चुनें"],
        "Lass uns gemeinsam deine Ernährung verbessern.": [.en: "Let's improve your nutrition together.", .fr: "Améliorons ton alimentation ensemble.", .es: "Mejoremos juntos tu alimentación.", .it: "Miglioriamo insieme la tua alimentazione.", .hi: "आइए मिलकर आपके पोषण को बेहतर बनाएं।"],
        "Tausende Nutzer haben bereits ihr Ziel erreicht.": [.en: "Thousands of users have already reached their goal.", .fr: "Des milliers d'utilisateurs ont déjà atteint leur objectif.", .es: "Miles de usuarios ya han alcanzado su objetivo.", .it: "Migliaia di utenti hanno già raggiunto il loro obiettivo.", .hi: "हजारों उपयोगकर्ता पहले ही अपना लक्ष्य प्राप्त कर चुके हैं।"],
        "KI erstellt deinen personalisierten Wochenplan.": [.en: "AI creates your personalized weekly plan.", .fr: "L'IA crée ton plan hebdomadaire personnalisé.", .es: "La IA crea tu plan semanal personalizado.", .it: "L'IA crea il tuo piano settimanale personalizzato.", .hi: "AI आपकी व्यक्तिगत साप्ताहिक योजना बनाता है।"],
        "Scanne deinen Kühlschrank und wir schlagen Rezepte vor.": [.en: "Scan your fridge and we'll suggest recipes.", .fr: "Scanne ton réfrigérateur et nous te proposerons des recettes.", .es: "Escanea tu nevera y te sugeriremos recetas.", .it: "Scansiona il tuo frigorifero e ti suggeriremo delle ricette.", .hi: "अपना फ्रिज स्कैन करें और हम रेसिपी सुझाएंगे।"],

        // ===== ONBOARDING: GOAL MODE / GOAL PREVIEW / GOAL SELECTION / GOAL / HEALTH GOALS =====
        "Welchen Modus bevorzugst du?": [.en: "Which mode do you prefer?", .fr: "Quel mode préfères-tu ?", .es: "¿Qué modo prefieres?", .it: "Quale modalità preferisci?", .hi: "आप किस मोड को प्राथमिकता देते हैं?"],
        "Strikt": [.en: "Strict", .fr: "Strict", .es: "Estricto", .it: "Rigoroso", .hi: "सख्त"],
        "Klare Regeln, schnellere Ergebnisse": [.en: "Clear rules, faster results", .fr: "Règles claires, résultats plus rapides", .es: "Reglas claras, resultados más rápidos", .it: "Regole chiare, risultati più rapidi", .hi: "स्पष्ट नियम, तेज़ परिणाम"],
        "Ausgewogen": [.en: "Balanced", .fr: "Équilibré", .es: "Equilibrado", .it: "Equilibrato", .hi: "संतुलित"],
        "Nachhaltig & langfristig": [.en: "Sustainable & long-term", .fr: "Durable et à long terme", .es: "Sostenible y a largo plazo", .it: "Sostenibile e a lungo termine", .hi: "टिकाऊ और दीर्घकालिक"],
        "Flexibel": [.en: "Flexible", .fr: "Flexible", .es: "Flexible", .it: "Flessibile", .hi: "लचीला"],
        "Lockerer Ansatz mit Spielraum": [.en: "Relaxed approach with room to flex", .fr: "Approche détendue avec marge de manœuvre", .es: "Enfoque relajado con margen de maniobra", .it: "Approccio rilassato con margine di manovra", .hi: "लचीलेपन के साथ आरामदायक दृष्टिकोण"],

        "BEREIT, %@ KG ABZUNEHMEN — EIN ERREICHBARES ZIEL!": [.en: "READY TO LOSE %@ KG — AN ACHIEVABLE GOAL!", .fr: "PRÊT À PERDRE %@ KG — UN OBJECTIF ATTEIGNABLE !", .es: "LISTO PARA PERDER %@ KG — ¡UN OBJETIVO ALCANZABLE!", .it: "PRONTO A PERDERE %@ KG — UN OBIETTIVO RAGGIUNGIBILE!", .hi: "%@ किलो वजन कम करने के लिए तैयार — एक प्राप्य लक्ष्य!"],
        "BEREIT, %@ KG ZUZUNEHMEN — EIN ERREICHBARES ZIEL!": [.en: "READY TO GAIN %@ KG — AN ACHIEVABLE GOAL!", .fr: "PRÊT À PRENDRE %@ KG — UN OBJECTIF ATTEIGNABLE !", .es: "LISTO PARA GANAR %@ KG — ¡UN OBJETIVO ALCANZABLE!", .it: "PRONTO A PRENDERE %@ KG — UN OBIETTIVO RAGGIUNGIBILE!", .hi: "%@ किलो वजन बढ़ाने के लिए तैयार — एक प्राप्य लक्ष्य!"],
        "BEREIT, DEIN GEWICHT ZU HALTEN — EIN ERREICHBARES ZIEL!": [.en: "READY TO MAINTAIN YOUR WEIGHT — AN ACHIEVABLE GOAL!", .fr: "PRÊT À MAINTENIR TON POIDS — UN OBJECTIF ATTEIGNABLE !", .es: "LISTO PARA MANTENER TU PESO — ¡UN OBJETIVO ALCANZABLE!", .it: "PRONTO A MANTENERE IL TUO PESO — UN OBIETTIVO RAGGIUNGIBILE!", .hi: "अपना वजन बनाए रखने के लिए तैयार — एक प्राप्य लक्ष्य!"],
        "Illustrativer Vergleich aus deinen Angaben — nur motivierend, keine medizinische Prognose.": [.en: "Illustrative comparison based on your data — for motivation only, not a medical prediction.", .fr: "Comparaison illustrative basée sur tes données — à titre motivationnel uniquement, pas une prédiction médicale.", .es: "Comparación ilustrativa basada en tus datos — solo con fines motivacionales, no es una predicción médica.", .it: "Confronto illustrativo basato sui tuoi dati — solo a scopo motivazionale, non una previsione medica.", .hi: "आपके डेटा पर आधारित उदाहरणात्मक तुलना — केवल प्रेरणा के लिए, कोई चिकित्सा भविष्यवाणी नहीं।"],
        "Dein Gewicht": [.en: "Your weight", .fr: "Ton poids", .es: "Tu peso", .it: "Il tuo peso", .hi: "आपका वजन"],

        "Wie möchtest du Frigy nutzen?": [.en: "How do you want to use Frigy?", .fr: "Comment veux-tu utiliser Frigy ?", .es: "¿Cómo quieres usar Frigy?", .it: "Come vuoi usare Frigy?", .hi: "आप Frigy का उपयोग कैसे करना चाहते हैं?"],
        "Strukturiert": [.en: "Structured", .fr: "Structuré", .es: "Estructurado", .it: "Strutturato", .hi: "संरचित"],
        "Wochenpläne mit festen Mahlzeiten & Einkaufslisten": [.en: "Weekly plans with fixed meals & shopping lists", .fr: "Plans hebdomadaires avec repas fixes et listes de courses", .es: "Planes semanales con comidas fijas y listas de compras", .it: "Piani settimanali con pasti fissi e liste della spesa", .hi: "निश्चित भोजन और खरीदारी सूची के साथ साप्ताहिक योजनाएं"],
        "Empfohlen": [.en: "Recommended", .fr: "Recommandé", .es: "Recomendado", .it: "Consigliato", .hi: "अनुशंसित"],
        "Spontan": [.en: "Spontaneous", .fr: "Spontané", .es: "Espontáneo", .it: "Spontaneo", .hi: "स्वतःस्फूर्त"],
        "Flexibel tracken ohne feste Pläne": [.en: "Track flexibly without fixed plans", .fr: "Suivi flexible sans plans fixes", .es: "Seguimiento flexible sin planes fijos", .it: "Monitoraggio flessibile senza piani fissi", .hi: "बिना निश्चित योजनाओं के लचीला ट्रैकिंग"],

        "Abnehmen": [.en: "Lose weight", .fr: "Perdre du poids", .es: "Perder peso", .it: "Perdere peso", .hi: "वजन कम करें"],
        "Körperfett reduzieren & leichter werden": [.en: "Reduce body fat & get lighter", .fr: "Réduire la graisse corporelle et s'alléger", .es: "Reducir la grasa corporal y bajar de peso", .it: "Ridurre il grasso corporeo e diventare più leggero", .hi: "शरीर की चर्बी कम करें और हल्के बनें"],
        "Gewicht halten": [.en: "Maintain weight", .fr: "Maintenir le poids", .es: "Mantener el peso", .it: "Mantenere il peso", .hi: "वजन बनाए रखें"],
        "Gesund bleiben & Gewicht stabilisieren": [.en: "Stay healthy & stabilize weight", .fr: "Rester en bonne santé et stabiliser son poids", .es: "Mantenerse saludable y estabilizar el peso", .it: "Rimanere in salute e stabilizzare il peso", .hi: "स्वस्थ रहें और वजन स्थिर करें"],
        "Zunehmen": [.en: "Gain weight", .fr: "Prendre du poids", .es: "Ganar peso", .it: "Aumentare di peso", .hi: "वजन बढ़ाएं"],
        "Muskeln aufbauen & Körpergewicht steigern": [.en: "Build muscle & increase body weight", .fr: "Développer les muscles et augmenter le poids corporel", .es: "Desarrollar músculo y aumentar el peso corporal", .it: "Costruire muscoli e aumentare il peso corporeo", .hi: "मांसपेशियां बनाएं और शरीर का वजन बढ़ाएं"],

        "Was möchtest du erreichen?": [.en: "What do you want to achieve?", .fr: "Que veux-tu accomplir ?", .es: "¿Qué quieres lograr?", .it: "Cosa vuoi ottenere?", .hi: "आप क्या हासिल करना चाहते हैं?"],
        "Fitness & Straffung": [.en: "Fitness & toning", .fr: "Fitness et tonification", .es: "Fitness y tonificación", .it: "Fitness e tonificazione", .hi: "फिटनेस और टोनिंग"],
        "Sportliche Leistung verbessern": [.en: "Improve athletic performance", .fr: "Améliorer les performances sportives", .es: "Mejorar el rendimiento deportivo", .it: "Migliorare le prestazioni sportive", .hi: "खेल प्रदर्शन में सुधार करें"],
        "Entzündungshemmende Ernährung": [.en: "Anti-inflammatory diet", .fr: "Alimentation anti-inflammatoire", .es: "Dieta antiinflamatoria", .it: "Dieta antinfiammatoria", .hi: "सूजनरोधी आहार"],
        "Energie steigern": [.en: "Increase energy", .fr: "Augmenter l'énergie", .es: "Aumentar la energía", .it: "Aumentare l'energia", .hi: "ऊर्जा बढ़ाएं"],
        "Ernährung während der Schwangerschaft": [.en: "Nutrition during pregnancy", .fr: "Alimentation pendant la grossesse", .es: "Nutrición durante el embarazo", .it: "Alimentazione durante la gravidanza", .hi: "गर्भावस्था के दौरान पोषण"],
        "Verdauungsgesundheit verbessern": [.en: "Improve digestive health", .fr: "Améliorer la santé digestive", .es: "Mejorar la salud digestiva", .it: "Migliorare la salute digestiva", .hi: "पाचन स्वास्थ्य में सुधार करें"],
    ]
}
