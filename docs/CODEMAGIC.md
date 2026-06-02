# Codemagic — iOS Build (Frigy)

Der **Android-Workflow wurde entfernt**. In Codemagic startest du nur noch:

| Workflow | Zweck |
|----------|--------|
| **iOS Build** | App Store / TestFlight (`.ipa`) |
| **iOS Build (Ad Hoc)** | Direkt auf registrierte Test-iPhones (optional) |

---

## 1. Repository verbinden

1. [codemagic.io](https://codemagic.io) → Add application → GitHub → `frigyai`
2. Branch: `main` (oder dein Release-Branch)
3. Codemagic liest `codemagic.yaml` aus dem Repo-Root

---

## 2. Apple Code Signing (Pflicht)

Ohne Signing schlägt der iOS-Build fehl.

### Variante A — Codemagic UI (einfach)

1. **Team settings → Code signing identities**
2. **iOS certificates**: Apple Distribution Certificate hochladen (`.p12` + Passwort)
3. **iOS provisioning profiles**: App Store Profil für `com.frigyapp.app`
4. Referenzname wird von `ios_signing` in `codemagic.yaml` genutzt

### Variante B — App Store Connect API (TestFlight automatisch)

1. **Team settings → Integrations → App Store Connect**
2. API Key (.p8), Key ID, Issuer ID eintragen
3. Optional in `codemagic.yaml` unter `publishing → app_store_connect` aktivieren

---

## 3. Environment Variables (Pflicht für die App)

**Codemagic → Application → Environment variables**

| Variable | Beispiel / Hinweis |
|----------|-------------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key |
| `VITE_REVENUECAT_API_KEY_IOS` | `appl_…` aus RevenueCat |
| `VITE_REVENUECAT_ENTITLEMENT_ID` | `premium` |
| `VITE_APPLE_BUNDLE_ID` | `com.frigyapp.app` |
| `VITE_APPLE_CLIENT_ID` | `com.frigyapp.app` |
| `VITE_APPLE_REDIRECT_URI` | `https://app.frigy.app/auth/callback` |
| `VITE_PRIVACY_POLICY_URL` | `https://app.frigy.app/legal/datenschutz` |
| `VITE_CHOTTULINK_API_KEY` | optional |
| `VITE_APP_WEB_HOST` | `app.frigy.app` |

Diese Werte werden beim Schritt **`npm run build`** in die Web-Assets eingebaut.

Markiere Secrets als **Secure** in Codemagic.

---

## 4. Build starten

1. **Start new build**
2. Workflow: **iOS Build**
3. Warten (~15–25 Min. auf Mac-Runner)
4. **Artifacts** → `.ipa` herunterladen

### TestFlight

- IPA manuell in [App Store Connect](https://appstoreconnect.apple.com) → Transporter hochladen  
- **oder** Codemagic `app_store_connect` Publishing aktivieren (siehe Codemagic-Doku)

### Ad Hoc (Testgerät ohne TestFlight)

1. Geräte-UDIDs im Apple Developer Portal im Ad-Hoc-Profil
2. Workflow **iOS Build (Ad Hoc)** starten
3. IPA per Apple Configurator / Diawi / TestFlight-Alternative installieren

---

## 5. Was der Workflow macht

```
npm ci
npm run build          ← Vite + env vars
npx cap sync ios       ← dist/ → ios/App/App/public
xcode-project use-profiles
agvtool (Build-Nummer)
xcode-project build-ipa
```

Xcode-Projekt: `ios/App/App.xcodeproj`  
Scheme: **App**  
Bundle ID: **com.frigyapp.app**

---

## 6. Release vor App Store

In `ios/App/App/App.entitlements`:

- `aps-environment`: für **Production** von `development` auf **`production`** ändern (Push)

In Xcode (lokal auf dem Mac) einmal prüfen:

- Sign in with Apple
- Push Notifications
- In-App Purchase

Dann committen und in Codemagic neu bauen.

---

## 7. Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| No signing certificate | Code signing in Codemagic Team settings |
| Provisioning profile doesn't match | Bundle ID `com.frigyapp.app` überall gleich |
| `cap sync ios` failed | `npm run build` lokal fixen; Node 20 |
| Leere App / kein Login | `VITE_SUPABASE_*` in Codemagic setzen |
| RevenueCat / IAP fehlt | `VITE_REVENUECAT_API_KEY_IOS` setzen |
| Scheme not found | Scheme **App** muss in Xcode „Shared“ sein |

---

## 8. Lokal testen (Mac)

```bash
npm ci --legacy-peer-deps
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode: Product → Run auf Simulator oder Gerät.

---

## Android

Android-Builds laufen **nicht mehr** über Codemagic. Play Store später separat (neuer Workflow oder lokal Gradle).
