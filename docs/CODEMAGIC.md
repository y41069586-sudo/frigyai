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

Ohne Signing schlägt der iOS-Build fehl. **Du brauchst kein Mac** — Codemagic erzeugt das Zertifikat über die **App Store Connect API**.

### App settings — Variable Group `appstore_credentials` (Pflicht)

Der Workflow lädt die Apple-API-Keys **nur** aus der Group **`appstore_credentials`**.

| Fehler | Bedeutung |
|--------|-----------|
| `unknown variable group(s): appstore_credentials` | Group in Codemagic **noch nicht angelegt** (Name exakt so) |
| `Verify build environment` exit 1 | Apple-Keys und/oder Supabase-Variablen fehlen (siehe `codemagic.env.example`) |

**Codemagic → App frigyai → Settings → Environment variables:**

1. **Add variable** → Name: `APP_STORE_CONNECT_PRIVATE_KEY`
2. Value: komplette `.p8`-Datei (mit `-----BEGIN PRIVATE KEY-----` … `-----END PRIVATE KEY-----`)
3. **Secret** aktivieren
4. **Group name:** `appstore_credentials` → **Create group** (beim ersten Mal)
5. Speichern, dann **zwei weitere Variablen** in **derselben** Group:

| Variable name | Value | Secret? |
|---------------|-------|---------|
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | `BFQ5G69F89` | nein |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID (UUID) von App Store Connect | nein |
| `APP_STORE_CONNECT_PRIVATE_KEY` | `.p8` Inhalt | **ja** |

**`.p8` einfügen (Windows):**

1. `AuthKey_BFQ5G69F89.p8` mit **Notepad** öffnen  
2. Alles markieren und kopieren — inkl. Zeilen:
   ```
   -----BEGIN PRIVATE KEY-----
   ...
   -----END PRIVATE KEY-----
   ```
3. In Codemagic bei **Value** einfügen (kein Base64, kein JSON)

Issuer ID: [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API** → oben **Issuer ID**.

Die Group muss **`appstore_credentials`** heißen (wie in `codemagic.yaml`). Beim Build werden Zertifikat + Profil automatisch geholt.

**Generate certificate** in der UI brauchst du dann **nicht** — der Build-Schritt `Fetch code signing files` reicht.

### Schritt 1 — App Store Connect API Key (Referenz)

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**
2. **+** → Name z. B. `codemagic` → Rolle **App Manager**
3. **Generate** → Datei **`.p8` herunterladen** (nur einmal!)
4. **Issuer ID** (oben auf der Seite) und **Key ID** notieren

### Schritt 2 — Key in Codemagic

1. Codemagic → **Team settings** (Zahnrad, nicht App-Einstellungen)
2. **Team integrations** → **Developer Portal** / **App Store Connect**
3. **Add key** → Issuer ID, Key ID, `.p8` hochladen
4. **Reference name** merken — z. B. `codemagic`

### Schritt 3 — `codemagic.yaml` anpassen

In `codemagic.yaml` muss der Name passen:

```yaml
integrations:
  app_store_connect: codemagic   # ← genau dein Reference name
```

Beim Build holt Codemagic automatisch:

- **Apple Distribution** Zertifikat (`--create`)
- **App Store** Provisioning Profile für `com.frigyapp.app`

(Dafür sind die Script-Schritte `Fetch code signing files` / `keychain add-certificates` im Workflow.)

### Optional — Zertifikat manuell in der UI erzeugen

Falls du es trotzdem in der UI machen willst:

1. **Team settings → Code signing identities → iOS certificates**
2. **Generate certificate** → Typ **Apple Distribution** → API Key wählen
3. **Wichtig:** `.p12` sofort **downloaden** und unter **Upload certificate** wieder **hochladen** (Codemagic braucht die Datei im Account)
4. **iOS provisioning profiles → Fetch profiles** → **App Store** → `com.frigyapp.app`

### App Store Connect App

Unter [App Store Connect → Apps](https://appstoreconnect.apple.com) muss eine App mit Bundle ID **`com.frigyapp.app`** existieren (sonst kein App-Store-Profil).

---

## 3. Environment Variables (Pflicht für die App)

Vollständige Liste: **`codemagic.env.example`** im Repo-Root.

**Codemagic → frigyai → Environment variables**

| Variable | Pflicht? | Wo? |
|----------|----------|-----|
| `VITE_SUPABASE_URL` | **ja** | Application (ohne Group) **oder** Group `appstore_credentials` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **ja** | wie oben |
| `VITE_REVENUECAT_API_KEY_IOS` | empfohlen | wie oben |
| `VITE_REVENUECAT_ENTITLEMENT_ID` | nein (Default `premium` in yaml) | optional |
| `VITE_APPLE_*`, `VITE_PRIVACY_POLICY_URL` | nein (Defaults in yaml) | optional |

Der Schritt **`Verify build environment`** (`scripts/codemagic-verify-env.sh`) bricht ab, wenn Supabase-Variablen fehlen.

Diese Werte werden bei **`npm run build`** in die Web-Assets eingebaut. Supabase-Keys **nicht** als Secret markieren (Vite braucht sie beim Build).

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
| `unknown variable group appstore_credentials` | Group in Codemagic anlegen (Abschnitt 2) |
| `Verify build environment` exit 1 | Alle Variablen aus `codemagic.env.example` setzen |
| `private_key looks too short` | Komplette `.p8` in `APP_STORE_CONNECT_PRIVATE_KEY` |
| No signing certificate | API-Key + App in ASC mit `com.frigyapp.app` |
| Provisioning profile doesn't match | Bundle ID `com.frigyapp.app` überall gleich |
| `cap sync ios` failed | `npm run build` lokal fixen; Node 20 |
| Leere App / kein Login | `VITE_SUPABASE_*` in Codemagic setzen |
| RevenueCat / IAP fehlt | `VITE_REVENUECAT_API_KEY_IOS` setzen |
| Scheme not found | Scheme **App** unter `ios/App/App.xcodeproj` |

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
