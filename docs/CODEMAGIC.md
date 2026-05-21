# Codemagic Android Build

## Standard (ohne EXPO_TOKEN)

Der Workflow baut die APK **direkt mit Gradle** — du musst **keinen** Expo-Token setzen.

1. Repository in Codemagic verbinden (GitHub `main`).
2. Workflow **Android Build** starten.
3. APK unter **Artifacts** → `build/frigy-preview.apk`

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
