# App Store & Google Play Abos (RevenueCat)

Die **native iOS/Android-App** nutzt **In-App-Käufe** über [RevenueCat](https://www.revenuecat.com/). Premium läuft ausschließlich über App Store / Google Play (kein Stripe).

## 1. App Store Connect (iOS)

1. Erstelle Auto-Renewable Subscriptions (z. B. `premium_monthly`, `premium_yearly`).
2. Lege eine **Subscription Group** an und veröffentliche die Produkte (mind. Sandbox).
3. Notiere die **Product IDs** – sie müssen in RevenueCat übereinstimmen.

## 2. Google Play Console (Android)

1. Erstelle Abonnements mit denselben logischen IDs wie in RevenueCat.
2. Aktiviere **License testing** für interne Tester.
3. Verknüpfe das Play-Projekt mit RevenueCat (Service Account JSON in RevenueCat).

### Geschenk-Angebot (Paywall X → reduzierter Jahrespreis)

**Du brauchst kein zweites RevenueCat-Annual-Package.**

Auf dem **selben** Google-Play-Abonnement zwei **Base Plans**:

| Base Plan ID | Verwendung |
|--------------|------------|
| z. B. `yearly` / Standard | Normale Paywall → Jahresabo |
| **`paywall-gift`** | Geschenk-Angebot (reduzierter Preis) |

1. Play Console → **Abonnements** → Jahresabo → **Base plan hinzufügen**
2. **Base plan ID:** `paywall-gift`
3. Laufzeit 1 Jahr, **reduzierter Preis** (z. B. 30 % unter dem Standard-Jahrespreis)
4. Veröffentlichen

Die App kauft den Base Plan `paywall-gift` per `purchaseSubscriptionOption` — der Play-Dialog zeigt den **echten Rabattpreis**.

## 3. RevenueCat Dashboard

1. Neues Projekt → Apps für **iOS** und **Android** hinzufügen.
2. Unter **Products** die Store-Produkte importieren.
3. **Entitlement** `premium` anlegen und Produkten zuweisen.
4. **Offering** `default` mit Packages:
   - `$rc_monthly` → Monatsabo
   - `$rc_annual` → Jahresabo (ein Package reicht — Promo läuft über Play Offer)
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
# Base plan ID des Geschenk-Jahresabos in Play Console
VITE_REVENUECAT_YEARLY_PROMO_BASE_PLAN_ID=paywall-gift
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

| Paywall-Aktion | Kauf |
|----------------|------|
| Normales Jahresabo | `$rc_annual` / Standard-Base-Plan |
| Geschenk → „Jetzt holen“ | Google Play **Base Plan** `paywall-gift` |

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
2. Base Plan `paywall-gift` in Play Console anlegen und veröffentlichen.
3. `npm run build` → `npx cap sync` → auf echtem Gerät starten.
4. Sandbox-Apple-ID (iOS) bzw. License Tester (Android) verwenden.
5. Paywall → X → Geschenk öffnen → „Jetzt holen“ — Play-Dialog muss **Rabattpreis** zeigen.
6. Nach Kauf: Profil → Abo aktualisieren oder App neu starten; Premium sollte aktiv sein.
