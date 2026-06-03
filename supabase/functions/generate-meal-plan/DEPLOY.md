# generate-meal-plan deploy (Supabase Dashboard)

**Mit `OPENAI_API_KEY`:** Der Wochenplan kommt von OpenAI (auch bei „Neu generieren“). Die festen Listen in `dietPools.ts` / `fallbacks.ts` sind nur **Notfall ohne API-Key** oder wenn die KI nach allen Versuchen scheitert.

The Dashboard only accepts **one file**: paste/deploy `index.ts` only.

## After editing modules (`auth.ts`, `macros.ts`, …)

```bash
cd supabase/functions/generate-meal-plan
deno run --allow-read --allow-write scripts/inline-index.ts
```

Then copy **`index.ts`** into the Supabase Dashboard editor and deploy.

Nach Änderungen an Modulen immer `inline-index` ausführen und neu deployen — sonst läuft auf Supabase noch alter Code.

## Source layout

| File | Role |
|------|------|
| `index.ts` | **Deployed** — generated monolith |
| `index.handler.ts` | HTTP handler (merged by script) |
| `auth.ts`, `macros.ts`, … | Edit these, then regenerate |
| `scripts/inline-index.ts` | Build script |
