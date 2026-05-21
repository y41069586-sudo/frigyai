# Codemagic Android Build

## Standard (ohne EXPO_TOKEN)

Der Workflow baut die APK **direkt mit Gradle** — du musst **keinen** Expo-Token setzen.

1. Repository in Codemagic verbinden (GitHub `main`).
2. Workflow **Android Build** starten.
3. APK unter **Artifacts** → **`Frigy.apk`** (nur diese eine Datei)

### Aufs Handy installieren

- **Nicht** „Quick Launch“ — das ist nur eine Emulator-Vorschau.
- `Frigy.apk` am **PC** aus Codemagic → Artifacts herunterladen.
- Per USB, Drive, WhatsApp oder Mail aufs Handy → Datei öffnen → installieren.
- Bei Android: „Unbekannte Apps installieren“ für Dateien/Chrome erlauben.

### „Paket steht in Konflikt mit bestehendem Paket“

Deine **alte APK** (`application-….apk` von **EAS/Expo**) hat eine **andere Signatur** als der neue **Frigy.apk** von Codemagic — Android erlaubt kein Überschreiben.

**Einmalig:**

1. **Frigy / Fridgie deinstallieren** (Einstellungen → Apps)
2. **Frigy.apk** neu installieren

**Für künftige Updates ohne Deinstall:** In Codemagic denselben **Keystore wie bei EAS** hinterlegen (Code signing → `frigy_release`) und in `codemagic.yaml` `android_signing` aktivieren. Keystore von Expo: `eas credentials` → Android → Download keystore.

Optional in Codemagic **Environment variables** (für Supabase in der App):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Optional: EAS-Build

Nur wenn du zusätzlich EAS nutzen willst:

- `EXPO_TOKEN` als Secure Variable in Codemagic setzen ([expo.dev](https://expo.dev) → Access Tokens)
- Dann läuft nach dem Gradle-Build noch `eas build …`

## Lokal testen (wie Codemagic)

```bash
npm ci --legacy-peer-deps
npm run build
node scripts/prepare-android-web-assets.mjs
cd android && ./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| Gradle failed | Log in Codemagic öffnen; lokal `./gradlew assembleDebug` in `android/` |
| Web-Build failed | `npm run build` lokal fixen |
| Leere App / kein Supabase | `VITE_*` in Codemagic setzen und neu bauen |
