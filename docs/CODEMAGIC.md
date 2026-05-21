# Codemagic + EAS Android Build

## Codemagic einrichten

1. Repository verbinden (GitHub).
2. Unter **Environment variables** anlegen:
   - `EXPO_TOKEN` — von [expo.dev](https://expo.dev) → Account → Access tokens (als **Secure** markieren).
3. Optional für die App im gebauten APK (Expo **Project secrets** auf expo.dev):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_CHOTTULINK_HOST`, `VITE_APP_WEB_HOST` (falls genutzt)

## Lokal testen (wie Codemagic)

```bash
npm ci --legacy-peer-deps
npm run build
npx eas build --platform android --profile preview --non-interactive
```

## Workflow

`codemagic.yaml` führt aus:

1. `npm ci --legacy-peer-deps`
2. `npm run build` — bricht bei TypeScript/Vite-Fehlern sofort ab
3. `eas build` (Profil `preview` → APK)
4. APK/AAB nach `build/` laden

## Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| `EXPO_TOKEN is not set` | Secret in Codemagic setzen |
| EAS `Gradle failed` | Logs auf expo.dev öffnen; lokal `npm run build` + `npx cap sync android` |
| `No EAS Android artifact URL` | EAS-Build nicht `FINISHED` — JSON in Logs prüfen |
| Web-Build leer / Supabase | EAS Secrets für `VITE_*` setzen |
