# generate-meal-plan deploy

Die Function liegt in vielen kleinen `.ts`-Dateien. **Du musst kein Node ausführen**, wenn du aus dem Repo kopierst.

## Option A — Supabase Dashboard (nur Copy & Paste)

1. Öffne im Repo: **`supabase/functions/generate-meal-plan/dashboard-bundle.ts`**
2. Alles markieren (Strg+A) und kopieren
3. Supabase Dashboard → **Edge Functions** → `generate-meal-plan` → Code einfügen → **Deploy**

Das ist **eine einzige Datei** — kein `node`, kein `index.handler.ts`, keine Module.

Nach dem Deploy: OPTIONS auf die Function sollte **200** mit `ok` zurückgeben (nicht 503).

## Option B — Supabase CLI (ein Befehl, alle Module)

Im Projektroot (einmal `supabase login`):

```bash
npm run supabase:deploy:meal-plan
```

Dabei wird `index.ts` + alle Module hochgeladen — kein Bundle nötig.

## Für Entwickler (nach Änderungen an auth.ts, openai.ts, …)

```bash
npm run meal-plan:bundle
```

Aktualisiert `dashboard-bundle.ts` für Option A. Dann committen, damit du im Dashboard immer die aktuelle Version kopieren kannst.

## Secrets auf Supabase (Edge Function)

| Secret | Pflicht |
|--------|---------|
| `OPENAI_API_KEY` | Ja (sonst Template-Plan) |
| `SUPABASE_SERVICE_ROLE_KEY` | Automatisch |
| `OPENAI_MEAL_PLAN_MODEL` | Optional (Standard: `gpt-4o-mini`) |
