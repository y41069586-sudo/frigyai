# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Frigy is a German-language health & nutrition PWA (Progressive Web App) built with React 18, TypeScript, Vite 5, shadcn/ui, and Tailwind CSS. The backend is a hosted Supabase instance (no local DB setup needed). The `.env` file contains only public Supabase keys (anon key and URL).

### Development commands

| Task | Command | Notes |
|------|---------|-------|
| Install deps | `npm install` | Uses `package-lock.json` |
| Dev server | `npm run dev` | Vite on port 4137 (host `::`) |
| Lint | `npm run lint` | ESLint; pre-existing warnings/errors in codebase |
| Build | `npm run build` | Vite production build to `dist/` |
| Preview | `npm run preview` | Serves build on port 5180 |

### Key notes

- The dev server listens on **port 4137** (not the Vite default 5173).
- Lint exits non-zero due to pre-existing `@typescript-eslint/no-explicit-any` errors throughout the codebase — this is expected and not a sign of broken setup.
- The Supabase backend is **cloud-hosted** (`mcabsjuamjgkvfljkfit.supabase.co`). No local Supabase CLI, Docker, or database is required for frontend development.
- AI features (food scanning, recipe generation, chatbot) require `OPENAI_API_KEY` configured as a Supabase Edge Function secret on the cloud instance. Without it, the basic UI, auth, and tracking features still work.
- Stripe integration is optional — only needed for premium subscription flows.
- Capacitor (native mobile) is optional — the web PWA runs independently.
- The project has both `package-lock.json` (npm) and `bun.lockb` (bun); use **npm** as the primary package manager.
