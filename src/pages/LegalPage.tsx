import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const LegalPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const handleClose = () => {
    if (from && typeof from === "string" && from.startsWith("/")) {
      navigate(from, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  const getContent = () => {
    switch (type) {
      case "impressum":
        return <ImpressumContent />;
      case "datenschutz":
        return <DatenschutzContent />;
      case "agb":
        return <AGBContent />;
      default:
        return <div>Seite nicht gefunden</div>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "impressum":
        return "Impressum";
      case "datenschutz":
        return "Datenschutzerklärung";
      case "agb":
        return "Allgemeine Geschäftsbedingungen";
      default:
        return "Rechtliches";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0"
            aria-label="Zurück zur App"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold truncate flex-1">{getTitle()}</h1>
          <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={handleClose} type="button">
            Schließen
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-3xl mx-auto p-4 pb-20">
          {getContent()}
        </div>
      </ScrollArea>
    </div>
  );
};

const IMPRESSUM_ANBIETER = "Doaa Attia";
const IMPRESSUM_ANSCHRIFT_ZEILEN = ["Wilhelm-Diess-Weg 3a", "94081 Fürstenzell", "Deutschland"];
const IMPRESSUM_EMAIL = "frigy.team@gmail.com";

const ImpressumContent = () => (
  <div className="max-w-none space-y-6 sm:space-y-8">
    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">Angaben gemäß § 5 TMG</h2>
      <div className="text-muted-foreground space-y-1 mt-3">
        <p className="font-medium text-foreground text-sm sm:text-base">{IMPRESSUM_ANBIETER}</p>
        <p className="text-sm sm:text-base text-muted-foreground/90">
          Anbieter der App „Frigy“ (Marken-/Produktbezeichnung; es liegt kein im Handelsregister eingetragener
          Firmenname vor).
        </p>
        {IMPRESSUM_ANSCHRIFT_ZEILEN.map((line) => (
          <p key={line} className="text-sm sm:text-base">
            {line}
          </p>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">Kontakt</h2>
      <div className="text-muted-foreground space-y-1 mt-3">
        <p className="text-sm sm:text-base">
          E-Mail:{" "}
          <a href={`mailto:${IMPRESSUM_EMAIL}`} className="text-primary hover:underline">
            {IMPRESSUM_EMAIL}
          </a>
        </p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <div className="text-muted-foreground space-y-1 mt-3">
        <p className="text-sm sm:text-base">{IMPRESSUM_ANBIETER}</p>
        <p className="text-sm sm:text-base">{IMPRESSUM_ANSCHRIFT_ZEILEN.join(", ")}</p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">EU-Streitschlichtung</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
          https://ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p className="text-muted-foreground text-sm sm:text-base mt-2">
        Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </section>

  </div>
);

const DatenschutzContent = () => (
  <div className="max-w-none space-y-6 sm:space-y-8">
    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">1. Datenschutz auf einen Blick</h2>
      <h3 className="text-sm sm:text-base font-medium text-foreground mt-4">Allgemeine Hinweise</h3>
      <p className="text-muted-foreground text-sm sm:text-base mt-2">
        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese App nutzen.
      </p>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">2. Verantwortliche Stelle</h2>
      <div className="text-muted-foreground space-y-1 mt-3">
        <p className="text-sm sm:text-base">{IMPRESSUM_ANBIETER}</p>
        <p className="text-sm sm:text-base">{IMPRESSUM_ANSCHRIFT_ZEILEN.join(", ")}</p>
        <p className="text-sm sm:text-base">
          E-Mail:{" "}
          <a href={`mailto:${IMPRESSUM_EMAIL}`} className="text-primary hover:underline">
            {IMPRESSUM_EMAIL}
          </a>
        </p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">3. Welche Daten erfassen wir?</h2>
      <div className="text-muted-foreground space-y-3 mt-3">
        <div>
          <h4 className="font-medium text-foreground text-sm sm:text-base">Registrierungsdaten</h4>
          <p className="text-sm sm:text-base mt-1">E-Mail-Adresse und Passwort bei der Kontoerstellung.</p>
        </div>
        <div>
          <h4 className="font-medium text-foreground text-sm sm:text-base">Nutzungsdaten</h4>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li className="text-sm sm:text-base">Ernährungsdaten (Kalorien, Makronährstoffe)</li>
            <li className="text-sm sm:text-base">Wasseraufnahme</li>
            <li className="text-sm sm:text-base">Gewichtsdaten</li>
            <li className="text-sm sm:text-base">Mahlzeitenpläne und Rezepte</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-foreground text-sm sm:text-base">Technische Daten</h4>
          <p className="text-sm sm:text-base mt-1">IP-Adresse, Gerätetyp, Browsertyp (für Fehleranalyse und Verbesserung).</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">4. Wie nutzen wir Ihre Daten?</h2>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-3">
        <li className="text-sm sm:text-base">Bereitstellung und Personalisierung der App-Funktionen</li>
        <li className="text-sm sm:text-base">Speicherung Ihrer Ernährungs- und Fitnessdaten</li>
        <li className="text-sm sm:text-base">Versand von Erinnerungen (wenn aktiviert)</li>
        <li className="text-sm sm:text-base">Verbesserung unserer Dienste</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">5. Datenspeicherung</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Ihre Daten werden auf sicheren Servern in der EU gespeichert. Wir nutzen Supabase als Datenbankprovider,
        der DSGVO-konform arbeitet.
      </p>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">6. Ihre Rechte</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">Sie haben das Recht auf:</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
        <li className="text-sm sm:text-base"><strong>Auskunft</strong> über Ihre gespeicherten Daten</li>
        <li className="text-sm sm:text-base"><strong>Berichtigung</strong> unrichtiger Daten</li>
        <li className="text-sm sm:text-base"><strong>Löschung</strong> Ihrer Daten</li>
        <li className="text-sm sm:text-base"><strong>Einschränkung</strong> der Verarbeitung</li>
        <li className="text-sm sm:text-base"><strong>Datenübertragbarkeit</strong></li>
        <li className="text-sm sm:text-base"><strong>Widerspruch</strong> gegen die Verarbeitung</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">7. Drittanbieter-Dienste</h2>
      <div className="text-muted-foreground space-y-3 mt-3">
        <div>
          <h4 className="font-medium text-foreground text-sm sm:text-base">Supabase (Datenbank & Authentifizierung)</h4>
          <p className="text-sm sm:text-base mt-1">Anbieter: Supabase Inc. Datenschutzrichtlinie: supabase.com/privacy</p>
        </div>
        <div>
          <h4 className="font-medium text-foreground text-sm sm:text-base">OpenAI (KI-Funktionen)</h4>
          <p className="text-sm sm:text-base mt-1">Für die Analyse von Lebensmitteln und Rezeptgenerierung. Datenschutzrichtlinie: openai.com/privacy</p>
        </div>
        <div>
          <h4 className="font-medium text-foreground text-sm sm:text-base">Apple App Store / Google Play (In-App-Käufe)</h4>
          <p className="text-sm sm:text-base mt-1">Für Premium-Abonnements über RevenueCat. Datenschutz: Apple/Google Store-Richtlinien.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">8. Cookies & Local Storage</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Wir verwenden Local Storage, um Ihre Einstellungen und Sitzungsdaten zu speichern.
        Diese Daten verbleiben auf Ihrem Gerät.
      </p>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">9. Kontakt für Datenschutzanfragen</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Bei Fragen zum Datenschutz kontaktieren Sie uns unter:{" "}
        <a href={`mailto:${IMPRESSUM_EMAIL}`} className="text-primary hover:underline">
          {IMPRESSUM_EMAIL}
        </a>
      </p>
    </section>

    <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
      <p className="text-xs sm:text-sm text-muted-foreground">
        Stand: April 2026. Texte sind keine Rechtsberatung; bei Änderungen der Datenverarbeitung bitte
        anpassen.
      </p>
    </div>
  </div>
);

const AGBContent = () => (
  <div className="max-w-none space-y-6 sm:space-y-8">
    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 1 Geltungsbereich</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der App „Frigy“
        (nachfolgend „App“ genannt), bereitgestellt von {IMPRESSUM_ANBIETER} (nachfolgend „Anbieter“).
      </p>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 2 Leistungsbeschreibung</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">Die App bietet folgende Funktionen:</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
        <li className="text-sm sm:text-base">Tracking von Kalorien und Makronährstoffen</li>
        <li className="text-sm sm:text-base">Erstellung von Mahlzeitenplänen</li>
        <li className="text-sm sm:text-base">Rezeptvorschläge basierend auf KI</li>
        <li className="text-sm sm:text-base">Wassertracking</li>
        <li className="text-sm sm:text-base">Gewichtsverfolgung</li>
        <li className="text-sm sm:text-base">Barcode-Scanner für Lebensmittel</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 3 Registrierung & Nutzerkonto</h2>
      <div className="text-muted-foreground space-y-2 mt-3">
        <p className="text-sm sm:text-base">(1) Die Nutzung der App erfordert eine Registrierung mit gültiger E-Mail-Adresse.</p>
        <p className="text-sm sm:text-base">(2) Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten.</p>
        <p className="text-sm sm:text-base">(3) Der Nutzer ist für alle Aktivitäten unter seinem Konto verantwortlich.</p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 4 Kostenlose & Premium-Funktionen</h2>
      <div className="text-muted-foreground space-y-2 mt-3">
        <p className="text-sm sm:text-base">(1) Die Grundfunktionen der App sind kostenlos nutzbar (mit Einschränkungen).</p>
        <p className="text-sm sm:text-base">(2) Premium-Funktionen sind über ein kostenpflichtiges Abonnement verfügbar.</p>
        <p className="text-sm sm:text-base">(3) Die aktuellen Preise und Leistungen sind in der App einsehbar.</p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 5 Zahlungsbedingungen</h2>
      <div className="text-muted-foreground space-y-2 mt-3">
        <p className="text-sm sm:text-base">(1) Die Zahlung erfolgt über die App Stores (Apple/Google).</p>
        <p className="text-sm sm:text-base">(2) Abonnements verlängern sich automatisch, sofern nicht gekündigt.</p>
        <p className="text-sm sm:text-base">(3) Kündigung ist jederzeit zum Ende der Laufzeit möglich.</p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 6 Widerrufsrecht</h2>
      <div className="text-muted-foreground space-y-2 mt-3">
        <p className="text-sm sm:text-base">(1) Verbraucher haben ein 14-tägiges Widerrufsrecht.</p>
        <p className="text-sm sm:text-base">(2) Bei digitalen Inhalten kann das Widerrufsrecht mit Zustimmung des Nutzers vor Ablauf der Frist erlöschen.</p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 7 Nutzerpflichten</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">Der Nutzer verpflichtet sich:</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
        <li className="text-sm sm:text-base">Keine falschen Angaben zu machen</li>
        <li className="text-sm sm:text-base">Die App nicht missbräuchlich zu nutzen</li>
        <li className="text-sm sm:text-base">Keine rechtswidrigen Inhalte zu teilen</li>
        <li className="text-sm sm:text-base">Die Rechte Dritter zu respektieren</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 8 Haftungsausschluss</h2>
      <div className="text-muted-foreground space-y-2 mt-3">
        <p className="text-sm sm:text-base">(1) Die App dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.</p>
        <p className="text-sm sm:text-base">(2) Der Anbieter übernimmt keine Haftung für gesundheitliche Folgen durch die Nutzung der App.</p>
        <p className="text-sm sm:text-base">(3) Bei Gesundheitsfragen konsultieren Sie bitte einen Arzt oder Ernährungsberater.</p>
      </div>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 9 Verfügbarkeit</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Der Anbieter bemüht sich um eine hohe Verfügbarkeit, kann diese jedoch nicht garantieren.
        Wartungsarbeiten können zu temporären Einschränkungen führen.
      </p>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 10 Änderungen der AGB</h2>
      <p className="text-muted-foreground text-sm sm:text-base mt-3">
        Der Anbieter behält sich vor, diese AGB zu ändern. Nutzer werden über Änderungen informiert.
      </p>
    </section>

    <section>
      <h2 className="text-base sm:text-lg font-semibold text-foreground">§ 11 Schlussbestimmungen</h2>
      <div className="text-muted-foreground space-y-2 mt-3">
        <p className="text-sm sm:text-base">(1) Es gilt deutsches Recht.</p>
        <p className="text-sm sm:text-base">(2) Sollten einzelne Bestimmungen unwirksam sein, bleibt der Rest gültig.</p>
      </div>
    </section>

    <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
      <p className="text-xs sm:text-sm text-muted-foreground">
        Stand: April 2026. AGB durch Rechtsberatung prüfen lassen, wenn ihr kommerziell verkauft oder
        Abos anbietet.
      </p>
    </div>
  </div>
);

export default LegalPage;
