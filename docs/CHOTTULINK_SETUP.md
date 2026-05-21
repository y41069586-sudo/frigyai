# ChottuLink + Frigy Deep Linking

Frigy ist eine **Capacitor + React** App (kein React Native/Flutter). Deep Links funktionieren über `@capacitor/app` + Universal Links / App Links.

## ChottuLink Dashboard — Destination URL

Beim Anlegen eines Dynamic Links in ChottuLink:

| Feld | Wert |
|------|------|
| **Destination URL (Deep Link)** | `frigy://signup?ref={ref}` |
| **Fallback (Web)** | `https://app.frigy.app/signup?ref={ref}` |

Ersetze `app.frigy.app` durch deine echte Domain (`VITE_APP_WEB_HOST`).

### Beispiel-Link (Influencer)

```
frigy://signup?ref=PROMO1
```

HTTPS-Variante (Universal Link):

```
https://app.frigy.app/signup?ref=PROMO1
```

ChottuLink Short-Link (nach Projekt-Setup):

```
https://DEIN-PROJEKT.chottu.link/xxxx
```

→ leitet auf die Destination URL oben.

## Umgebungsvariablen (.env)

```env
VITE_CHOTTULINK_HOST=dein-projekt.chottu.link
VITE_APP_WEB_HOST=app.frigy.app
VITE_IOS_TEAM_ID=ABCDE12345
```

Nach Änderung: `npm run build` → `npx cap sync`.

## iOS — Universal Links

1. **Associated Domains** (bereits in `ios/App/App/App.entitlements`):
   - `applinks:dein-projekt.chottu.link`
   - `applinks:app.frigy.app`

2. **AASA-Datei** auf **jeder** Domain, die Links öffnen soll:
   - `https://app.frigy.app/.well-known/apple-app-site-association`
   - ChottuLink hostet die AASA oft selbst auf `*.chottu.link` — im ChottuLink-Dashboard prüfen.

3. In `public/.well-known/apple-app-site-association`:
   - `TEAMID` durch deine Apple Team ID ersetzen (Xcode → Signing).

4. Xcode: Target **App** → Signing & Capabilities → **Associated Domains** muss sichtbar sein.

5. `npx cap sync` → App neu bauen.

## Android — App Links

1. `AndroidManifest.xml`: `android:autoVerify="true"` für HTTPS-Hosts.

2. **assetlinks.json** deployen:
   - `https://app.frigy.app/.well-known/assetlinks.json`
   - SHA-256 Fingerprints eintragen (Release + Debug):

```bash
cd android
./gradlew signingReport
```

3. Manifest-Hosts (`frigy.chottu.link`, `app.frigy.app`) an deine echten Domains anpassen.

## Referral `?ref=`

| Quelle | Verhalten |
|--------|-----------|
| `frigy://signup?ref=CODE` | Ref wird gespeichert → Onboarding Referral-Schritt |
| `https://…/signup?ref=CODE` | Gleich (Universal / App Link) |
| `/?ref=CODE` (Web) | Ref wird beim Laden gespeichert |
| **6 Zeichen** | Zusätzlich `frigy_referral_code` → Auto-Redeem nach Login |
| **3–5 Zeichen** (z. B. `proml`) | Nur Attribution gespeichert; Einlösung braucht **6-stelligen** DB-Code |

Empfehlung: Influencer-Codes in der Admin-Oberfläche als **6 Zeichen** anlegen (z. B. `PROMO1` → `PR0M01`).

## Deferred Deep Linking

| Szenario | Frigy-Verhalten |
|----------|-----------------|
| App **bereits installiert** | ChottuLink → `appUrlOpen` / `getLaunchUrl` → Ref gespeichert |
| **Web-Klick**, später **PWA gleiche Origin** | `frigy_deferred_ref` in localStorage |
| **Store-Install** ohne vorherige Web-Session | ChottuLink **Deferred** über deren SDK / Server — optional [ChottuLink Capacitor-Docs](https://docs.chottulink.com/get-started/capacitor-setup/) |

Beim **ersten nativen App-Start** wird `frigy_deferred_ref` automatisch übernommen.

## React Native / Flutter (Referenz)

Frigy nutzt **Capacitor**. Entsprechung:

| RN / Flutter | Frigy (Capacitor) |
|--------------|-------------------|
| `Linking.getInitialURL()` | `App.getLaunchUrl()` |
| `Linking.addEventListener('url')` | `App.addListener('appUrlOpen')` |
| `AsyncStorage.setItem('ref')` | `localStorage` + `referralAttribution.ts` |

RN-Beispiel (nur Referenz):

```javascript
import { Linking } from 'react-native';
Linking.getInitialURL().then((url) => {
  if (url?.includes('ref=')) { /* save ref */ }
});
Linking.addEventListener('url', ({ url }) => { /* save ref */ });
```

Flutter (Referenz):

```dart
import 'package:uni_links/uni_links.dart';
final initial = await getInitialUri();
```

## Stripe (weiterhin)

```
frigy://callback?subscription=success
```

## Test

1. Link im Browser: `https://app.frigy.app/signup?ref=TEST01`
2. Gerät: `adb shell am start -a android.intent.action.VIEW -d "frigy://signup?ref=TEST01"`
3. iOS Simulator: `xcrun simctl openurl booted "frigy://signup?ref=TEST01"`
4. ChottuLink Deep Link Tester im Dashboard

## Code-Übersicht

- `src/lib/chottuLinkConfig.ts` — Domains, Destination-URL-Vorlagen
- `src/lib/appDeepLink.ts` — URL → Route
- `src/lib/referralAttribution.ts` — Ref speichern / deferred
- `src/components/AppDeepLinkListener.tsx` — Native
- `src/components/ReferralAttributionBootstrap.tsx` — Web
- `src/pages/SignupDeepLinkPage.tsx` — `/signup`, `/invite`
