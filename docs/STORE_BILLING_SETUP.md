# App Store & Google Play Abos (RevenueCat)

Die **native iOS/Android-App** nutzt **In-App-Käufe** über [RevenueCat](https://www.revenuecat.com/). Premium läuft ausschließlich über App Store / Google Play (kein Stripe).

## 1. App Store Connect (iOS)

1. Erstelle Auto-Renewable Subscriptions (z. B. `premium_monthly`, `premium_yearly`).
2. **Preise (UI / Marketing):** Monat **€9,99** mit **3 Tagen** Gratis-Testphase (Introductory Offer), Jahr **€36,95** — müssen exakt in App Store Connect / Play Console eingetragen sein.
3. Lege eine **Subscription Group** an und veröffentliche die Produkte (mind. Sandbox).
4. Notiere die **Product IDs** – sie müssen in RevenueCat übereinstimmen.

## 2. Google Play Console (Android)

1. Erstelle Abonnements mit denselben logischen IDs wie in RevenueCat.
2. Aktiviere **License testing** für interne Tester.
3. Verknüpfe das Play-Projekt mit RevenueCat (Service Account JSON in RevenueCat).

## 3. RevenueCat Dashboard

1. Neues Projekt → Apps für **iOS** und **Android** hinzufügen.
2. Unter **Products** die Store-Produkte importieren.
3. **Entitlement** `premium` anlegen und beiden Produkten zuweisen.
4. **Offering** `default` mit Packages:
   - `$rc_monthly` → Monatsabo
   - `$rc_annual` → Jahresabo
5. **API Keys** kopieren:
   - Public iOS → `VITE_REVENUECAT_API_KEY_IOS`
   - Public Android → `VITE_REVENUECAT_API_KEY_ANDROID`
   - Secret → Supabase `REVENUECAT_SECRET_API_KEY`
6. **Webhook** auf Supabase Edge Function:
   - URL: `https://<project>.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization Header = `REVENUECAT_WEBHOOK_AUTH` (gleicher Wert in Supabase Secrets)

## 4. Umgebungsvariablen

### Client (`.env`)

```env
VITE_REVENUECAT_API_KEY_IOS=appl_...
VITE_REVENUECAT_API_KEY_ANDROID=goog_...
VITE_REVENUECAT_ENTITLEMENT_ID=premium
```

### Supabase Secrets

```bash
supabase secrets set REVENUECAT_SECRET_API_KEY=sk_...
supabase secrets set REVENUECAT_WEBHOOK_AUTH=<langer-zufallsstring>
supabase secrets set REVENUECAT_ENTITLEMENT_ID=premium
```

Edge Functions deployen:

```bash
supabase functions deploy sync-store-subscription
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

## 5. App-Verhalten

| Plattform | Checkout | Abo verwalten |
|-----------|----------|----------------|
| iOS/Android (Capacitor) | Store-Kauf via RevenueCat SDK | App Store / Play Store Einstellungen |
| Web (Browser) | Paywall / Referral (kein Stripe) | App Store / Play Store (native) oder Profil |

Nach erfolgreichem Store-Kauf ruft die App `sync-store-subscription` auf und schreibt den Status in `subscription_cache`. `check-subscription` erkennt Store-Abos (`product_id` mit Präfix `rc_`).

## 6. Store-Review Checkliste

- Keine externen Zahlungslinks in der **nativen** App für digitale Inhalte.
- Paywall zeigt **Abonnementname, Laufzeit, Preis**, Auto-Renewal-Text sowie Links zu **AGB** und **Datenschutz**.
- „Abonnement verwalten“ / „Käufe wiederherstellen“ für Store-Abos anbieten.
- Privacy Policy & Terms in App und Store-Listing verlinken.
- Sandbox-Tester in App Store Connect / Play Console anlegen vor dem Review.
- RevenueCat API Keys in Codemagic (Build bricht ohne Keys ab).

## 7. Testen

1. `.env` mit RevenueCat Public Keys füllen.
2. `npm run build` → `npx cap sync` → auf echtem Gerät starten.
3. Sandbox-Apple-ID (iOS) bzw. License Tester (Android) verwenden.
4. Nach Kauf: Profil → Abo aktualisieren oder App neu starten; Premium sollte aktiv sein.

## 8. Fehlerbehebung: „None of the products … could be fetched“ / leere Offerings

Dieser Fehler kommt **nicht** vom App-Code, sondern wenn **StoreKit** die Product IDs aus RevenueCat nicht in App Store Connect findet.

### Checkliste App Store Connect

| Punkt | Wo prüfen |
|-------|-----------|
| Paid Applications Agreement aktiv | App Store Connect → **Geschäft** → Verträge |
| Bank + Steuer „Clear“ | Geschäft → Banking / Tax |
| Abos unter **dieser** App (`com.frigyapp.app`) | Meine Apps → Frigy → Abonnements |
| Product IDs **exakt** wie in RevenueCat (Groß/Klein, Unterstriche) | Abo-Detail → Product ID |
| Status **Bereit zur Übermittlung** (mind. für Sandbox) | Jedes Abo + Subscription Group |
| Subscription Group lokalisiert (Name + App-Name) | Abonnementgruppe → Lokalisierungen |
| Jedes Abo: Preis, Dauer, Lokalisierung, Review-Screenshot | Abo-Detail |
| Intro Offer (3 Tage gratis) optional, aber Preis muss gesetzt sein | Introductory Offers |

Neue Produkte können **bis zu 24 h** brauchen, bis StoreKit sie liefert.

### Checkliste RevenueCat

| Punkt | Wo prüfen |
|-------|-----------|
| iOS-App Bundle ID = `com.frigyapp.app` | Project → Apps |
| App Store Connect API Key oder Shared Secret hinterlegt | App → App Store Connect |
| Products importiert, IDs = ASC | Products |
| Entitlement `premium` beiden Produkten zugewiesen | Entitlements |
| Offering `default` = **Current** | Offerings |
| Packages `$rc_monthly` / `$rc_annual` → richtige Store-Produkte | Offering `default` |
| Public Key `appl_…` in Codemagic `VITE_REVENUECAT_API_KEY_IOS` | Codemagic → Group `frigy` |

### Test-Hinweise

- **Echtes iPhone** mit Sandbox-Apple-ID (Einstellungen → App Store → Sandbox-Konto), nicht Simulator ohne StoreKit-Datei.
- Nach Änderungen an ASC/RevenueCat: App **neu installieren** oder kurz warten.
- RevenueCat Dashboard → **Customer** des Users → „Restore“ / Logs prüfen.
- Xcode: Capability **In-App Purchase** am Target aktiv (siehe `IOS_APP_STORE_COMPLIANCE.md`).

### Typische Ursachen

1. Product ID in RevenueCat heißt z. B. `premium_monthly`, in ASC aber anders (Tippfehler).
2. Abos in ASC angelegt, aber Subscription Group nicht lokalisiert → Status bleibt unvollständig.
3. Falscher RevenueCat API Key (anderes Projekt / Android-Key auf iOS).
4. Paid Applications Agreement noch nicht unterzeichnet.
