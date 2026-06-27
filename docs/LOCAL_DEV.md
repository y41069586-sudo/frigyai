# Frigy lokal starten (localhost Preview)

## App im Browser sehen

1. Im Projektordner:

```bash
npm install
npm run dev
```

2. Im Terminal steht z. B.:

```
➜  Local:   http://localhost:5173/
```

3. Diese URL im **Chrome oder Edge** öffnen (nicht nur die eingebettete Cursor-Vorschau, falls die leer bleibt).

## Wenn der Bildschirm schwarz/leer ist

- **Dev-Server läuft?** Terminal muss `VITE … ready` zeigen.
- **Richtiger Port:** `npm run dev` nutzt **4137** (`http://localhost:4137`).
- **Hard Reload:** `Strg + Shift + R` auf `http://localhost:5173`
- **`.env`:** Datei `.env` mit `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` (siehe `.env.example`).

## Production-Build testen

```bash
npm run build
npm run preview
```

Dann: **http://localhost:4173**

## Cursor

- Ports-Panel: Port **5173** weiterleiten / „Open in Browser“
- Eingebettete Simple-Browser-Vorschau kann leer bleiben → externer Browser nutzen
