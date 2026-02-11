import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const LegalPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

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
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold truncate">{getTitle()}</h1>
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

const ImpressumContent = () => (
  <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
    <section>
      <h2 className="text-lg font-semibold text-foreground">Angaben gemäß § 5 TMG</h2>
      <div className="text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">frigy GmbH</p>
        <p>Musterstraße 1</p>
        <p>10115 Berlin</p>
        <p>Deutschland</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
      <div className="text-muted-foreground space-y-1">
        <p>E-Mail: contact@frigy.de</p>
        <p>Telefon: +49 (0) 30 12345678</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <div className="text-muted-foreground space-y-1">
        <p>frigy GmbH</p>
        <p>Musterstraße 1, 10115 Berlin</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">EU-Streitschlichtung</h2>
      <p className="text-muted-foreground">
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
          https://ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p className="text-muted-foreground">
        Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
      <p className="text-muted-foreground">
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </section>

  </div>
);

const DatenschutzContent = () => (
  <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
    <section>
      <h2 className="text-lg font-semibold text-foreground">1. Datenschutz auf einen Blick</h2>
      <h3 className="text-base font-medium text-foreground mt-4">Allgemeine Hinweise</h3>
      <p className="text-muted-foreground">
        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese App nutzen.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">2. Verantwortliche Stelle</h2>
      <div className="text-muted-foreground space-y-1">
        <p>frigy GmbH</p>
        <p>Musterstraße 1, 10115 Berlin</p>
        <p>E-Mail: contact@frigy.de</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">3. Welche Daten erfassen wir?</h2>
      <div className="text-muted-foreground space-y-3">
        <div>
          <h4 className="font-medium text-foreground">Registrierungsdaten</h4>
          <p>E-Mail-Adresse und Passwort bei der Kontoerstellung.</p>
        </div>
        <div>
          <h4 className="font-medium text-foreground">Nutzungsdaten</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Ernährungsdaten (Kalorien, Makronährstoffe)</li>
            <li>Wasseraufnahme</li>
            <li>Gewichtsdaten</li>
            <li>Mahlzeitenpläne und Rezepte</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-foreground">Technische Daten</h4>
          <p>IP-Adresse, Gerätetyp, Browsertyp (für Fehleranalyse und Verbesserung).</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">4. Wie nutzen wir Ihre Daten?</h2>
      <ul className="list-disc list-inside text-muted-foreground space-y-1">
        <li>Bereitstellung und Personalisierung der App-Funktionen</li>
        <li>Speicherung Ihrer Ernährungs- und Fitnessdaten</li>
        <li>Versand von Erinnerungen (wenn aktiviert)</li>
        <li>Verbesserung unserer Dienste</li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">5. Datenspeicherung</h2>
      <p className="text-muted-foreground">
        Ihre Daten werden auf sicheren Servern in der EU gespeichert. Wir nutzen Supabase als Datenbankprovider, 
        der DSGVO-konform arbeitet.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">6. Ihre Rechte</h2>
      <p className="text-muted-foreground">Sie haben das Recht auf:</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1">
        <li><strong>Auskunft</strong> über Ihre gespeicherten Daten</li>
        <li><strong>Berichtigung</strong> unrichtiger Daten</li>
        <li><strong>Löschung</strong> Ihrer Daten</li>
        <li><strong>Einschränkung</strong> der Verarbeitung</li>
        <li><strong>Datenübertragbarkeit</strong></li>
        <li><strong>Widerspruch</strong> gegen die Verarbeitung</li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">7. Drittanbieter-Dienste</h2>
      <div className="text-muted-foreground space-y-3">
        <div>
          <h4 className="font-medium text-foreground">Supabase (Datenbank & Authentifizierung)</h4>
          <p>Anbieter: Supabase Inc. Datenschutzrichtlinie: supabase.com/privacy</p>
        </div>
        <div>
          <h4 className="font-medium text-foreground">OpenAI (KI-Funktionen)</h4>
          <p>Für die Analyse von Lebensmitteln und Rezeptgenerierung. Datenschutzrichtlinie: openai.com/privacy</p>
        </div>
        <div>
          <h4 className="font-medium text-foreground">Stripe (Zahlungsabwicklung)</h4>
          <p>Für Premium-Abonnements. Datenschutzrichtlinie: stripe.com/privacy</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">8. Cookies & Local Storage</h2>
      <p className="text-muted-foreground">
        Wir verwenden Local Storage, um Ihre Einstellungen und Sitzungsdaten zu speichern. 
        Diese Daten verbleiben auf Ihrem Gerät.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">9. Kontakt für Datenschutzanfragen</h2>
      <p className="text-muted-foreground">
        Bei Fragen zum Datenschutz kontaktieren Sie uns unter: contact@frigy.de
      </p>
    </section>

    <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
      <p className="text-xs text-muted-foreground">
        Stand: Dezember 2024. Bitte ersetzen Sie alle Platzhalter durch Ihre Daten.
      </p>
    </div>
  </div>
);

const AGBContent = () => (
  <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 1 Geltungsbereich</h2>
      <p className="text-muted-foreground">
        Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der App "frigy"
        (nachfolgend "App" genannt), bereitgestellt von frigy GmbH (nachfolgend "Anbieter").
      </p>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 2 Leistungsbeschreibung</h2>
      <p className="text-muted-foreground">Die App bietet folgende Funktionen:</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1">
        <li>Tracking von Kalorien und Makronährstoffen</li>
        <li>Erstellung von Mahlzeitenplänen</li>
        <li>Rezeptvorschläge basierend auf KI</li>
        <li>Wassertracking</li>
        <li>Gewichtsverfolgung</li>
        <li>Barcode-Scanner für Lebensmittel</li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 3 Registrierung & Nutzerkonto</h2>
      <div className="text-muted-foreground space-y-2">
        <p>(1) Die Nutzung der App erfordert eine Registrierung mit gültiger E-Mail-Adresse.</p>
        <p>(2) Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten.</p>
        <p>(3) Der Nutzer ist für alle Aktivitäten unter seinem Konto verantwortlich.</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 4 Kostenlose & Premium-Funktionen</h2>
      <div className="text-muted-foreground space-y-2">
        <p>(1) Die Grundfunktionen der App sind kostenlos nutzbar (mit Einschränkungen).</p>
        <p>(2) Premium-Funktionen sind über ein kostenpflichtiges Abonnement verfügbar.</p>
        <p>(3) Die aktuellen Preise und Leistungen sind in der App einsehbar.</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 5 Zahlungsbedingungen</h2>
      <div className="text-muted-foreground space-y-2">
        <p>(1) Die Zahlung erfolgt über die App Stores (Apple/Google) oder Stripe.</p>
        <p>(2) Abonnements verlängern sich automatisch, sofern nicht gekündigt.</p>
        <p>(3) Kündigung ist jederzeit zum Ende der Laufzeit möglich.</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 6 Widerrufsrecht</h2>
      <div className="text-muted-foreground space-y-2">
        <p>(1) Verbraucher haben ein 14-tägiges Widerrufsrecht.</p>
        <p>(2) Bei digitalen Inhalten kann das Widerrufsrecht mit Zustimmung des Nutzers vor Ablauf der Frist erlöschen.</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 7 Nutzerpflichten</h2>
      <p className="text-muted-foreground">Der Nutzer verpflichtet sich:</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1">
        <li>Keine falschen Angaben zu machen</li>
        <li>Die App nicht missbräuchlich zu nutzen</li>
        <li>Keine rechtswidrigen Inhalte zu teilen</li>
        <li>Die Rechte Dritter zu respektieren</li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 8 Haftungsausschluss</h2>
      <div className="text-muted-foreground space-y-2">
        <p>(1) Die App dient nur zu Informationszwecken und ersetzt keine medizinische Beratung.</p>
        <p>(2) Der Anbieter übernimmt keine Haftung für gesundheitliche Folgen durch die Nutzung der App.</p>
        <p>(3) Bei Gesundheitsfragen konsultieren Sie bitte einen Arzt oder Ernährungsberater.</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 9 Verfügbarkeit</h2>
      <p className="text-muted-foreground">
        Der Anbieter bemüht sich um eine hohe Verfügbarkeit, kann diese jedoch nicht garantieren. 
        Wartungsarbeiten können zu temporären Einschränkungen führen.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 10 Änderungen der AGB</h2>
      <p className="text-muted-foreground">
        Der Anbieter behält sich vor, diese AGB zu ändern. Nutzer werden über Änderungen informiert.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-foreground">§ 11 Schlussbestimmungen</h2>
      <div className="text-muted-foreground space-y-2">
        <p>(1) Es gilt deutsches Recht.</p>
        <p>(2) Sollten einzelne Bestimmungen unwirksam sein, bleibt der Rest gültig.</p>
      </div>
    </section>

    <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
      <p className="text-xs text-muted-foreground">
        Stand: Dezember 2024. Ersetzen Sie [Ihr Name/Firma] durch Ihre Daten.
      </p>
    </div>
  </div>
);

export default LegalPage;
