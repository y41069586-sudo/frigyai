# Codemagic — iOS Build (Frigy)

| Workflow | Zweck |
|----------|--------|
| **Android Build** | Play Store (`.aab`) + Test-APK (`.apk`) |
| **iOS Build** | App Store / TestFlight (`.ipa`) |
| **iOS Build (Ad Hoc)** | Direkt auf registrierte Test-iPhones (optional) |

---

## 1. Repository verbinden

1. [codemagic.io](https://codemagic.io) → Add application → GitHub → `frigyai`
2. Branch: `main` (oder dein Release-Branch)
3. Codemagic liest `codemagic.yaml` aus dem Repo-Root

---

## 2. Apple Code Signing (Pflicht)

Ohne Signing schlägt der iOS-Build fehl. Codemagic holt Zertifikat + Profil über die **App Store Connect API**.

### Environment variables (Group `frigy` oder ohne Group)

Im Build-Log siehst du nur `VITE_APPLE_*` aus `codemagic.yaml`, aber **keine** `VITE_SUPABASE_*` / `APP_STORE_CONNECT_*`?
→ Deine Variablen stecken in einer **Group**, die nicht in `codemagic.yaml` steht.

**Fix 1 — Group verknüpfen (wenn Variablen schon in einer Group sind):**

1. Codemagic → **frigyai** → **Environment variables** → Spalte **Group** muss **`frigy`** sein
2. Alle 6 Pflicht-Variablen müssen in **dieser** Group liegen
3. Neu bauen (Repo hat `groups: - frigy`)

**Fix 2 — ohne Group:**

**Codemagic → frigyai → Settings → Environment variables → Add variable**

Beim Anlegen: **Group-Feld leer lassen** (Application variables). Dann `groups:` in `codemagic.yaml` entfernen.

| Variable name | Value | Secret? |
|---------------|-------|---------|
| `APP_STORE_CONNECT_PRIVATE_KEY` | komplette `.p8`-Datei | **ja** |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | `P5FA563XP2` (aus Dateiname `AuthKey_P5FA563XP2.p8`) | nein |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID (UUID) von App Store Connect | nein |

| Fehler | Bedeutung |
|--------|-----------|
| `Verify build environment` exit 1 | Eine oder mehrere Variablen fehlen (siehe `codemagic.env.example`) |
| `private_key looks too short` | `.p8` nicht vollständig eingefügt |

Issuer ID: [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API** → oben **Issuer ID**.

### Code Signing in Codemagic (Pflicht vor dem ersten erfolgreichen IPA-Build)

Der Fehler **`Cannot save Signing Certificates without certificate private key`** kommt von `fetch-signing-files --create` ohne **`CERTIFICATE_PRIVATE_KEY`**. Der Workflow nutzt stattdessen **`ios_signing`** (Zertifikat + Profil aus der Codemagic-UI).

**Einmalig in Codemagic (Team settings → Code signing identities):**

1. **iOS certificates** → Reference **`frigy_distribution`** (`.p12` hochgeladen)
2. **Apple Developer** → Identifiers → `com.frigyapp.app` → **Associated Domains**, Push, Sign in with Apple → **Save**
3. **Apple Developer** → **Profiles** → alle alten Profile für `com.frigyapp.app` **löschen** (inkl. „Doaa Attia“)
4. **Neues Profil** anlegen: **App Store** / Distribution → App `com.frigyapp.app` → Zertifikat **`frigy_distribution`** wählen
5. **Codemagic** → Profil **`Frigy` löschen** → **Fetch profiles** → App Store → `com.frigyapp.app` → Reference **`Frigy`** → Download (grüner Haken am Zertifikat)

**Wichtig:** Reference name `Frigy` ≠ neues Profil. Wenn der Build noch „Doaa Attia“ zeigt, ist die **Datei** alt — Schritte 3–5 wiederholen.

`codemagic.yaml`: Profil **`Frigy`**, Zertifikat **`frigy_distribution`**.

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

| Variable | Pflicht? | Hinweis |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | **ja** | Application variable, kein Secret nötig für Vite |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **ja** | wie oben |
| `VITE_REVENUECAT_API_KEY_IOS` | empfohlen | `appl_…` aus RevenueCat |
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

### Android (AAB)

1. Workflow **Android Build** starten
2. **Artifacts** → `app-release.aab` herunterladen → [Google Play Console](https://play.google.com/console)
3. **Signing:** In Codemagic Team → Code signing → Android Keystore (`CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`) — sonst Debug-Signatur (nur intern testen)

Optional: `VITE_REVENUECAT_API_KEY_ANDROID=goog_…` in Group `frigy`.

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
| `Cannot save Signing Certificates without certificate private key` | Distribution-Zertifikat in Team → Code signing identities **generieren + .p12 hochladen** (siehe oben); nicht nur API-`.p8` |
| `Verify build environment` exit 1 | Mindestens `VITE_SUPABASE_*` in Group **`frigy`**; `APP_STORE_CONNECT_*` nur nötig bei Auto-Signing |
| Nur ZIP / `app.log`, keine `.ipa` | Build **rot** — fehlgeschlagener Schritt im Log (Signing, SPM, Archive). Grün + `.ipa` nur wenn **Verify IPA artifact** durchläuft |
| `private_key looks too short` | Komplette `.p8` in `APP_STORE_CONNECT_PRIVATE_KEY` |
| No signing certificate | Zertifikat + App-Store-Profil in Code signing identities; App in ASC mit `com.frigyapp.app` |
| Archive failed (exit 65) | App-Store-Profil muss **Push**, **Sign in with Apple**, **Associated Domains** haben; `App.entitlements` → `aps-environment: production`; Profil nach Capability-Änderung neu **Fetch** |
| `doesn't include the Associated Domains capability` | App ID: Associated Domains an → Profil **„Doaa Attia“ löschen** → neu fetchen als Reference **`frigy_appstore`** (siehe oben) |
| Provisioning profile doesn't match | Bundle ID `com.frigyapp.app` überall gleich |
| `cap sync ios` failed / Node >=22 | `codemagic.yaml` nutzt Node 22; lokal ebenfalls Node 22 LTS |
| `Failed to show build settings` / exit 74 | SPM-Pfade in `Package.swift` (keine `\`); Schritt „Resolve Swift packages“ im Log prüfen |
| `chottulink-ios-sdk` incompatible tools version 6.1 | `codemagic.yaml` nutzt `xcode: 26.4`; `CapApp-SPM/Package.swift` → `swift-tools-version: 6.1` |
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

Workflow **Android Build** in `codemagic.yaml`: Vite → `cap sync android` → Gradle `bundleRelease` + `assembleRelease`.

- **Artifacts:** `app-release.aab` (Play Store), `app-release.apk` (direkt installieren / intern testen)
- **Signing:** Codemagic Team → Code signing → Android Keystore — sonst Debug-Signatur (APK nur zum Testen)
