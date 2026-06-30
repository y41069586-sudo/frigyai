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

        // ===== ONBOARDING: HEIGHT / HOW IT WORKS / INTRO / LANGUAGE SELECT / MACRO PREVIEW =====
        "Wie groß bist du?": [.en: "How tall are you?", .fr: "Quelle est ta taille ?", .es: "¿Cuánto mides?", .it: "Quanto sei alto?", .hi: "आपकी ऊंचाई कितनी है?"],
        "Metrisch": [.en: "Metric", .fr: "Métrique", .es: "Métrico", .it: "Metrico", .hi: "मीट्रिक"],
        "Imperial": [.en: "Imperial", .fr: "Impérial", .es: "Imperial", .it: "Imperiale", .hi: "इंपीरियल"],

        "Frigy kombiniert KI-Technologie mit deinen persönlichen Daten für perfekte Ergebnisse.": [.en: "Frigy combines AI technology with your personal data for perfect results.", .fr: "Frigy combine la technologie IA avec tes données personnelles pour des résultats parfaits.", .es: "Frigy combina tecnología de IA con tus datos personales para obtener resultados perfectos.", .it: "Frigy combina la tecnologia IA con i tuoi dati personali per risultati perfetti.", .hi: "Frigy सही परिणामों के लिए AI तकनीक को आपके व्यक्तिगत डेटा के साथ जोड़ता है।"],
        "Profil erstellen": [.en: "Create profile", .fr: "Créer un profil", .es: "Crear perfil", .it: "Crea profilo", .hi: "प्रोफ़ाइल बनाएं"],
        "Teile deine Ziele und Körperdaten": [.en: "Share your goals and body data", .fr: "Partage tes objectifs et données corporelles", .es: "Comparte tus objetivos y datos corporales", .it: "Condividi i tuoi obiettivi e dati corporei", .hi: "अपने लक्ष्य और शारीरिक डेटा साझा करें"],
        "KI analysiert dich": [.en: "AI analyzes you", .fr: "L'IA t'analyse", .es: "La IA te analiza", .it: "L'IA ti analizza", .hi: "AI आपका विश्लेषण करता है"],
        "Frigy berechnet deine optimalen Nährwerte": [.en: "Frigy calculates your optimal nutritional values", .fr: "Frigy calcule tes valeurs nutritionnelles optimales", .es: "Frigy calcula tus valores nutricionales óptimos", .it: "Frigy calcola i tuoi valori nutrizionali ottimali", .hi: "Frigy आपके इष्टतम पोषण मूल्यों की गणना करता है"],
        "Plan erhalten": [.en: "Receive plan", .fr: "Recevoir le plan", .es: "Recibir plan", .it: "Ricevi il piano", .hi: "योजना प्राप्त करें"],
        "Personalisierter Wochenplan in Sekunden": [.en: "Personalized weekly plan in seconds", .fr: "Plan hebdomadaire personnalisé en quelques secondes", .es: "Plan semanal personalizado en segundos", .it: "Piano settimanale personalizzato in pochi secondi", .hi: "सेकंडों में व्यक्तिगत साप्ताहिक योजना"],
        "Fortschritt sehen": [.en: "See progress", .fr: "Voir les progrès", .es: "Ver progreso", .it: "Vedi i progressi", .hi: "प्रगति देखें"],
        "Tracke täglich und erreiche dein Ziel": [.en: "Track daily and reach your goal", .fr: "Suis tes progrès chaque jour et atteins ton objectif", .es: "Registra a diario y alcanza tu objetivo", .it: "Monitora ogni giorno e raggiungi il tuo obiettivo", .hi: "रोज़ ट्रैक करें और अपना लक्ष्य प्राप्त करें"],

        "Willkommen bei Frigy": [.en: "Welcome to Frigy", .fr: "Bienvenue chez Frigy", .es: "Bienvenido a Frigy", .it: "Benvenuto su Frigy", .hi: "Frigy में आपका स्वागत है"],
        "Dein persönlicher KI-Ernährungsassistent für eine gesündere Lebensweise.": [.en: "Your personal AI nutrition assistant for a healthier lifestyle.", .fr: "Ton assistant nutritionnel IA personnel pour un mode de vie plus sain.", .es: "Tu asistente nutricional de IA personal para un estilo de vida más saludable.", .it: "Il tuo assistente nutrizionale IA personale per uno stile di vita più sano.", .hi: "स्वस्थ जीवनशैली के लिए आपका व्यक्तिगत AI पोषण सहायक।"],
        "Personalisierte Ernährungspläne": [.en: "Personalized nutrition plans", .fr: "Plans nutritionnels personnalisés", .es: "Planes nutricionales personalizados", .it: "Piani nutrizionali personalizzati", .hi: "व्यक्तिगत पोषण योजनाएं"],
        "KI-gestützte Kühlschrank-Erkennung": [.en: "AI-powered fridge recognition", .fr: "Reconnaissance du réfrigérateur par IA", .es: "Reconocimiento de nevera con IA", .it: "Riconoscimento del frigorifero basato su IA", .hi: "AI-संचालित फ्रिज पहचान"],
        "Automatische Einkaufsliste": [.en: "Automatic shopping list", .fr: "Liste de courses automatique", .es: "Lista de compras automática", .it: "Lista della spesa automatica", .hi: "स्वचालित खरीदारी सूची"],
        "Kalorien & Makros tracken": [.en: "Track calories & macros", .fr: "Suivre les calories et les macros", .es: "Registrar calorías y macros", .it: "Traccia calorie e macro", .hi: "कैलोरी और मैक्रो ट्रैक करें"],
        "Jetzt starten": [.en: "Get started now", .fr: "Commencer maintenant", .es: "Empezar ahora", .it: "Inizia ora", .hi: "अभी शुरू करें"],

        "Dein täglicher\nErnährungsplan": [.en: "Your daily\nnutrition plan", .fr: "Ton plan\nnutritionnel quotidien", .es: "Tu plan\nnutricional diario", .it: "Il tuo piano\nnutrizionale giornaliero", .hi: "आपकी दैनिक\nपोषण योजना"],
        "Werte anpassen": [.en: "Adjust values", .fr: "Ajuster les valeurs", .es: "Ajustar valores", .it: "Regola i valori", .hi: "मान समायोजित करें"],
        "KI-berechnet · Basierend auf deinen Angaben": [.en: "AI-calculated · Based on your data", .fr: "Calculé par IA · Basé sur tes données", .es: "Calculado por IA · Basado en tus datos", .it: "Calcolato dall'IA · Basato sui tuoi dati", .hi: "AI-गणना · आपके डेटा पर आधारित"],
        "Plan starten": [.en: "Start plan", .fr: "Démarrer le plan", .es: "Iniciar plan", .it: "Avvia piano", .hi: "योजना शुरू करें"],
        "kcal / Tag": [.en: "kcal / day", .fr: "kcal / jour", .es: "kcal / día", .it: "kcal / giorno", .hi: "kcal / दिन"],
        "Kohlenhydrate": [.en: "Carbs", .fr: "Glucides", .es: "Carbohidratos", .it: "Carboidrati", .hi: "कार्बोहाइड्रेट"],
        "Fett": [.en: "Fat", .fr: "Lipides", .es: "Grasa", .it: "Grassi", .hi: "वसा"],
        "· %@%%": [.en: "· %@%%", .fr: "· %@%%", .es: "· %@%%", .it: "· %@%%", .hi: "· %@%%"],
        "Kalorien": [.en: "Calories", .fr: "Calories", .es: "Calorías", .it: "Calorie", .hi: "कैलोरी"],
        "Auf empfohlene Werte zurücksetzen": [.en: "Reset to recommended values", .fr: "Réinitialiser aux valeurs recommandées", .es: "Restablecer a los valores recomendados", .it: "Ripristina i valori consigliati", .hi: "अनुशंसित मानों पर रीसेट करें"],
        "Plan anpassen": [.en: "Adjust plan", .fr: "Ajuster le plan", .es: "Ajustar plan", .it: "Regola piano", .hi: "योजना समायोजित करें"],
        "Grundumsatz-Berechnung": [.en: "Basal metabolic rate calculation", .fr: "Calcul du métabolisme de base", .es: "Cálculo de la tasa metabólica basal", .it: "Calcolo del metabolismo basale", .hi: "बेसल चयापचय दर गणना"],
        "TDEE Aktivitätsfaktoren": [.en: "TDEE activity factors", .fr: "Facteurs d'activité TDEE", .es: "Factores de actividad TDEE", .it: "Fattori di attività TDEE", .hi: "TDEE गतिविधि कारक"],
        "Gesamtenergieverbrauch": [.en: "Total energy expenditure", .fr: "Dépense énergétique totale", .es: "Gasto energético total", .it: "Dispendio energetico totale", .hi: "कुल ऊर्जा व्यय"],
        "Protein: 2g/kg Körpergewicht": [.en: "Protein: 2g/kg body weight", .fr: "Protéines : 2 g/kg de poids corporel", .es: "Proteína: 2 g/kg de peso corporal", .it: "Proteine: 2 g/kg di peso corporeo", .hi: "प्रोटीन: 2 ग्राम/किग्रा शरीर का वजन"],
        "ISSN Protein-Empfehlung": [.en: "ISSN protein recommendation", .fr: "Recommandation de protéines ISSN", .es: "Recomendación de proteína ISSN", .it: "Raccomandazione proteica ISSN", .hi: "ISSN प्रोटीन सिफारिश"],
        "Defizit: 7700 kcal/kg": [.en: "Deficit: 7700 kcal/kg", .fr: "Déficit : 7700 kcal/kg", .es: "Déficit: 7700 kcal/kg", .it: "Deficit: 7700 kcal/kg", .hi: "घाटा: 7700 kcal/kg"],
        "Energiebilanz-Regel": [.en: "Energy balance rule", .fr: "Règle de l'équilibre énergétique", .es: "Regla del balance energético", .it: "Regola del bilancio energetico", .hi: "ऊर्जा संतुलन नियम"],
        "Berechnung basiert auf folgenden wissenschaftlichen Formeln:": [.en: "Calculation based on the following scientific formulas:", .fr: "Calcul basé sur les formules scientifiques suivantes :", .es: "Cálculo basado en las siguientes fórmulas científicas:", .it: "Calcolo basato sulle seguenti formule scientifiche:", .hi: "निम्नलिखित वैज्ञानिक सूत्रों पर आधारित गणना:"],

        // ===== ONBOARDING: MAIN GOAL / MOTIVATION / NAME INPUT / PAYWALL / PERMISSIONS =====
        "Gewicht": [.en: "Weight", .fr: "Poids", .es: "Peso", .it: "Peso", .hi: "वजन"],
        "abnehmen": [.en: "lose", .fr: "perdre", .es: "perder", .it: "perdere", .hi: "कम करना"],
        "beibehalten": [.en: "maintain", .fr: "maintenir", .es: "mantener", .it: "mantenere", .hi: "बनाए रखना"],
        "zulegen": [.en: "gain", .fr: "prendre", .es: "ganar", .it: "aumentare", .hi: "बढ़ाना"],
        "Besser aussehen": [.en: "Look better", .fr: "Mieux paraître", .es: "Verse mejor", .it: "Apparire meglio", .hi: "बेहतर दिखना"],
        "Körper formen & definieren": [.en: "Shape & define your body", .fr: "Façonner et définir son corps", .es: "Moldear y definir el cuerpo", .it: "Modellare e definire il corpo", .hi: "शरीर को आकार दें और परिभाषित करें"],
        "Gesünder leben": [.en: "Live healthier", .fr: "Vivre plus sainement", .es: "Vivir más saludable", .it: "Vivere più sano", .hi: "स्वस्थ जीवन जिएं"],
        "Wohlbefinden & Energie steigern": [.en: "Boost wellbeing & energy", .fr: "Améliorer le bien-être et l'énergie", .es: "Aumentar el bienestar y la energía", .it: "Aumentare benessere ed energia", .hi: "तंदुरुस्ती और ऊर्जा बढ़ाएं"],
        "Sportliche Leistung": [.en: "Athletic performance", .fr: "Performance sportive", .es: "Rendimiento deportivo", .it: "Prestazione atletica", .hi: "खेल प्रदर्शन"],
        "Fitness & Ausdauer verbessern": [.en: "Improve fitness & endurance", .fr: "Améliorer la forme et l'endurance", .es: "Mejorar el estado físico y la resistencia", .it: "Migliorare forma fisica e resistenza", .hi: "फिटनेस और सहनशक्ति में सुधार करें"],
        "Mehr Energie": [.en: "More energy", .fr: "Plus d'énergie", .es: "Más energía", .it: "Più energia", .hi: "अधिक ऊर्जा"],
        "Vitaler & aktiver im Alltag": [.en: "More vital & active in daily life", .fr: "Plus vital et actif au quotidien", .es: "Más vital y activo en el día a día", .it: "Più vitale e attivo nella vita quotidiana", .hi: "रोज़मर्रा में अधिक सक्रिय और जीवंत"],
        "Besser schlafen": [.en: "Sleep better", .fr: "Mieux dormir", .es: "Dormir mejor", .it: "Dormire meglio", .hi: "बेहतर नींद लें"],
        "Erholung & Regeneration": [.en: "Recovery & regeneration", .fr: "Récupération et régénération", .es: "Recuperación y regeneración", .it: "Recupero e rigenerazione", .hi: "रिकवरी और पुनर्जनन"],
        "Mehrere Antworten möglich": [.en: "Multiple answers possible", .fr: "Plusieurs réponses possibles", .es: "Se permiten varias respuestas", .it: "Sono possibili più risposte", .hi: "कई उत्तर संभव हैं"],
        "Wie sollen wir dich nennen?": [.en: "What should we call you?", .fr: "Comment devons-nous t'appeler ?", .es: "¿Cómo debemos llamarte?", .it: "Come dobbiamo chiamarti?", .hi: "हम आपको क्या कहें?"],
        "Dein Vorname": [.en: "Your first name", .fr: "Ton prénom", .es: "Tu nombre", .it: "Il tuo nome", .hi: "आपका पहला नाम"],
        "Bleib am Ball": [.en: "Stay on track", .fr: "Reste sur la bonne voie", .es: "Mantente en el camino", .it: "Resta in carreggiata", .hi: "लगे रहें"],
        "Aktiviere Erinnerungen, damit du deine Mahlzeiten nicht vergisst und dein Ziel erreichst.": [.en: "Enable reminders so you don't forget your meals and reach your goal.", .fr: "Active les rappels pour ne pas oublier tes repas et atteindre ton objectif.", .es: "Activa los recordatorios para no olvidar tus comidas y alcanzar tu objetivo.", .it: "Attiva i promemoria per non dimenticare i pasti e raggiungere il tuo obiettivo.", .hi: "रिमाइंडर सक्षम करें ताकि आप अपने भोजन को न भूलें और अपना लक्ष्य प्राप्त करें।"],
        "Mahlzeit-Erinnerungen": [.en: "Meal reminders", .fr: "Rappels de repas", .es: "Recordatorios de comidas", .it: "Promemoria pasti", .hi: "भोजन रिमाइंडर"],
        "Fortschritts-Updates": [.en: "Progress updates", .fr: "Mises à jour des progrès", .es: "Actualizaciones de progreso", .it: "Aggiornamenti sui progressi", .hi: "प्रगति अपडेट"],
        "Kamera & Barcode-Scan": [.en: "Camera & barcode scan", .fr: "Caméra et scan de code-barres", .es: "Cámara y escaneo de código de barras", .it: "Fotocamera e scansione codice a barre", .hi: "कैमरा और बारकोड स्कैन"],
        "Gesundheits-App verbinden": [.en: "Connect Health app", .fr: "Connecter l'app Santé", .es: "Conectar la app de salud", .it: "Collega l'app Salute", .hi: "हेल्थ ऐप कनेक्ट करें"],
        "Benachrichtigungen erlauben": [.en: "Allow notifications", .fr: "Autoriser les notifications", .es: "Permitir notificaciones", .it: "Consenti notifiche", .hi: "सूचनाओं की अनुमति दें"],
        "3 Tage kostenlos, danach %@": [.en: "3 days free, then %@", .fr: "3 jours gratuits, puis %@", .es: "3 días gratis, luego %@", .it: "3 giorni gratis, poi %@", .hi: "3 दिन मुफ़्त, फिर %@"],
        "Nur %@ pro Monat": [.en: "Only %@ per month", .fr: "Seulement %@ par mois", .es: "Solo %@ al mes", .it: "Solo %@ al mese", .hi: "केवल %@ प्रति माह"],
        "Jährlich – %@": [.en: "Yearly – %@", .fr: "Annuel – %@", .es: "Anual – %@", .it: "Annuale – %@", .hi: "वार्षिक – %@"],
        "Starte deine 3-tägige\nKOSTENLOSE Testphase": [.en: "Start your 3-day\nFREE trial", .fr: "Démarre ton essai\nGRATUIT de 3 jours", .es: "Comienza tu prueba\nGRATUITA de 3 días", .it: "Inizia la tua prova\nGRATUITA di 3 giorni", .hi: "अपना 3-दिवसीय\nनिःशुल्क परीक्षण शुरू करें"],
        "Schalte Frigy frei, um deine\nZiele schneller zu erreichen": [.en: "Unlock Frigy to reach\nyour goals faster", .fr: "Débloque Frigy pour atteindre\ntes objectifs plus vite", .es: "Desbloquea Frigy para alcanzar\ntus objetivos más rápido", .it: "Sblocca Frigy per raggiungere\ni tuoi obiettivi più velocemente", .hi: "अपने लक्ष्यों को तेज़ी से प्राप्त करने के लिए\nFrigy अनलॉक करें"],
        "OK": [.en: "OK", .fr: "OK", .es: "OK", .it: "OK", .hi: "ठीक है"],
        "In 2 Tagen – Erinnerung": [.en: "In 2 days – Reminder", .fr: "Dans 2 jours – Rappel", .es: "En 2 días – Recordatorio", .it: "Tra 2 giorni – Promemoria", .hi: "2 दिनों में – रिमाइंडर"],
        "Wir erinnern dich, dass deine Testphase bald endet": [.en: "We'll remind you that your trial is ending soon", .fr: "Nous te rappellerons que ton essai se termine bientôt", .es: "Te recordaremos que tu prueba terminará pronto", .it: "Ti ricorderemo che la tua prova sta per terminare", .hi: "हम आपको याद दिलाएंगे कि आपका परीक्षण जल्द समाप्त हो रहा है"],
        "In 3 Tagen – Abrechnung": [.en: "In 3 days – Billing", .fr: "Dans 3 jours – Facturation", .es: "En 3 días – Facturación", .it: "Tra 3 giorni – Fatturazione", .hi: "3 दिनों में – बिलिंग"],
        "Abrechnung am %@, sofern du nicht vorher kündigst": [.en: "Billed on %@, unless you cancel before then", .fr: "Facturé le %@, sauf annulation avant cette date", .es: "Se cobrará el %@, a menos que canceles antes", .it: "Addebitato il %@, salvo disdetta anticipata", .hi: "%@ को बिल किया जाएगा, जब तक आप पहले रद्द न करें"],
        "Bestes Angebot": [.en: "Best offer", .fr: "Meilleure offre", .es: "Mejor oferta", .it: "Offerta migliore", .hi: "सर्वश्रेष्ठ ऑफर"],
        "JÄHRLICH": [.en: "YEARLY", .fr: "ANNUEL", .es: "ANUAL", .it: "ANNUALE", .hi: "वार्षिक"],
        "Jährliche Abrechnung": [.en: "Yearly billing", .fr: "Facturation annuelle", .es: "Facturación anual", .it: "Fatturazione annuale", .hi: "वार्षिक बिलिंग"],
        "Im Vergleich zu monatlich": [.en: "Compared to monthly", .fr: "Comparé au mensuel", .es: "Comparado con el mensual", .it: "Rispetto al mensile", .hi: "मासिक की तुलना में"],
        "%@ × 12": [.en: "%@ × 12", .fr: "%@ × 12", .es: "%@ × 12", .it: "%@ × 12", .hi: "%@ × 12"],
        "Alle Premium-Funktionen": [.en: "All premium features", .fr: "Toutes les fonctionnalités premium", .es: "Todas las funciones premium", .it: "Tutte le funzionalità premium", .hi: "सभी प्रीमियम सुविधाएं"],
        "KI-Scan, Tracker, Wochenpläne & mehr": [.en: "AI scan, tracker, weekly plans & more", .fr: "Scan IA, suivi, plans hebdomadaires et plus", .es: "Escaneo IA, seguimiento, planes semanales y más", .it: "Scansione IA, tracker, piani settimanali e altro", .hi: "AI स्कैन, ट्रैकर, साप्ताहिक योजनाएं और अधिक"],
        "Jederzeit kündbar": [.en: "Cancel anytime", .fr: "Annulable à tout moment", .es: "Cancelable en cualquier momento", .it: "Annullabile in qualsiasi momento", .hi: "कभी भी रद्द करें"],
        "Über deine App-Store-Einstellungen": [.en: "Via your App Store settings", .fr: "Via tes paramètres App Store", .es: "A través de tus ajustes de App Store", .it: "Tramite le impostazioni dell'App Store", .hi: "आपकी ऐप स्टोर सेटिंग्स के माध्यम से"],
        "Einmalig pro Jahr abgerechnet": [.en: "Billed once a year", .fr: "Facturé une fois par an", .es: "Facturado una vez al año", .it: "Fatturato una volta all'anno", .hi: "वर्ष में एक बार बिल किया गया"],
        "Keine monatlichen Abbuchungen": [.en: "No monthly charges", .fr: "Pas de prélèvements mensuels", .es: "Sin cargos mensuales", .it: "Nessun addebito mensile", .hi: "कोई मासिक शुल्क नहीं"],
        "Monatlich": [.en: "Monthly", .fr: "Mensuel", .es: "Mensual", .it: "Mensile", .hi: "मासिक"],
        "Jährlich": [.en: "Yearly", .fr: "Annuel", .es: "Anual", .it: "Annuale", .hi: "वार्षिक"],
        "Keine Zahlung jetzt fällig": [.en: "No payment due now", .fr: "Aucun paiement requis maintenant", .es: "No se requiere pago ahora", .it: "Nessun pagamento dovuto ora", .hi: "अभी कोई भुगतान देय नहीं"],
        "Keine Bindung – jederzeit kündbar": [.en: "No commitment – cancel anytime", .fr: "Sans engagement – annulable à tout moment", .es: "Sin compromiso – cancela cuando quieras", .it: "Nessun impegno – annullabile in qualsiasi momento", .hi: "कोई प्रतिबद्धता नहीं – कभी भी रद्द करें"],
        "Wird verarbeitet…": [.en: "Processing…", .fr: "Traitement en cours…", .es: "Procesando…", .it: "Elaborazione in corso…", .hi: "प्रोसेसिंग हो रही है…"],
        "3-tägige Testphase starten": [.en: "Start 3-day trial", .fr: "Démarrer l'essai de 3 jours", .es: "Iniciar prueba de 3 días", .it: "Avvia la prova di 3 giorni", .hi: "3-दिवसीय परीक्षण शुरू करें"],
        "Loslegen": [.en: "Get started", .fr: "Commencer", .es: "Empezar", .it: "Inizia", .hi: "शुरू करें"],
        "Keine aktiven Käufe gefunden. Falls du Frigy Premium hast, melde dich mit derselben Apple-ID an, mit der du gekauft hast.": [.en: "No active purchases found. If you have Frigy Premium, sign in with the same Apple ID you purchased with.", .fr: "Aucun achat actif trouvé. Si tu as Frigy Premium, connecte-toi avec le même identifiant Apple utilisé pour l'achat.", .es: "No se encontraron compras activas. Si tienes Frigy Premium, inicia sesión con el mismo Apple ID con el que compraste.", .it: "Nessun acquisto attivo trovato. Se hai Frigy Premium, accedi con lo stesso Apple ID con cui hai acquistato.", .hi: "कोई सक्रिय खरीदारी नहीं मिली। यदि आपके पास Frigy Premium है, तो उसी Apple ID से साइन इन करें जिससे आपने खरीदा था।"],
        "Wiederherstellung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.": [.en: "Restore failed. Please check your internet connection and try again.", .fr: "Échec de la restauration. Vérifie ta connexion internet et réessaie.", .es: "Error al restaurar. Comprueba tu conexión a internet e inténtalo de nuevo.", .it: "Ripristino non riuscito. Controlla la tua connessione internet e riprova.", .hi: "पुनर्स्थापना विफल रही। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।"],
        "Code einlösen": [.en: "Redeem code", .fr: "Échanger un code", .es: "Canjear código", .it: "Riscatta codice", .hi: "कोड रिडीम करें"],
        "Frigy Premium · %1@ · %2@": [.en: "Frigy Premium · %1@ · %2@", .fr: "Frigy Premium · %1@ · %2@", .es: "Frigy Premium · %1@ · %2@", .it: "Frigy Premium · %1@ · %2@", .hi: "Frigy Premium · %1@ · %2@"],
        "Jahresabo (1 Jahr)": [.en: "Yearly subscription (1 year)", .fr: "Abonnement annuel (1 an)", .es: "Suscripción anual (1 año)", .it: "Abbonamento annuale (1 anno)", .hi: "वार्षिक सदस्यता (1 वर्ष)"],
        "Monatsabo (1 Monat)": [.en: "Monthly subscription (1 month)", .fr: "Abonnement mensuel (1 mois)", .es: "Suscripción mensual (1 mes)", .it: "Abbonamento mensile (1 mese)", .hi: "मासिक सदस्यता (1 माह)"],
        "Das Abo verlängert sich automatisch, bis du es mindestens 24 Stunden vor Periodenende in den Einstellungen deines App-Store-Kontos kündigst. Die Zahlung wird bei Bestätigung über dein Store-Konto abgebucht.": [.en: "The subscription renews automatically unless you cancel at least 24 hours before the end of the period in your App Store account settings. Payment will be charged to your store account upon confirmation.", .fr: "L'abonnement se renouvelle automatiquement sauf annulation au moins 24 heures avant la fin de la période dans les paramètres de ton compte App Store. Le paiement sera débité de ton compte store à la confirmation.", .es: "La suscripción se renueva automáticamente a menos que la canceles al menos 24 horas antes del final del período en la configuración de tu cuenta de App Store. El pago se cargará a tu cuenta de la tienda al confirmar.", .it: "L'abbonamento si rinnova automaticamente a meno che tu non lo annulli almeno 24 ore prima della fine del periodo nelle impostazioni del tuo account App Store. Il pagamento verrà addebitato sul tuo account store al momento della conferma.", .hi: "सदस्यता स्वतः नवीनीकृत होती है जब तक कि आप अवधि समाप्त होने से कम से कम 24 घंटे पहले अपनी App Store खाता सेटिंग्स में इसे रद्द न करें। पुष्टि होने पर भुगतान आपके स्टोर खाते से लिया जाएगा।"],
        "Nutzungsbedingungen": [.en: "Terms of use", .fr: "Conditions d'utilisation", .es: "Términos de uso", .it: "Termini di utilizzo", .hi: "उपयोग की शर्तें"],
        "/ Monat": [.en: "/ month", .fr: "/ mois", .es: "/ mes", .it: "/ mese", .hi: "/ माह"],
        "%@ / Jahr": [.en: "%@ / year", .fr: "%@ / an", .es: "%@ / año", .it: "%@ / anno", .hi: "%@ / वर्ष"],
        "3 TAGE KOSTENLOS": [.en: "3 DAYS FREE", .fr: "3 JOURS GRATUITS", .es: "3 DÍAS GRATIS", .it: "3 GIORNI GRATIS", .hi: "3 दिन मुफ़्त"],
        "⏰ Testphase endet morgen!": [.en: "⏰ Trial ends tomorrow!", .fr: "⏰ L'essai se termine demain !", .es: "⏰ ¡La prueba termina mañana!", .it: "⏰ La prova termina domani!", .hi: "⏰ परीक्षण कल समाप्त हो रहा है!"],
        "Deine kostenlose Testphase endet morgen. Kündige jetzt in den App-Store-Einstellungen, wenn du nicht abgerechnet werden möchtest.": [.en: "Your free trial ends tomorrow. Cancel now in your App Store settings if you don't want to be charged.", .fr: "Ton essai gratuit se termine demain. Annule maintenant dans les paramètres App Store si tu ne veux pas être facturé.", .es: "Tu prueba gratuita termina mañana. Cancela ahora en la configuración de App Store si no deseas que se te cobre.", .it: "La tua prova gratuita termina domani. Annulla ora nelle impostazioni dell'App Store se non vuoi essere addebitato.", .hi: "आपका निःशुल्क परीक्षण कल समाप्त हो रहा है। यदि आप शुल्क नहीं लेना चाहते हैं तो अभी App Store सेटिंग्स में रद्द करें।"],

        // ===== ONBOARDING: PLANNING SETUP / PREMIUM CELEBRATION / PREMIUM HINT / PROFILE SETUP / REFERRAL CODE =====
        "Dein persönlicher Ernährungsplan wird jetzt vorbereitet.": [.en: "Your personal nutrition plan is being prepared now.", .fr: "Ton plan nutritionnel personnel est en cours de préparation.", .es: "Tu plan nutricional personal se está preparando ahora.", .it: "Il tuo piano alimentare personale è in fase di preparazione.", .hi: "आपकी व्यक्तिगत पोषण योजना अभी तैयार की जा रही है।"],
        "Profildaten übernommen": [.en: "Profile data imported", .fr: "Données de profil importées", .es: "Datos de perfil importados", .it: "Dati del profilo importati", .hi: "प्रोफ़ाइल डेटा आयात किया गया"],
        "Ziele gesetzt": [.en: "Goals set", .fr: "Objectifs définis", .es: "Objetivos establecidos", .it: "Obiettivi impostati", .hi: "लक्ष्य निर्धारित"],
        "Ernährungspräferenzen": [.en: "Dietary preferences", .fr: "Préférences alimentaires", .es: "Preferencias dietéticas", .it: "Preferenze alimentari", .hi: "आहार वरीयताएँ"],
        "Weiter": [.en: "Continue", .fr: "Continuer", .es: "Continuar", .it: "Continua", .hi: "जारी रखें"],
        "Willkommen bei\nFrigy Premium! 🎉": [.en: "Welcome to\nFrigy Premium! 🎉", .fr: "Bienvenue dans\nFrigy Premium ! 🎉", .es: "Bienvenido a\n¡Frigy Premium! 🎉", .it: "Benvenuto in\nFrigy Premium! 🎉", .hi: "Frigy Premium में\nस्वागत है! 🎉"],
        "Dein Jahresabo ist aktiv. Du hast jetzt vollen Zugriff auf alle Premium-Funktionen.": [.en: "Your yearly subscription is active. You now have full access to all premium features.", .fr: "Ton abonnement annuel est actif. Tu as maintenant un accès complet à toutes les fonctionnalités premium.", .es: "Tu suscripción anual está activa. Ahora tienes acceso completo a todas las funciones premium.", .it: "Il tuo abbonamento annuale è attivo. Ora hai accesso completo a tutte le funzionalità premium.", .hi: "आपकी वार्षिक सदस्यता सक्रिय है। अब आपके पास सभी प्रीमियम सुविधाओं तक पूर्ण पहुंच है।"],
        "Deine Testphase läuft. Du hast jetzt vollen Zugriff auf alle Premium-Funktionen.": [.en: "Your trial is running. You now have full access to all premium features.", .fr: "Ton essai est en cours. Tu as maintenant un accès complet à toutes les fonctionnalités premium.", .es: "Tu prueba está en curso. Ahora tienes acceso completo a todas las funciones premium.", .it: "La tua prova è in corso. Ora hai accesso completo a tutte le funzionalità premium.", .hi: "आपका परीक्षण चल रहा है। अब आपके पास सभी प्रीमियम सुविधाओं तक पूर्ण पहुंच है।"],
        "KI-Mahlzeitenpläne ohne Limit": [.en: "Unlimited AI meal plans", .fr: "Plans de repas IA illimités", .es: "Planes de comidas IA ilimitados", .it: "Piani pasto IA illimitati", .hi: "असीमित AI भोजन योजनाएं"],
        "Barcode- & Foto-Scan": [.en: "Barcode & photo scan", .fr: "Scan code-barres et photo", .es: "Escaneo de código de barras y foto", .it: "Scansione codice a barre e foto", .hi: "बारकोड और फोटो स्कैन"],
        "KI-Coach & erweiterte Statistiken": [.en: "AI coach & advanced statistics", .fr: "Coach IA et statistiques avancées", .es: "Entrenador IA y estadísticas avanzadas", .it: "Coach IA e statistiche avanzate", .hi: "AI कोच और उन्नत आंकड़े"],
        "Alle Features. Keine Einschränkungen.": [.en: "All features. No limitations.", .fr: "Toutes les fonctionnalités. Aucune limitation.", .es: "Todas las funciones. Sin limitaciones.", .it: "Tutte le funzionalità. Nessuna limitazione.", .hi: "सभी सुविधाएं। कोई सीमा नहीं।"],
        "Unbegrenzte Wochenpläne": [.en: "Unlimited weekly plans", .fr: "Plans hebdomadaires illimités", .es: "Planes semanales ilimitados", .it: "Piani settimanali illimitati", .hi: "असीमित साप्ताहिक योजनाएं"],
        "Täglich frisch generiert": [.en: "Freshly generated daily", .fr: "Générés fraîchement chaque jour", .es: "Generados frescos a diario", .it: "Generati freschi ogni giorno", .hi: "प्रतिदिन ताज़ा उत्पन्न"],
        "Unlimitierte Scans pro Monat": [.en: "Unlimited scans per month", .fr: "Scans illimités par mois", .es: "Escaneos ilimitados al mes", .it: "Scansioni illimitate al mese", .hi: "प्रति माह असीमित स्कैन"],
        "Detaillierte Analysen": [.en: "Detailed analytics", .fr: "Analyses détaillées", .es: "Análisis detallados", .it: "Analisi dettagliate", .hi: "विस्तृत विश्लेषण"],
        "Nährwerte, Trends & Fortschritt": [.en: "Nutrition values, trends & progress", .fr: "Valeurs nutritionnelles, tendances et progrès", .es: "Valores nutricionales, tendencias y progreso", .it: "Valori nutrizionali, tendenze e progressi", .hi: "पोषण मूल्य, रुझान और प्रगति"],
        "Smarte Einkaufsliste": [.en: "Smart shopping list", .fr: "Liste de courses intelligente", .es: "Lista de compras inteligente", .it: "Lista della spesa intelligente", .hi: "स्मार्ट शॉपिंग सूची"],
        "Automatisch & sortiert": [.en: "Automatic & sorted", .fr: "Automatique et triée", .es: "Automática y ordenada", .it: "Automatica e ordinata", .hi: "स्वचालित और क्रमबद्ध"],
        "Mahlzeiten & Trinkwasser": [.en: "Meals & drinking water", .fr: "Repas et eau potable", .es: "Comidas y agua potable", .it: "Pasti e acqua potabile", .hi: "भोजन और पीने का पानी"],
        "Jetzt dein Profil einrichten": [.en: "Set up your profile now", .fr: "Configure ton profil maintenant", .es: "Configura tu perfil ahora", .it: "Configura ora il tuo profilo", .hi: "अभी अपनी प्रोफ़ाइल सेट करें"],
        "Damit können wir deinen Plan perfekt auf dich abstimmen.": [.en: "This way we can tailor your plan perfectly to you.", .fr: "Ainsi, nous pouvons adapter ton plan parfaitement à toi.", .es: "Así podemos adaptar tu plan perfectamente a ti.", .it: "Così possiamo adattare il tuo piano perfettamente a te.", .hi: "इस तरह हम आपकी योजना को आपके अनुसार पूरी तरह से तैयार कर सकते हैं।"],
        "Gewicht, Größe & Alter": [.en: "Weight, height & age", .fr: "Poids, taille et âge", .es: "Peso, altura y edad", .it: "Peso, altezza ed età", .hi: "वजन, ऊंचाई और उम्र"],
        "Ziele": [.en: "Goals", .fr: "Objectifs", .es: "Objetivos", .it: "Obiettivi", .hi: "लक्ष्य"],
        "Was du erreichen möchtest": [.en: "What you want to achieve", .fr: "Ce que tu veux atteindre", .es: "Lo que quieres lograr", .it: "Cosa vuoi ottenere", .hi: "आप क्या हासिल करना चाहते हैं"],
        "Ernährung": [.en: "Nutrition", .fr: "Alimentation", .es: "Nutrición", .it: "Alimentazione", .hi: "पोषण"],
        "Präferenzen & Allergien": [.en: "Preferences & allergies", .fr: "Préférences et allergies", .es: "Preferencias y alergias", .it: "Preferenze e allergie", .hi: "वरीयताएँ और एलर्जी"],
        "Dein Plan": [.en: "Your plan", .fr: "Ton plan", .es: "Tu plan", .it: "Il tuo piano", .hi: "आपकी योजना"],
        "Wochenplan & Makros": [.en: "Weekly plan & macros", .fr: "Plan hebdomadaire et macros", .es: "Plan semanal y macros", .it: "Piano settimanale e macro", .hi: "साप्ताहिक योजना और मैक्रो"],
        "Los geht's!": [.en: "Let's go!", .fr: "C'est parti !", .es: "¡Vamos!", .it: "Iniziamo!", .hi: "चलिए शुरू करें!"],
        "EIN FREUND\nLÄDT DICH EIN": [.en: "A FRIEND\nINVITES YOU", .fr: "UN AMI\nT'INVITE", .es: "UN AMIGO\nTE INVITA", .it: "UN AMICO\nTI INVITA", .hi: "एक दोस्त\nआपको आमंत्रित करता है"],
        "Empfehlungscode": [.en: "Referral code", .fr: "Code de parrainage", .es: "Código de referencia", .it: "Codice di riferimento", .hi: "रेफ़रल कोड"],
        "Code wird überprüft…": [.en: "Verifying code…", .fr: "Vérification du code…", .es: "Verificando código…", .it: "Verifica del codice in corso…", .hi: "कोड सत्यापित हो रहा है…"],
        "Nicht jetzt": [.en: "Not now", .fr: "Pas maintenant", .es: "Ahora no", .it: "Non ora", .hi: "अभी नहीं"],
        "Code erkannt!": [.en: "Code recognized!", .fr: "Code reconnu !", .es: "¡Código reconocido!", .it: "Codice riconosciuto!", .hi: "कोड पहचाना गया!"],
        "Dein Partner wurde gespeichert. Als Nächstes wählst du dein Premium-Abo.": [.en: "Your partner has been saved. Next, choose your premium subscription.", .fr: "Ton partenaire a été enregistré. Choisis maintenant ton abonnement premium.", .es: "Tu socio ha sido guardado. A continuación, elige tu suscripción premium.", .it: "Il tuo partner è stato salvato. Ora scegli il tuo abbonamento premium.", .hi: "आपका साथी सहेज लिया गया है। अगला, अपनी प्रीमियम सदस्यता चुनें।"],
        "Bitte Code eingeben oder \"Nicht jetzt\" wählen.": [.en: "Please enter a code or choose \"Not now\".", .fr: "Veuillez entrer un code ou choisir « Pas maintenant ».", .es: "Por favor, introduce un código o elige \"Ahora no\".", .it: "Inserisci un codice o seleziona \"Non ora\".", .hi: "कृपया कोड दर्ज करें या \"अभी नहीं\" चुनें।"],
        "Bitte alle 6 Felder ausfüllen.": [.en: "Please fill in all 6 fields.", .fr: "Veuillez remplir les 6 champs.", .es: "Por favor, completa los 6 campos.", .it: "Compila tutti i 6 campi.", .hi: "कृपया सभी 6 फ़ील्ड भरें।"],
        "Ungültiger Code. Bitte prüfen.": [.en: "Invalid code. Please check.", .fr: "Code invalide. Veuillez vérifier.", .es: "Código no válido. Por favor, verifica.", .it: "Codice non valido. Controlla.", .hi: "अमान्य कोड। कृपया जांचें।"],

        // ===== ONBOARDING: SCAN FEEDBACK / SCAN FRIDGE / SHOPPING LIST INTRO / SPEED SELECT / SPLASH =====
        "Hähnchenbrust": [.en: "Chicken breast", .fr: "Blanc de poulet", .es: "Pechuga de pollo", .it: "Petto di pollo", .hi: "चिकन ब्रेस्ट"],
        "23g Protein · 165 kcal": [.en: "23g protein · 165 kcal", .fr: "23g de protéines · 165 kcal", .es: "23g de proteína · 165 kcal", .it: "23g di proteine · 165 kcal", .hi: "23g प्रोटीन · 165 kcal"],
        "Brokkoli": [.en: "Broccoli", .fr: "Brocoli", .es: "Brócoli", .it: "Broccoli", .hi: "ब्रोकली"],
        "2,8g Protein · 34 kcal": [.en: "2.8g protein · 34 kcal", .fr: "2,8g de protéines · 34 kcal", .es: "2,8g de proteína · 34 kcal", .it: "2,8g di proteine · 34 kcal", .hi: "2.8g प्रोटीन · 34 kcal"],
        "Cheddar": [.en: "Cheddar", .fr: "Cheddar", .es: "Cheddar", .it: "Cheddar", .hi: "चेडर"],
        "7g Fett · 113 kcal": [.en: "7g fat · 113 kcal", .fr: "7g de matières grasses · 113 kcal", .es: "7g de grasa · 113 kcal", .it: "7g di grassi · 113 kcal", .hi: "7g वसा · 113 kcal"],
        "Milch 1,5%": [.en: "Milk 1.5%", .fr: "Lait 1,5%", .es: "Leche 1,5%", .it: "Latte 1,5%", .hi: "दूध 1.5%"],
        "3,4g Protein · 47 kcal": [.en: "3.4g protein · 47 kcal", .fr: "3,4g de protéines · 47 kcal", .es: "3,4g de proteína · 47 kcal", .it: "3,4g di proteine · 47 kcal", .hi: "3.4g प्रोटीन · 47 kcal"],
        "So erkennst du deine Zutaten mit Frigy": [.en: "Here's how Frigy recognizes your ingredients", .fr: "Voici comment Frigy reconnaît tes ingrédients", .es: "Así es como Frigy reconoce tus ingredientes", .it: "Ecco come Frigy riconosce i tuoi ingredienti", .hi: "इस तरह Frigy आपकी सामग्री को पहचानता है"],
        "Erkannte Lebensmittel": [.en: "Recognized foods", .fr: "Aliments reconnus", .es: "Alimentos reconocidos", .it: "Alimenti riconosciuti", .hi: "पहचाने गए खाद्य पदार्थ"],
        "%@ Artikel": [.en: "%@ items", .fr: "%@ articles", .es: "%@ artículos", .it: "%@ articoli", .hi: "%@ वस्तुएं"],
        "Erkenne deine Zutaten.": [.en: "Recognize your ingredients.", .fr: "Reconnais tes ingrédients.", .es: "Reconoce tus ingredientes.", .it: "Riconosci i tuoi ingredienti.", .hi: "अपनी सामग्री को पहचानें।"],
        "Scanne später deinen Kühlschrank — Frigy erkennt, was du hast und was für deinen Plan noch fehlt.": [.en: "Later, scan your fridge — Frigy recognizes what you have and what's missing for your plan.", .fr: "Scanne plus tard ton réfrigérateur — Frigy reconnaît ce que tu as et ce qui manque pour ton plan.", .es: "Más tarde, escanea tu refrigerador — Frigy reconoce lo que tienes y lo que falta para tu plan.", .it: "Più avanti scansiona il tuo frigorifero — Frigy riconosce cosa hai e cosa manca per il tuo piano.", .hi: "बाद में अपना फ्रिज स्कैन करें — Frigy पहचानता है कि आपके पास क्या है और आपकी योजना के लिए क्या कमी है।"],
        "Deine Einkaufsliste, automatisch.": [.en: "Your shopping list, automatically.", .fr: "Ta liste de courses, automatiquement.", .es: "Tu lista de compras, automáticamente.", .it: "La tua lista della spesa, automaticamente.", .hi: "आपकी शॉपिंग सूची, स्वचालित रूप से।"],
        "Nur die Zutaten, die dir noch fehlen.": [.en: "Only the ingredients you're still missing.", .fr: "Seulement les ingrédients qu'il te manque encore.", .es: "Solo los ingredientes que aún te faltan.", .it: "Solo gli ingredienti che ti mancano ancora.", .hi: "केवल वे सामग्री जो आपके पास अभी भी नहीं हैं।"],
        "Meine Einkaufsliste": [.en: "My shopping list", .fr: "Ma liste de courses", .es: "Mi lista de compras", .it: "La mia lista della spesa", .hi: "मेरी शॉपिंग सूची"],
        "Bio-Hafermilch": [.en: "Organic oat milk", .fr: "Lait d'avoine bio", .es: "Leche de avena orgánica", .it: "Latte d'avena biologico", .hi: "ऑर्गेनिक ओट मिल्क"],
        "Avocados": [.en: "Avocados", .fr: "Avocats", .es: "Aguacates", .it: "Avocado", .hi: "एवोकाडो"],
        "Lachsfilet": [.en: "Salmon fillet", .fr: "Filet de saumon", .es: "Filete de salmón", .it: "Filetto di salmone", .hi: "सैल्मन फ़िलेट"],
        "Rucola-Salat": [.en: "Arugula salad", .fr: "Salade de roquette", .es: "Ensalada de rúcula", .it: "Insalata di rucola", .hi: "रॉकेट सलाद"],
        "Bio-Beeren": [.en: "Organic berries", .fr: "Baies bio", .es: "Bayas orgánicas", .it: "Bacche biologiche", .hi: "ऑर्गेनिक बेरीज़"],
        "Sanfter Aufbau": [.en: "Gentle building", .fr: "Construction douce", .es: "Construcción suave", .it: "Costruzione graduale", .hi: "सौम्य निर्माण"],
        "Sanfter Start": [.en: "Gentle start", .fr: "Départ en douceur", .es: "Inicio suave", .it: "Inizio graduale", .hi: "सौम्य शुरुआत"],
        "Optimales Tempo": [.en: "Optimal pace", .fr: "Rythme optimal", .es: "Ritmo óptimo", .it: "Ritmo ottimale", .hi: "इष्टतम गति"],
        "Intensiver Aufbau": [.en: "Intensive building", .fr: "Construction intensive", .es: "Construcción intensiva", .it: "Costruzione intensiva", .hi: "गहन निर्माण"],
        "Schnelle Abnahme": [.en: "Fast weight loss", .fr: "Perte de poids rapide", .es: "Pérdida de peso rápida", .it: "Perdita di peso rapida", .hi: "तेज़ वजन घटाना"],
        "Wie schnell möchtest du dein Ziel erreichen?": [.en: "How quickly do you want to reach your goal?", .fr: "À quelle vitesse veux-tu atteindre ton objectif ?", .es: "¿Qué tan rápido quieres alcanzar tu objetivo?", .it: "Quanto velocemente vuoi raggiungere il tuo obiettivo?", .hi: "आप अपना लक्ष्य कितनी जल्दी प्राप्त करना चाहते हैं?"],
        "Sanft": [.en: "Gentle", .fr: "Doux", .es: "Suave", .it: "Graduale", .hi: "सौम्य"],
        "Langsam": [.en: "Slow", .fr: "Lent", .es: "Lento", .it: "Lento", .hi: "धीमा"],
        "Intensiv": [.en: "Intensive", .fr: "Intensif", .es: "Intensivo", .it: "Intensivo", .hi: "गहन"],
        "Schnell": [.en: "Fast", .fr: "Rapide", .es: "Rápido", .it: "Veloce", .hi: "तेज़"],
        "Iss smarter.": [.en: "Eat smarter.", .fr: "Mange plus intelligemment.", .es: "Come más inteligente.", .it: "Mangia in modo più intelligente.", .hi: "स्मार्ट खाएं।"],
        "Leb leichter.": [.en: "Live lighter.", .fr: "Vis plus léger.", .es: "Vive más ligero.", .it: "Vivi più leggero.", .hi: "हल्का जिएं।"],
        "Generiere Wochenpläne, scanne deinen Kühlschrank und bekomme automatisch deine Einkaufsliste.": [.en: "Generate weekly plans, scan your fridge, and get your shopping list automatically.", .fr: "Génère des plans hebdomadaires, scanne ton réfrigérateur et obtiens automatiquement ta liste de courses.", .es: "Genera planes semanales, escanea tu refrigerador y obtén automáticamente tu lista de compras.", .it: "Genera piani settimanali, scansiona il tuo frigorifero e ottieni automaticamente la tua lista della spesa.", .hi: "साप्ताहिक योजनाएं बनाएं, अपना फ्रिज स्कैन करें और स्वचालित रूप से अपनी शॉपिंग सूची प्राप्त करें।"],
        "Bereits ein Konto? Anmelden": [.en: "Already have an account? Sign in", .fr: "Tu as déjà un compte ? Connexion", .es: "¿Ya tienes una cuenta? Iniciar sesión", .it: "Hai già un account? Accedi", .hi: "पहले से खाता है? साइन इन करें"],

        // ===== ONBOARDING: SPONTAN MODE / STRUCTURED MODE / SUCCESS STATS / TARGET WEIGHT / THEME CHOICE =====
        "So trackst du täglich flexibel deine Mahlzeiten.": [.en: "Here's how you flexibly track your meals every day.", .fr: "Voici comment tu suis tes repas chaque jour, en toute flexibilité.", .es: "Así rastreas tus comidas de forma flexible todos los días.", .it: "Ecco come tieni traccia dei tuoi pasti ogni giorno in modo flessibile.", .hi: "इस तरह आप हर दिन लचीले ढंग से अपने भोजन को ट्रैक करते हैं।"],
        "Iss was du möchtest – tracke einfach & flexibel.": [.en: "Eat what you want – track simply & flexibly.", .fr: "Mange ce que tu veux – suis simplement et flexiblement.", .es: "Come lo que quieras – rastrea de forma simple y flexible.", .it: "Mangia quello che vuoi – traccia in modo semplice e flessibile.", .hi: "जो चाहें खाएं – बस आसान और लचीले तरीके से ट्रैक करें।"],
        "Barcode scannen": [.en: "Scan barcode", .fr: "Scanner le code-barres", .es: "Escanear código de barras", .it: "Scansiona codice a barre", .hi: "बारकोड स्कैन करें"],
        "Gericht suchen & hinzufügen": [.en: "Search & add a dish", .fr: "Rechercher et ajouter un plat", .es: "Buscar y agregar un plato", .it: "Cerca e aggiungi un piatto", .hi: "व्यंजन खोजें और जोड़ें"],
        "Portion anpassen": [.en: "Adjust portion", .fr: "Ajuster la portion", .es: "Ajustar porción", .it: "Regola la porzione", .hi: "हिस्सा समायोजित करें"],
        "Tagesübersicht kontrollieren": [.en: "Check daily overview", .fr: "Vérifier l'aperçu quotidien", .es: "Revisar el resumen diario", .it: "Controlla la panoramica giornaliera", .hi: "दैनिक अवलोकन जांचें"],
        "Kein fixer Wochenplan notwendig": [.en: "No fixed weekly plan needed", .fr: "Aucun plan hebdomadaire fixe nécessaire", .es: "No se necesita un plan semanal fijo", .it: "Non è necessario un piano settimanale fisso", .hi: "किसी निश्चित साप्ताहिक योजना की आवश्यकता नहीं"],
        "Tracke wann & was du möchtest": [.en: "Track when & what you want", .fr: "Suis quand et ce que tu veux", .es: "Rastrea cuándo y qué quieras", .it: "Traccia quando e cosa vuoi", .hi: "जब और जो चाहें ट्रैक करें"],
        "Bleib trotzdem in deinem Ziel": [.en: "Still stay on track with your goal", .fr: "Reste quand même dans ton objectif", .es: "Aun así, mantente en tu objetivo", .it: "Resta comunque nel tuo obiettivo", .hi: "फिर भी अपने लक्ष्य में बने रहें"],
        "Ein vollständiger Wochenplan, der genau auf dich zugeschnitten ist.": [.en: "A complete weekly plan tailored exactly to you.", .fr: "Un plan hebdomadaire complet, parfaitement adapté à toi.", .es: "Un plan semanal completo, adaptado exactamente a ti.", .it: "Un piano settimanale completo, su misura per te.", .hi: "एक पूर्ण साप्ताहिक योजना जो आपके अनुसार बिल्कुल तैयार की गई है।"],
        "KI erstellt deinen persönlichen Plan": [.en: "AI creates your personal plan", .fr: "L'IA crée ton plan personnel", .es: "La IA crea tu plan personal", .it: "L'IA crea il tuo piano personale", .hi: "एआई आपकी व्यक्तिगत योजना बनाता है"],
        "7 Tage, 3 Mahlzeiten täglich": [.en: "7 days, 3 meals daily", .fr: "7 jours, 3 repas par jour", .es: "7 días, 3 comidas diarias", .it: "7 giorni, 3 pasti al giorno", .hi: "7 दिन, प्रतिदिन 3 भोजन"],
        "Mahlzeiten folgen": [.en: "Follow meals", .fr: "Suivre les repas", .es: "Seguir comidas", .it: "Segui i pasti", .hi: "भोजन का पालन करें"],
        "Dein Plan ist dein Leitfaden – du folgst einfach den vorgeschlagenen Mahlzeiten.": [.en: "Your plan is your guide – simply follow the suggested meals.", .fr: "Ton plan est ton guide – suis simplement les repas suggérés.", .es: "Tu plan es tu guía – simplemente sigue las comidas sugeridas.", .it: "Il tuo piano è la tua guida – segui semplicemente i pasti suggeriti.", .hi: "आपकी योजना आपका मार्गदर्शक है – बस सुझाए गए भोजन का पालन करें।"],
        "Tägliche Mahlzeiten vorgeplant": [.en: "Daily meals pre-planned", .fr: "Repas quotidiens préplanifiés", .es: "Comidas diarias preplanificadas", .it: "Pasti giornalieri pianificati", .hi: "दैनिक भोजन पहले से योजनाबद्ध"],
        "Plan jederzeit anpassen": [.en: "Adjust plan anytime", .fr: "Ajuster le plan à tout moment", .es: "Ajustar el plan en cualquier momento", .it: "Modifica il piano in qualsiasi momento", .hi: "किसी भी समय योजना समायोजित करें"],
        "Fortschritt automatisch getrackt": [.en: "Progress automatically tracked", .fr: "Progrès suivi automatiquement", .es: "Progreso rastreado automáticamente", .it: "Progressi tracciati automaticamente", .hi: "प्रगति स्वचालित रूप से ट्रैक की गई"],
        "Ziel erreichen": [.en: "Reach your goal", .fr: "Atteindre ton objectif", .es: "Alcanzar tu objetivo", .it: "Raggiungi il tuo obiettivo", .hi: "लक्ष्य प्राप्त करें"],
        "Mit Struktur und KI-Unterstützung erreichst du dein Ziel zuverlässig.": [.en: "With structure and AI support, you'll reliably reach your goal.", .fr: "Avec de la structure et le soutien de l'IA, tu atteindras ton objectif de manière fiable.", .es: "Con estructura y apoyo de IA, alcanzarás tu objetivo de manera confiable.", .it: "Con struttura e supporto dell'IA, raggiungerai il tuo obiettivo in modo affidabile.", .hi: "संरचना और एआई समर्थन के साथ, आप विश्वसनीय रूप से अपने लक्ष्य तक पहुंचेंगे।"],
        "Kaloriendefizit eingehalten": [.en: "Calorie deficit maintained", .fr: "Déficit calorique respecté", .es: "Déficit calórico mantenido", .it: "Deficit calorico mantenuto", .hi: "कैलोरी की कमी बनाए रखी गई"],
        "Gewicht in Kontrolle": [.en: "Weight under control", .fr: "Poids sous contrôle", .es: "Peso bajo control", .it: "Peso sotto controllo", .hi: "वजन नियंत्रण में"],
        "Nachhaltige Ergebnisse": [.en: "Sustainable results", .fr: "Résultats durables", .es: "Resultados sostenibles", .it: "Risultati sostenibili", .hi: "टिकाऊ परिणाम"],
        "Andere schaffen es –": [.en: "Others manage it –", .fr: "D'autres y arrivent –", .es: "Otros lo logran –", .it: "Altri ci riescono –", .hi: "दूसरे यह कर सकते हैं –"],
        "du auch!": [.en: "so can you!", .fr: "toi aussi !", .es: "¡tú también!", .it: "anche tu!", .hi: "आप भी कर सकते हैं!"],
        "aktive Nutzer": [.en: "active users", .fr: "utilisateurs actifs", .es: "usuarios activos", .it: "utenti attivi", .hi: "सक्रिय उपयोगकर्ता"],
        "in 3 Monaten": [.en: "in 3 months", .fr: "en 3 mois", .es: "en 3 meses", .it: "in 3 mesi", .hi: "3 महीनों में"],
        "App-Bewertung": [.en: "App rating", .fr: "Note de l'application", .es: "Calificación de la app", .it: "Valutazione dell'app", .hi: "ऐप रेटिंग"],
        "erreichen ihr Ziel": [.en: "reach their goal", .fr: "atteignent leur objectif", .es: "alcanzan su objetivo", .it: "raggiungono il loro obiettivo", .hi: "अपना लक्ष्य प्राप्त करते हैं"],
        "Tausende Menschen haben mit Frigy ihre Ernährung transformiert.": [.en: "Thousands of people have transformed their nutrition with Frigy.", .fr: "Des milliers de personnes ont transformé leur alimentation avec Frigy.", .es: "Miles de personas han transformado su nutrición con Frigy.", .it: "Migliaia di persone hanno trasformato la loro alimentazione con Frigy.", .hi: "हजारों लोगों ने Frigy के साथ अपने पोषण को बदल दिया है।"],
        "Das kann ich auch!": [.en: "I can do that too!", .fr: "Je peux le faire aussi !", .es: "¡Yo también puedo hacerlo!", .it: "Posso farlo anch'io!", .hi: "मैं भी यह कर सकता हूं!"],
        "Wie viel möchtest du wiegen?": [.en: "How much do you want to weigh?", .fr: "Combien veux-tu peser ?", .es: "¿Cuánto quieres pesar?", .it: "Quanto vuoi pesare?", .hi: "आप कितना वजन करना चाहते हैं?"],
        "Welches Gewicht möchtest du aufbauen?": [.en: "What weight do you want to build up to?", .fr: "Quel poids veux-tu prendre ?", .es: "¿Qué peso quieres ganar?", .it: "Quale peso vuoi raggiungere?", .hi: "आप कितना वजन बढ़ाना चाहते हैं?"],
        "Dein Zielgewicht": [.en: "Your target weight", .fr: "Ton poids cible", .es: "Tu peso objetivo", .it: "Il tuo peso obiettivo", .hi: "आपका लक्ष्य वजन"],
        "Ziel festlegen": [.en: "Set goal", .fr: "Définir l'objectif", .es: "Establecer objetivo", .it: "Imposta obiettivo", .hi: "लक्ष्य निर्धारित करें"],
        "Wie soll Frigy aussehen?": [.en: "How should Frigy look?", .fr: "À quoi Frigy doit-il ressembler ?", .es: "¿Cómo debería verse Frigy?", .it: "Come dovrebbe apparire Frigy?", .hi: "Frigy कैसा दिखना चाहिए?"],
        "Du kannst das jederzeit in den Einstellungen ändern.": [.en: "You can change this anytime in settings.", .fr: "Tu peux changer cela à tout moment dans les paramètres.", .es: "Puedes cambiar esto en cualquier momento en la configuración.", .it: "Puoi modificarlo in qualsiasi momento nelle impostazioni.", .hi: "आप इसे किसी भी समय सेटिंग्स में बदल सकते हैं।"],
        "System": [.en: "System", .fr: "Système", .es: "Sistema", .it: "Sistema", .hi: "सिस्टम"],
        "Hell": [.en: "Light", .fr: "Clair", .es: "Claro", .it: "Chiaro", .hi: "हल्का"],
        "Dunkel": [.en: "Dark", .fr: "Sombre", .es: "Oscuro", .it: "Scuro", .hi: "गहरा"],
        "Folgt deinen Geräte-Einstellungen": [.en: "Follows your device settings", .fr: "Suit les paramètres de ton appareil", .es: "Sigue la configuración de tu dispositivo", .it: "Segue le impostazioni del tuo dispositivo", .hi: "आपकी डिवाइस सेटिंग्स का पालन करता है"],
        "Immer heller Hintergrund": [.en: "Always a light background", .fr: "Toujours un arrière-plan clair", .es: "Siempre fondo claro", .it: "Sempre sfondo chiaro", .hi: "हमेशा हल्की पृष्ठभूमि"],
        "Schont die Augen bei Nacht": [.en: "Easy on the eyes at night", .fr: "Ménage les yeux la nuit", .es: "Cuida los ojos por la noche", .it: "Protegge gli occhi di notte", .hi: "रात में आँखों के लिए आरामदायक"],

        // ===== ONBOARDING: TRACKER INTRO / TRANSFORMATION / TUTORIAL / TUTORIAL TRANSITION / WEEKLY PLAN PREVIEW =====
        "Behalte deine Nährwerte mühelos im Blick.": [.en: "Effortlessly keep track of your nutrition.", .fr: "Garde un œil sur tes valeurs nutritionnelles sans effort.", .es: "Mantén un control fácil de tus valores nutricionales.", .it: "Tieni traccia dei tuoi valori nutrizionali senza sforzo.", .hi: "बिना किसी परेशानी के अपने पोषण मूल्यों पर नज़र रखें।"],
        "Barcode scannen oder Gericht suchen": [.en: "Scan barcode or search dish", .fr: "Scanner un code-barres ou rechercher un plat", .es: "Escanear código de barras o buscar plato", .it: "Scansiona codice a barre o cerca piatto", .hi: "बारकोड स्कैन करें या व्यंजन खोजें"],
        "Woche 1": [.en: "Week 1", .fr: "Semaine 1", .es: "Semana 1", .it: "Settimana 1", .hi: "सप्ताह 1"],
        "Gewohnheiten aufbauen": [.en: "Build habits", .fr: "Créer des habitudes", .es: "Crear hábitos", .it: "Costruisci abitudini", .hi: "आदतें बनाएं"],
        "Woche 2": [.en: "Week 2", .fr: "Semaine 2", .es: "Semana 2", .it: "Settimana 2", .hi: "सप्ताह 2"],
        "Erste Veränderungen spüren": [.en: "Feel the first changes", .fr: "Ressentir les premiers changements", .es: "Sentir los primeros cambios", .it: "Sentire i primi cambiamenti", .hi: "पहले बदलाव महसूस करें"],
        "Woche 4": [.en: "Week 4", .fr: "Semaine 4", .es: "Semana 4", .it: "Settimana 4", .hi: "सप्ताह 4"],
        "Sichtbare Ergebnisse": [.en: "Visible results", .fr: "Résultats visibles", .es: "Resultados visibles", .it: "Risultati visibili", .hi: "दिखाई देने वाले परिणाम"],
        "Woche 8": [.en: "Week 8", .fr: "Semaine 8", .es: "Semana 8", .it: "Settimana 8", .hi: "सप्ताह 8"],
        "Ziel erreicht!": [.en: "Goal achieved!", .fr: "Objectif atteint !", .es: "¡Objetivo alcanzado!", .it: "Obiettivo raggiunto!", .hi: "लक्ष्य प्राप्त!"],
        "Schritt für Schritt zu deinem Ziel": [.en: "Step by step toward your goal", .fr: "Étape par étape vers ton objectif", .es: "Paso a paso hacia tu objetivo", .it: "Passo dopo passo verso il tuo obiettivo", .hi: "अपने लक्ष्य की ओर कदम दर कदम"],
        "Ich bin dabei!": [.en: "I'm in!", .fr: "Je suis partant !", .es: "¡Me apunto!", .it: "Ci sto!", .hi: "मैं तैयार हूं!"],
        "Home-Dashboard": [.en: "Home dashboard", .fr: "Tableau de bord", .es: "Panel de inicio", .it: "Dashboard principale", .hi: "होम डैशबोर्ड"],
        "Tägliche Übersicht deiner Kalorien & Makros auf einen Blick.": [.en: "Daily overview of your calories & macros at a glance.", .fr: "Aperçu quotidien de tes calories et macros en un coup d'œil.", .es: "Resumen diario de tus calorías y macros de un vistazo.", .it: "Panoramica giornaliera di calorie e macro a colpo d'occhio.", .hi: "एक नज़र में आपकी कैलोरी और मैक्रो का दैनिक अवलोकन।"],
        "Dein personalisierter Ernährungsplan für die ganze Woche.": [.en: "Your personalized nutrition plan for the whole week.", .fr: "Ton plan nutritionnel personnalisé pour toute la semaine.", .es: "Tu plan nutricional personalizado para toda la semana.", .it: "Il tuo piano nutrizionale personalizzato per tutta la settimana.", .hi: "पूरे सप्ताह के लिए आपकी व्यक्तिगत पोषण योजना।"],
        "Kühlschrank": [.en: "Fridge", .fr: "Réfrigérateur", .es: "Refrigerador", .it: "Frigorifero", .hi: "फ्रिज"],
        "Scanne Zutaten und erhalte passende Rezeptvorschläge.": [.en: "Scan ingredients and get matching recipe suggestions.", .fr: "Scanne tes ingrédients et obtiens des suggestions de recettes adaptées.", .es: "Escanea ingredientes y obtén sugerencias de recetas adecuadas.", .it: "Scansiona gli ingredienti e ottieni suggerimenti di ricette adatti.", .hi: "सामग्री स्कैन करें और मिलते-जुलते व्यंजन सुझाव प्राप्त करें।"],
        "Automatisch generierte Liste mit allem was du brauchst.": [.en: "Automatically generated list with everything you need.", .fr: "Liste générée automatiquement avec tout ce dont tu as besoin.", .es: "Lista generada automáticamente con todo lo que necesitas.", .it: "Elenco generato automaticamente con tutto ciò di cui hai bisogno.", .hi: "आपकी आवश्यकता की हर चीज़ के साथ स्वचालित रूप से उत्पन्न सूची।"],
        "Foto machen – KI erkennt alle Zutaten": [.en: "Take a photo – AI recognizes all ingredients", .fr: "Prends une photo – l'IA reconnaît tous les ingrédients", .es: "Toma una foto – la IA reconoce todos los ingredientes", .it: "Scatta una foto – l'IA riconosce tutti gli ingredienti", .hi: "फोटो लें – एआई सभी सामग्री को पहचानता है"],
        "Wochenplan erhalten": [.en: "Get a weekly plan", .fr: "Obtenir un plan hebdomadaire", .es: "Obtener un plan semanal", .it: "Ricevi un piano settimanale", .hi: "साप्ताहिक योजना प्राप्त करें"],
        "Personalisierte Mahlzeiten für 7 Tage": [.en: "Personalized meals for 7 days", .fr: "Repas personnalisés pour 7 jours", .es: "Comidas personalizadas para 7 días", .it: "Pasti personalizzati per 7 giorni", .hi: "7 दिनों के लिए व्यक्तिगत भोजन"],
        "Fehlende Zutaten werden automatisch ergänzt": [.en: "Missing ingredients are added automatically", .fr: "Les ingrédients manquants sont ajoutés automatiquement", .es: "Los ingredientes faltantes se agregan automáticamente", .it: "Gli ingredienti mancanti vengono aggiunti automaticamente", .hi: "गायब सामग्री स्वचालित रूप से जोड़ दी जाती है"],
        "Fortschritt tracken": [.en: "Track progress", .fr: "Suivre les progrès", .es: "Rastrear progreso", .it: "Traccia i progressi", .hi: "प्रगति ट्रैक करें"],
        "Kalorien & Makros im Blick behalten": [.en: "Keep an eye on calories & macros", .fr: "Garder un œil sur les calories et les macros", .es: "Mantener un control de calorías y macros", .it: "Tieni d'occhio calorie e macro", .hi: "कैलोरी और मैक्रो पर नज़र रखें"],
        "Jetzt loslegen": [.en: "Get started now", .fr: "Commencer maintenant", .es: "Empezar ahora", .it: "Inizia ora", .hi: "अभी शुरू करें"],
        "Dein Wochenplan, perfekt auf dich abgestimmt.": [.en: "Your weekly plan, perfectly tailored to you.", .fr: "Ton plan hebdomadaire, parfaitement adapté à toi.", .es: "Tu plan semanal, perfectamente adaptado a ti.", .it: "Il tuo piano settimanale, perfettamente su misura per te.", .hi: "आपकी साप्ताहिक योजना, आपके अनुसार पूरी तरह तैयार।"],
        "KI plant deine Mahlzeiten basierend auf deinem Ziel und Geschmack.": [.en: "AI plans your meals based on your goal and taste.", .fr: "L'IA planifie tes repas en fonction de ton objectif et de tes goûts.", .es: "La IA planifica tus comidas según tu objetivo y gusto.", .it: "L'IA pianifica i tuoi pasti in base al tuo obiettivo e gusto.", .hi: "एआई आपके लक्ष्य और स्वाद के आधार पर आपके भोजन की योजना बनाता है।"],
        "Mein Wochenplan": [.en: "My weekly plan", .fr: "Mon plan hebdomadaire", .es: "Mi plan semanal", .it: "Il mio piano settimanale", .hi: "मेरी साप्ताहिक योजना"],
        "KI-generiert · Diese Woche": [.en: "AI-generated · This week", .fr: "Généré par IA · Cette semaine", .es: "Generado por IA · Esta semana", .it: "Generato dall'IA · Questa settimana", .hi: "एआई-जनित · इस सप्ताह"],
        "Mo": [.en: "Mon", .fr: "Lun", .es: "Lun", .it: "Lun", .hi: "सोम"],
        "🥗 Quinoa-Bowl": [.en: "🥗 Quinoa bowl", .fr: "🥗 Bol de quinoa", .es: "🥗 Bowl de quinoa", .it: "🥗 Bowl di quinoa", .hi: "🥗 क्विनोआ बाउल"],
        "🍗 Hähnchen-Wrap": [.en: "🍗 Chicken wrap", .fr: "🍗 Wrap au poulet", .es: "🍗 Wrap de pollo", .it: "🍗 Wrap di pollo", .hi: "🍗 चिकन रैप"],
        "Di": [.en: "Tue", .fr: "Mar", .es: "Mar", .it: "Mar", .hi: "मंगल"],
        "🥑 Avocado-Toast": [.en: "🥑 Avocado toast", .fr: "🥑 Toast à l'avocat", .es: "🥑 Tostada de aguacate", .it: "🥑 Toast all'avocado", .hi: "🥑 एवोकाडो टोस्ट"],
        "🍓 Beeren-Smoothie": [.en: "🍓 Berry smoothie", .fr: "🍓 Smoothie aux baies", .es: "🍓 Batido de bayas", .it: "🍓 Frullato di bacche", .hi: "🍓 बेरी स्मूदी"],
        "Mi": [.en: "Wed", .fr: "Mer", .es: "Mié", .it: "Mer", .hi: "बुध"],
        "🐟 Lachs & Reis": [.en: "🐟 Salmon & rice", .fr: "🐟 Saumon et riz", .es: "🐟 Salmón y arroz", .it: "🐟 Salmone e riso", .hi: "🐟 सैल्मन और चावल"],
        "🥦 Gemüse-Curry": [.en: "🥦 Vegetable curry", .fr: "🥦 Curry de légumes", .es: "🥦 Curry de verduras", .it: "🥦 Curry di verdure", .hi: "🥦 सब्ज़ी करी"],
        "Do": [.en: "Thu", .fr: "Jeu", .es: "Jue", .it: "Gio", .hi: "गुरु"],
        "🍳 Rührei & Toast": [.en: "🍳 Scrambled eggs & toast", .fr: "🍳 Œufs brouillés et toast", .es: "🍳 Huevos revueltos y tostada", .it: "🍳 Uova strapazzate e toast", .hi: "🍳 अंडा भुर्जी और टोस्ट"],
        "🥩 Steak-Salat": [.en: "🥩 Steak salad", .fr: "🥩 Salade de steak", .es: "🥩 Ensalada de bistec", .it: "🥩 Insalata di bistecca", .hi: "🥩 स्टेक सलाद"],
        "Fr": [.en: "Fri", .fr: "Ven", .es: "Vie", .it: "Ven", .hi: "शुक्र"],
        "🌯 Veggie-Wrap": [.en: "🌯 Veggie wrap", .fr: "🌯 Wrap végétarien", .es: "🌯 Wrap vegetariano", .it: "🌯 Wrap vegetariano", .hi: "🌯 वेजी रैप"],
        "🍝 Pasta bolognese": [.en: "🍝 Pasta bolognese", .fr: "🍝 Pâtes bolognaise", .es: "🍝 Pasta a la boloñesa", .it: "🍝 Pasta al ragù", .hi: "🍝 पास्ता बोलोग्नीज़"],
    ]
}
