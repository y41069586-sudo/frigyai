import type { Language } from "@/contexts/LanguageContext";

export const LEGAL_PROVIDER = "Doaa Attia";
export const LEGAL_ADDRESS_LINES = ["Wilhelm-Diess-Weg 3a", "94081 Fürstenzell", "Deutschland"];
export const LEGAL_EMAIL = "frigy.team@gmail.com";
export const LEGAL_ADDRESS = LEGAL_ADDRESS_LINES.join(", ");

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "h3"; text: string }
  | { kind: "h4"; text: string }
  | { kind: "email"; label: string }
  | { kind: "odr"; before: string; after: string };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  pageTitle: string;
  sections: LegalSection[];
  disclaimer?: string;
};

export type LegalPageType = "impressum" | "datenschutz" | "agb";

export type LegalUiCopy = {
  close: string;
  backAria: string;
  notFound: string;
  emailLabel: string;
};

const ui: Record<Language, LegalUiCopy> = {
  de: {
    close: "Schließen",
    backAria: "Zurück zur App",
    notFound: "Seite nicht gefunden",
    emailLabel: "E-Mail",
  },
  en: {
    close: "Close",
    backAria: "Back to app",
    notFound: "Page not found",
    emailLabel: "Email",
  },
  fr: {
    close: "Fermer",
    backAria: "Retour à l'app",
    notFound: "Page introuvable",
    emailLabel: "E-mail",
  },
};

const impressum: Record<Language, LegalDocument> = {
  de: {
    pageTitle: "Impressum",
    sections: [
      {
        title: "Angaben gemäß § 5 TMG",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          {
            kind: "p",
            text: 'Anbieter der App „Frigy“ (Marken-/Produktbezeichnung; es liegt kein im Handelsregister eingetragener Firmenname vor).',
          },
          ...LEGAL_ADDRESS_LINES.map((line) => ({ kind: "p" as const, text: line })),
        ],
      },
      {
        title: "Kontakt",
        blocks: [{ kind: "email", label: ui.de.emailLabel }],
      },
      {
        title: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          { kind: "p", text: LEGAL_ADDRESS },
        ],
      },
      {
        title: "EU-Streitschlichtung",
        blocks: [
          {
            kind: "odr",
            before: "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:",
            after: "Unsere E-Mail-Adresse finden Sie oben im Impressum.",
          },
        ],
      },
      {
        title: "Verbraucherstreitbeilegung/Universalschlichtungsstelle",
        blocks: [
          {
            kind: "p",
            text: "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
          },
        ],
      },
    ],
  },
  en: {
    pageTitle: "Legal Notice",
    sections: [
      {
        title: "Information pursuant to § 5 TMG (German Telemedia Act)",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          {
            kind: "p",
            text: 'Provider of the “Frigy” app (brand/product name; no company name registered in the commercial register).',
          },
          ...LEGAL_ADDRESS_LINES.map((line) => ({ kind: "p" as const, text: line })),
        ],
      },
      {
        title: "Contact",
        blocks: [{ kind: "email", label: ui.en.emailLabel }],
      },
      {
        title: "Responsible for content pursuant to § 55 (2) RStV",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          { kind: "p", text: LEGAL_ADDRESS },
        ],
      },
      {
        title: "EU dispute resolution",
        blocks: [
          {
            kind: "odr",
            before: "The European Commission provides a platform for online dispute resolution (ODR):",
            after: "You can find our email address above in this legal notice.",
          },
        ],
      },
      {
        title: "Consumer dispute resolution",
        blocks: [
          {
            kind: "p",
            text: "We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.",
          },
        ],
      },
    ],
  },
  fr: {
    pageTitle: "Mentions légales",
    sections: [
      {
        title: "Informations conformément au § 5 TMG (droit allemand des médias)",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          {
            kind: "p",
            text: "Fournisseur de l'application « Frigy » (nom de marque/produit ; aucune raison sociale inscrite au registre du commerce).",
          },
          ...LEGAL_ADDRESS_LINES.map((line) => ({ kind: "p" as const, text: line })),
        ],
      },
      {
        title: "Contact",
        blocks: [{ kind: "email", label: ui.fr.emailLabel }],
      },
      {
        title: "Responsable du contenu (§ 55 al. 2 RStV)",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          { kind: "p", text: LEGAL_ADDRESS },
        ],
      },
      {
        title: "Règlement des litiges UE",
        blocks: [
          {
            kind: "odr",
            before: "La Commission européenne met à disposition une plateforme de règlement en ligne des litiges (RLL) :",
            after: "Notre adresse e-mail figure ci-dessus dans les mentions légales.",
          },
        ],
      },
      {
        title: "Médiation consommateurs",
        blocks: [
          {
            kind: "p",
            text: "Nous ne sommes ni disposés ni obligés de participer à des procédures de règlement des litiges devant un organisme de médiation.",
          },
        ],
      },
    ],
  },
};

const privacy: Record<Language, LegalDocument> = {
  de: {
    pageTitle: "Datenschutzerklärung",
    sections: [
      {
        title: "1. Datenschutz auf einen Blick",
        blocks: [
          { kind: "h3", text: "Allgemeine Hinweise" },
          {
            kind: "p",
            text: "Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese App nutzen.",
          },
        ],
      },
      {
        title: "2. Verantwortliche Stelle",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          { kind: "p", text: LEGAL_ADDRESS },
          { kind: "email", label: ui.de.emailLabel },
        ],
      },
      {
        title: "3. Welche Daten erfassen wir?",
        blocks: [
          { kind: "h4", text: "Registrierungsdaten" },
          { kind: "p", text: "E-Mail-Adresse und Passwort bei der Kontoerstellung." },
          { kind: "h4", text: "Nutzungsdaten" },
          {
            kind: "ul",
            items: [
              "Ernährungsdaten (Kalorien, Makronährstoffe)",
              "Wasseraufnahme",
              "Gewichtsdaten",
              "Mahlzeitenpläne und Rezepte",
            ],
          },
          { kind: "h4", text: "Technische Daten" },
          {
            kind: "p",
            text: "IP-Adresse, Gerätetyp, Browsertyp (für Fehleranalyse und Verbesserung).",
          },
        ],
      },
      {
        title: "4. Wie nutzen wir Ihre Daten?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Bereitstellung und Personalisierung der App-Funktionen",
              "Speicherung Ihrer Ernährungs- und Fitnessdaten",
              "Versand von Erinnerungen (wenn aktiviert)",
              "Verbesserung unserer Dienste",
            ],
          },
        ],
      },
      {
        title: "5. Datenspeicherung",
        blocks: [
          {
            kind: "p",
            text: "Ihre Daten werden auf sicheren Servern in der EU gespeichert. Wir nutzen Supabase als Datenbankprovider, der DSGVO-konform arbeitet.",
          },
        ],
      },
      {
        title: "6. Ihre Rechte",
        blocks: [
          { kind: "p", text: "Sie haben das Recht auf:" },
          {
            kind: "ul",
            items: [
              "Auskunft über Ihre gespeicherten Daten",
              "Berichtigung unrichtiger Daten",
              "Löschung Ihrer Daten",
              "Einschränkung der Verarbeitung",
              "Datenübertragbarkeit",
              "Widerspruch gegen die Verarbeitung",
            ],
          },
        ],
      },
      {
        title: "7. Drittanbieter-Dienste",
        blocks: [
          { kind: "h4", text: "Supabase (Datenbank & Authentifizierung)" },
          {
            kind: "p",
            text: "Anbieter: Supabase Inc. Datenschutzrichtlinie: supabase.com/privacy",
          },
          { kind: "h4", text: "OpenAI (KI-Funktionen)" },
          {
            kind: "p",
            text: "Für die Analyse von Lebensmitteln und Rezeptgenerierung. Datenschutzrichtlinie: openai.com/privacy",
          },
          { kind: "h4", text: "Apple App Store / Google Play (In-App-Käufe)" },
          {
            kind: "p",
            text: "Für Premium-Abonnements über RevenueCat. Datenschutz: Apple/Google Store-Richtlinien.",
          },
        ],
      },
      {
        title: "8. Cookies & Local Storage",
        blocks: [
          {
            kind: "p",
            text: "Wir verwenden Local Storage, um Ihre Einstellungen und Sitzungsdaten zu speichern. Diese Daten verbleiben auf Ihrem Gerät.",
          },
        ],
      },
      {
        title: "9. Kontakt für Datenschutzanfragen",
        blocks: [
          {
            kind: "p",
            text: "Bei Fragen zum Datenschutz kontaktieren Sie uns unter:",
          },
          { kind: "email", label: ui.de.emailLabel },
        ],
      },
    ],
    disclaimer:
      "Stand: April 2026. Texte sind keine Rechtsberatung; bei Änderungen der Datenverarbeitung bitte anpassen.",
  },
  en: {
    pageTitle: "Privacy Policy",
    sections: [
      {
        title: "1. Privacy at a glance",
        blocks: [
          { kind: "h3", text: "General information" },
          {
            kind: "p",
            text: "The following information provides a simple overview of what happens to your personal data when you use this app.",
          },
        ],
      },
      {
        title: "2. Data controller",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          { kind: "p", text: LEGAL_ADDRESS },
          { kind: "email", label: ui.en.emailLabel },
        ],
      },
      {
        title: "3. What data do we collect?",
        blocks: [
          { kind: "h4", text: "Registration data" },
          { kind: "p", text: "Email address and password when creating an account." },
          { kind: "h4", text: "Usage data" },
          {
            kind: "ul",
            items: [
              "Nutrition data (calories, macronutrients)",
              "Water intake",
              "Weight data",
              "Meal plans and recipes",
            ],
          },
          { kind: "h4", text: "Technical data" },
          {
            kind: "p",
            text: "IP address, device type, browser type (for error analysis and improvement).",
          },
        ],
      },
      {
        title: "4. How do we use your data?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Providing and personalizing app features",
              "Storing your nutrition and fitness data",
              "Sending reminders (when enabled)",
              "Improving our services",
            ],
          },
        ],
      },
      {
        title: "5. Data storage",
        blocks: [
          {
            kind: "p",
            text: "Your data is stored on secure servers in the EU. We use Supabase as our database provider, which operates in compliance with the GDPR.",
          },
        ],
      },
      {
        title: "6. Your rights",
        blocks: [
          { kind: "p", text: "You have the right to:" },
          {
            kind: "ul",
            items: [
              "Access your stored data",
              "Rectify inaccurate data",
              "Erasure of your data",
              "Restriction of processing",
              "Data portability",
              "Object to processing",
            ],
          },
        ],
      },
      {
        title: "7. Third-party services",
        blocks: [
          { kind: "h4", text: "Supabase (database & authentication)" },
          { kind: "p", text: "Provider: Supabase Inc. Privacy policy: supabase.com/privacy" },
          { kind: "h4", text: "OpenAI (AI features)" },
          {
            kind: "p",
            text: "For food analysis and recipe generation. Privacy policy: openai.com/privacy",
          },
          { kind: "h4", text: "Apple App Store / Google Play (in-app purchases)" },
          {
            kind: "p",
            text: "For Premium subscriptions via RevenueCat. Privacy: Apple/Google store policies.",
          },
        ],
      },
      {
        title: "8. Cookies & local storage",
        blocks: [
          {
            kind: "p",
            text: "We use local storage to save your settings and session data. This data remains on your device.",
          },
        ],
      },
      {
        title: "9. Contact for privacy requests",
        blocks: [
          { kind: "p", text: "For privacy questions, contact us at:" },
          { kind: "email", label: ui.en.emailLabel },
        ],
      },
    ],
    disclaimer:
      "Last updated: April 2026. This text is not legal advice; update it if your data processing changes.",
  },
  fr: {
    pageTitle: "Politique de confidentialité",
    sections: [
      {
        title: "1. Confidentialité en bref",
        blocks: [
          { kind: "h3", text: "Informations générales" },
          {
            kind: "p",
            text: "Les informations suivantes donnent un aperçu simple de ce qui arrive à tes données personnelles lorsque tu utilises cette application.",
          },
        ],
      },
      {
        title: "2. Responsable du traitement",
        blocks: [
          { kind: "p", text: LEGAL_PROVIDER },
          { kind: "p", text: LEGAL_ADDRESS },
          { kind: "email", label: ui.fr.emailLabel },
        ],
      },
      {
        title: "3. Quelles données collectons-nous ?",
        blocks: [
          { kind: "h4", text: "Données d'inscription" },
          { kind: "p", text: "Adresse e-mail et mot de passe lors de la création du compte." },
          { kind: "h4", text: "Données d'utilisation" },
          {
            kind: "ul",
            items: [
              "Données nutritionnelles (calories, macronutriments)",
              "Apport en eau",
              "Données de poids",
              "Plans de repas et recettes",
            ],
          },
          { kind: "h4", text: "Données techniques" },
          {
            kind: "p",
            text: "Adresse IP, type d'appareil, type de navigateur (analyse d'erreurs et amélioration).",
          },
        ],
      },
      {
        title: "4. Comment utilisons-nous tes données ?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Fourniture et personnalisation des fonctions de l'app",
              "Stockage de tes données nutrition et fitness",
              "Envoi de rappels (si activés)",
              "Amélioration de nos services",
            ],
          },
        ],
      },
      {
        title: "5. Stockage des données",
        blocks: [
          {
            kind: "p",
            text: "Tes données sont stockées sur des serveurs sécurisés dans l'UE. Nous utilisons Supabase comme fournisseur de base de données, conforme au RGPD.",
          },
        ],
      },
      {
        title: "6. Tes droits",
        blocks: [
          { kind: "p", text: "Tu as le droit de :" },
          {
            kind: "ul",
            items: [
              "Accéder à tes données stockées",
              "Rectifier des données inexactes",
              "Supprimer tes données",
              "Limiter le traitement",
              "Portabilité des données",
              "T'opposer au traitement",
            ],
          },
        ],
      },
      {
        title: "7. Services tiers",
        blocks: [
          { kind: "h4", text: "Supabase (base de données et authentification)" },
          { kind: "p", text: "Fournisseur : Supabase Inc. Politique : supabase.com/privacy" },
          { kind: "h4", text: "OpenAI (fonctions IA)" },
          {
            kind: "p",
            text: "Pour l'analyse alimentaire et la génération de recettes. Politique : openai.com/privacy",
          },
          { kind: "h4", text: "Apple App Store / Google Play (achats in-app)" },
          {
            kind: "p",
            text: "Pour les abonnements Premium via RevenueCat. Confidentialité : politiques Apple/Google.",
          },
        ],
      },
      {
        title: "8. Cookies et stockage local",
        blocks: [
          {
            kind: "p",
            text: "Nous utilisons le stockage local pour enregistrer tes paramètres et données de session. Ces données restent sur ton appareil.",
          },
        ],
      },
      {
        title: "9. Contact pour les demandes de confidentialité",
        blocks: [
          { kind: "p", text: "Pour toute question sur la confidentialité, contacte-nous à :" },
          { kind: "email", label: ui.fr.emailLabel },
        ],
      },
    ],
    disclaimer:
      "Mise à jour : avril 2026. Ce texte ne constitue pas un conseil juridique ; à adapter en cas de changement du traitement des données.",
  },
};

const terms: Record<Language, LegalDocument> = {
  de: {
    pageTitle: "Allgemeine Geschäftsbedingungen",
    sections: [
      {
        title: "§ 1 Geltungsbereich",
        blocks: [
          {
            kind: "p",
            text: `Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der App „Frigy“ (nachfolgend „App“ genannt), bereitgestellt von ${LEGAL_PROVIDER} (nachfolgend „Anbieter“).`,
          },
        ],
      },
      {
        title: "§ 2 Leistungsbeschreibung",
        blocks: [
          { kind: "p", text: "Die App bietet folgende Funktionen:" },
          {
            kind: "ul",
            items: [
              "Tracking von Kalorien und Makronährstoffen",
              "Erstellung von Mahlzeitenplänen",
              "Rezeptvorschläge basierend auf KI",
              "Wassertracking",
              "Gewichtsverfolgung",
              "Barcode-Scanner für Lebensmittel",
            ],
          },
        ],
      },
      {
        title: "§ 3 Registrierung & Nutzerkonto",
        blocks: [
          { kind: "p", text: "(1) Die Nutzung der App erfordert eine Registrierung mit gültiger E-Mail-Adresse." },
          { kind: "p", text: "(2) Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten." },
          { kind: "p", text: "(3) Der Nutzer ist für alle Aktivitäten unter seinem Konto verantwortlich." },
        ],
      },
      {
        title: "§ 4 Premium-Funktionen",
        blocks: [
          {
            kind: "p",
            text: "(1) Nach Abschluss des Onboardings ist für die Nutzung der App-Funktionen (z. B. Tracker, Wochenplan, KI-Scan) ein kostenpflichtiges Premium-Abonnement erforderlich.",
          },
          {
            kind: "p",
            text: "(2) Beim monatlichen Abonnement kann ein kostenloser Testzeitraum von 3 Tagen angeboten werden; danach erfolgt die Abrechnung über den App Store, sofern nicht gekündigt.",
          },
          { kind: "p", text: "(3) Die aktuellen Preise und Leistungen sind in der App einsehbar." },
        ],
      },
      {
        title: "§ 5 Zahlungsbedingungen",
        blocks: [
          { kind: "p", text: "(1) Die Zahlung erfolgt über die App Stores (Apple/Google)." },
          { kind: "p", text: "(2) Abonnements verlängern sich automatisch, sofern nicht gekündigt." },
          { kind: "p", text: "(3) Kündigung ist jederzeit zum Ende der Laufzeit möglich." },
        ],
      },
      {
        title: "§ 6 Widerrufsrecht",
        blocks: [
          { kind: "p", text: "(1) Verbraucher haben ein 14-tägiges Widerrufsrecht." },
          {
            kind: "p",
            text: "(2) Bei digitalen Inhalten kann das Widerrufsrecht mit Zustimmung des Nutzers vor Ablauf der Frist erlöschen.",
          },
        ],
      },
      {
        title: "§ 7 Nutzerpflichten",
        blocks: [
          { kind: "p", text: "Der Nutzer verpflichtet sich:" },
          {
            kind: "ul",
            items: [
              "Keine falschen Angaben zu machen",
              "Die App nicht missbräuchlich zu nutzen",
              "Keine rechtswidrigen Inhalte zu teilen",
              "Die Rechte Dritter zu respektieren",
            ],
          },
        ],
      },
      {
        title: "§ 8 Haftungsausschluss",
        blocks: [
          {
            kind: "p",
            text: "(1) Die App dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.",
          },
          {
            kind: "p",
            text: "(2) Der Anbieter übernimmt keine Haftung für gesundheitliche Folgen durch die Nutzung der App.",
          },
          {
            kind: "p",
            text: "(3) Bei Gesundheitsfragen konsultieren Sie bitte einen Arzt oder Ernährungsberater.",
          },
        ],
      },
      {
        title: "§ 9 Verfügbarkeit",
        blocks: [
          {
            kind: "p",
            text: "Der Anbieter bemüht sich um eine hohe Verfügbarkeit, kann diese jedoch nicht garantieren. Wartungsarbeiten können zu temporären Einschränkungen führen.",
          },
        ],
      },
      {
        title: "§ 10 Änderungen der AGB",
        blocks: [
          {
            kind: "p",
            text: "Der Anbieter behält sich vor, diese AGB zu ändern. Nutzer werden über Änderungen informiert.",
          },
        ],
      },
      {
        title: "§ 11 Schlussbestimmungen",
        blocks: [
          { kind: "p", text: "(1) Es gilt deutsches Recht." },
          { kind: "p", text: "(2) Sollten einzelne Bestimmungen unwirksam sein, bleibt der Rest gültig." },
        ],
      },
    ],
    disclaimer:
      "Stand: April 2026. AGB durch Rechtsberatung prüfen lassen, wenn ihr kommerziell verkauft oder Abos anbietet.",
  },
  en: {
    pageTitle: "Terms of Service",
    sections: [
      {
        title: "§ 1 Scope",
        blocks: [
          {
            kind: "p",
            text: `These Terms of Service apply to the use of the “Frigy” app (the “App”), provided by ${LEGAL_PROVIDER} (the “Provider”).`,
          },
        ],
      },
      {
        title: "§ 2 Description of services",
        blocks: [
          { kind: "p", text: "The app offers the following features:" },
          {
            kind: "ul",
            items: [
              "Tracking calories and macronutrients",
              "Creating meal plans",
              "AI-based recipe suggestions",
              "Water tracking",
              "Weight tracking",
              "Barcode scanner for food products",
            ],
          },
        ],
      },
      {
        title: "§ 3 Registration & user account",
        blocks: [
          { kind: "p", text: "(1) Using the app requires registration with a valid email address." },
          { kind: "p", text: "(2) Users must keep their login credentials confidential." },
          { kind: "p", text: "(3) Users are responsible for all activity under their account." },
        ],
      },
      {
        title: "§ 4 Premium features",
        blocks: [
          {
            kind: "p",
            text: "(1) After onboarding, a paid Premium subscription is required to use app features (e.g. tracker, meal plan, AI scan).",
          },
          {
            kind: "p",
            text: "(2) The monthly plan may include a 3-day free trial; billing via the app store follows unless cancelled before the trial ends.",
          },
          { kind: "p", text: "(3) Current prices and features are shown in the app." },
        ],
      },
      {
        title: "§ 5 Payment terms",
        blocks: [
          { kind: "p", text: "(1) Payment is processed through the app stores (Apple/Google)." },
          { kind: "p", text: "(2) Subscriptions renew automatically unless cancelled." },
          { kind: "p", text: "(3) Cancellation is possible at any time effective at the end of the billing period." },
        ],
      },
      {
        title: "§ 6 Right of withdrawal",
        blocks: [
          { kind: "p", text: "(1) Consumers have a 14-day right of withdrawal." },
          {
            kind: "p",
            text: "(2) For digital content, the right of withdrawal may expire with the user's consent before the period ends.",
          },
        ],
      },
      {
        title: "§ 7 User obligations",
        blocks: [
          { kind: "p", text: "Users agree to:" },
          {
            kind: "ul",
            items: [
              "Not provide false information",
              "Not misuse the app",
              "Not share unlawful content",
              "Respect third-party rights",
            ],
          },
        ],
      },
      {
        title: "§ 8 Disclaimer",
        blocks: [
          {
            kind: "p",
            text: "(1) The app is for informational purposes only and does not replace medical advice.",
          },
          {
            kind: "p",
            text: "(2) The provider is not liable for health consequences arising from use of the app.",
          },
          {
            kind: "p",
            text: "(3) Please consult a doctor or nutritionist for health-related questions.",
          },
        ],
      },
      {
        title: "§ 9 Availability",
        blocks: [
          {
            kind: "p",
            text: "The provider strives for high availability but cannot guarantee it. Maintenance may cause temporary limitations.",
          },
        ],
      },
      {
        title: "§ 10 Changes to these terms",
        blocks: [
          {
            kind: "p",
            text: "The provider may change these terms. Users will be informed of changes.",
          },
        ],
      },
      {
        title: "§ 11 Final provisions",
        blocks: [
          { kind: "p", text: "(1) German law applies." },
          { kind: "p", text: "(2) If individual provisions are invalid, the remainder remains effective." },
        ],
      },
    ],
    disclaimer:
      "Last updated: April 2026. Have these terms reviewed by legal counsel if you sell commercially or offer subscriptions.",
  },
  fr: {
    pageTitle: "Conditions générales d'utilisation",
    sections: [
      {
        title: "§ 1 Champ d'application",
        blocks: [
          {
            kind: "p",
            text: `Les présentes conditions générales s'appliquent à l'utilisation de l'application « Frigy » (l'« App »), fournie par ${LEGAL_PROVIDER} (le « Fournisseur »).`,
          },
        ],
      },
      {
        title: "§ 2 Description des services",
        blocks: [
          { kind: "p", text: "L'application propose les fonctions suivantes :" },
          {
            kind: "ul",
            items: [
              "Suivi des calories et macronutriments",
              "Création de plans de repas",
              "Suggestions de recettes basées sur l'IA",
              "Suivi de l'eau",
              "Suivi du poids",
              "Scanner de codes-barres pour les aliments",
            ],
          },
        ],
      },
      {
        title: "§ 3 Inscription et compte utilisateur",
        blocks: [
          { kind: "p", text: "(1) L'utilisation de l'app nécessite une inscription avec une adresse e-mail valide." },
          { kind: "p", text: "(2) L'utilisateur doit garder ses identifiants confidentiels." },
          { kind: "p", text: "(3) L'utilisateur est responsable de toute activité sur son compte." },
        ],
      },
      {
        title: "§ 4 Fonctions Premium",
        blocks: [
          {
            kind: "p",
            text: "(1) Après l'onboarding, un abonnement Premium payant est requis pour utiliser les fonctions de l'app (suivi, plan hebdo, scan IA, etc.).",
          },
          {
            kind: "p",
            text: "(2) L'abonnement mensuel peut inclure un essai gratuit de 3 jours ; la facturation via le store suit sauf résiliation avant la fin de l'essai.",
          },
          { kind: "p", text: "(3) Les prix et prestations actuels sont visibles dans l'app." },
        ],
      },
      {
        title: "§ 5 Conditions de paiement",
        blocks: [
          { kind: "p", text: "(1) Le paiement s'effectue via les stores (Apple/Google)." },
          { kind: "p", text: "(2) Les abonnements se renouvellent automatiquement sauf résiliation." },
          {
            kind: "p",
            text: "(3) La résiliation est possible à tout moment à la fin de la période en cours.",
          },
        ],
      },
      {
        title: "§ 6 Droit de rétractation",
        blocks: [
          { kind: "p", text: "(1) Les consommateurs disposent d'un droit de rétractation de 14 jours." },
          {
            kind: "p",
            text: "(2) Pour les contenus numériques, ce droit peut expirer avec le consentement de l'utilisateur avant la fin du délai.",
          },
        ],
      },
      {
        title: "§ 7 Obligations de l'utilisateur",
        blocks: [
          { kind: "p", text: "L'utilisateur s'engage à :" },
          {
            kind: "ul",
            items: [
              "Ne pas fournir de fausses informations",
              "Ne pas utiliser l'app de manière abusive",
              "Ne pas partager de contenus illégaux",
              "Respecter les droits des tiers",
            ],
          },
        ],
      },
      {
        title: "§ 8 Clause de non-responsabilité",
        blocks: [
          {
            kind: "p",
            text: "(1) L'app est fournie à titre informatif uniquement et ne remplace pas un avis médical.",
          },
          {
            kind: "p",
            text: "(2) Le fournisseur n'est pas responsable des conséquences sur la santé liées à l'utilisation de l'app.",
          },
          {
            kind: "p",
            text: "(3) En cas de questions de santé, consulte un médecin ou un nutritionniste.",
          },
        ],
      },
      {
        title: "§ 9 Disponibilité",
        blocks: [
          {
            kind: "p",
            text: "Le fournisseur s'efforce d'assurer une haute disponibilité sans garantie. La maintenance peut entraîner des interruptions temporaires.",
          },
        ],
      },
      {
        title: "§ 10 Modifications des CGU",
        blocks: [
          {
            kind: "p",
            text: "Le fournisseur se réserve le droit de modifier ces conditions. Les utilisateurs seront informés des changements.",
          },
        ],
      },
      {
        title: "§ 11 Dispositions finales",
        blocks: [
          { kind: "p", text: "(1) Le droit allemand s'applique." },
          {
            kind: "p",
            text: "(2) Si certaines dispositions sont invalides, les autres restent en vigueur.",
          },
        ],
      },
    ],
    disclaimer:
      "Mise à jour : avril 2026. Faire vérifier ces CGU par un conseil juridique en cas de vente commerciale ou d'abonnements.",
  },
};

const documents: Record<LegalPageType, Record<Language, LegalDocument>> = {
  impressum,
  datenschutz: privacy,
  agb: terms,
};

export function getLegalUiCopy(language: Language): LegalUiCopy {
  return ui[language] ?? ui.de;
}

export function getLegalDocument(
  type: LegalPageType | string | undefined,
  language: Language,
): LegalDocument | null {
  if (type !== "impressum" && type !== "datenschutz" && type !== "agb") {
    return null;
  }
  return documents[type][language] ?? documents[type].de;
}
