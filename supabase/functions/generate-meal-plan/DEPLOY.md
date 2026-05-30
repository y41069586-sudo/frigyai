# generate-meal-plan deploy (Supabase Dashboard)

The Dashboard only accepts **one file**: paste/deploy `index.ts` only.

## After editing modules (`auth.ts`, `macros.ts`, …)

```bash
cd supabase/functions/generate-meal-plan
deno run --allow-read --allow-write scripts/inline-index.ts
```

Then copy **`index.ts`** into the Supabase Dashboard editor and deploy.

## Source layout

| File | Role |
|------|------|
| `index.ts` | **Deployed** — generated monolith |
| `index.handler.ts` | HTTP handler (merged by script) |
| `auth.ts`, `macros.ts`, … | Edit these, then regenerate |
| `scripts/inline-index.ts` | Build script |
