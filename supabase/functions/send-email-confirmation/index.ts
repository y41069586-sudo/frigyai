import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ─── Frigy-branded HTML email ────────────────────────────────────────────────

function buildEmailHTML(confirmationLink: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <!-- Locks the email to its designed light look. Without these, some clients
       (Apple Mail dark mode especially) auto-recolor text — that's what was
       turning the button's dark-green text near-white/washed-out on the mint
       gradient, since the client ignored the explicit color and "smart"
       re-themed it for dark mode. -->
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Bestätige deine E-Mail – Frigy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#F0FBF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;-webkit-text-size-adjust:100%}
    .wrap{max-width:520px;margin:48px auto 64px;padding:0 16px}
    .card{background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 4px 40px rgba(0,120,70,.08)}
    /* header */
    .hdr{background:linear-gradient(135deg,#75FBB2 0%,#2EB56D 100%);padding:44px 40px 36px;text-align:center}
    .logo{font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1}
    .logo span{opacity:.75;font-size:20px;font-weight:600;display:block;margin-top:4px;letter-spacing:0}
    /* body */
    .bdy{padding:40px 40px 36px}
    .title{font-size:23px;font-weight:800;color:#1F2937;letter-spacing:-.5px;margin-bottom:12px}
    .txt{font-size:15px;color:#6B7280;line-height:1.65;margin-bottom:32px}
    /* CTA button — background-color fallback for clients that drop gradients,
       plus a solid darker green (not the lighter mint stop) so white text
       stays legible even if a client washes out the gradient itself. */
    .cta{display:block;background-color:#2EB56D;background-image:linear-gradient(135deg,#57E39A,#1F9C5C);border-radius:16px;padding:17px 28px;text-align:center;text-decoration:none;font-size:17px;font-weight:800;letter-spacing:-.3px;margin-bottom:20px}
    .cta:hover{opacity:.92}
    /* Bulletproof text color: an explicit inline-styled span nested inside the
       button (see markup below) survives clients that override an <a> tag's
       own color but respect a plain <span>'s inline style. Pure white, plus a
       soft dark text-shadow so it still pops on the lighter mint gradient stop
       instead of reading as washed-out gray. */
    .cta-label{color:#FFFFFF !important}
    /* hint */
    .hint{font-size:12.5px;color:#9CA3AF;line-height:1.55;text-align:center;padding:0 8px}
    .hint a{color:#2EB56D;text-decoration:none}
    /* divider */
    .div{height:1px;background:#F0F4F2;margin:32px 0}
    /* link fallback */
    .fallback{font-size:12px;color:#9CA3AF;word-break:break-all;text-align:center}
    /* footer */
    .ftr{padding:24px 40px 32px;text-align:center}
    .ftr p{font-size:11.5px;color:#B0B9B4;line-height:1.6}
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="hdr">
      <div class="logo">🥗 Frigy<span>Dein KI-Ernährungsplan</span></div>
    </div>
    <div class="bdy">
      <p class="title">Bestätige deine E-Mail-Adresse</p>
      <p class="txt">
        Fast geschafft! Tippe einmal auf den Button – danach wirst du direkt zur App
        weitergeleitet und kannst sofort mit deinem personalisierten Ernährungsplan starten.
      </p>
      <a href="${confirmationLink}" class="cta" style="background-color:#2EB56D;background-image:linear-gradient(135deg,#57E39A,#1F9C5C);color:#FFFFFF;">
        <span class="cta-label" style="color:#FFFFFF !important;font-weight:800;text-shadow:0 1px 2px rgba(0,60,30,.35);">✅ &nbsp;Jetzt bestätigen &amp; App öffnen</span>
      </a>
      <p class="hint">
        Der Link ist 24 Stunden gültig. Falls du dich nicht bei Frigy registriert hast,
        kannst du diese E-Mail einfach ignorieren.
      </p>
      <div class="div"></div>
      <p class="fallback">Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
        <a href="${confirmationLink}" style="color:#2EB56D">${confirmationLink}</a>
      </p>
    </div>
    <div class="ftr">
      <p>Du erhältst diese E-Mail, weil du dich bei Frigy registriert hast.<br>
      © ${new Date().getFullYear()} Frigy · Alle Rechte vorbehalten</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── CORS ────────────────────────────────────────────────────────────────────

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[send-email-confirmation] Missing Supabase secrets: URL=", !!supabaseUrl, "KEY=", !!supabaseServiceKey);
    return json({ success: false, error: "Missing Supabase configuration" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, error: "Ungültige E-Mail-Adresse" }, 400);
    }

    // Generate a confirmation link WITHOUT triggering Supabase's own plain email.
    // We create the user here (type "signup" with the password) so iOS no longer
    // calls client.auth.signUp first — that double-created the user and made the
    // signup link fail. If the user already exists (e.g. a resend tap), fall back
    // to a magic link, which works for existing unconfirmed accounts and also
    // confirms the email when tapped.
    //
    // redirectTo uses the Universal Link (https://app.frigy.app/auth), NOT the
    // frigy:// custom scheme. A custom scheme reached via a browser redirect
    // always forces iOS to show an "Open in Frigy?" confirmation prompt — a
    // Universal Link (once the associated-domain / apple-app-site-association
    // setup is correct) is intercepted by iOS silently, so the tap goes
    // straight from Mail into the app with no browser step at all.
    async function makeLink() {
      if (password) {
        const r = await supabase.auth.admin.generateLink({
          type: "signup",
          email,
          password,
          options: { redirectTo: "https://app.frigy.app/auth" },
        });
        if (!r.error && r.data?.properties?.action_link) return r;
        console.warn("[send-email-confirmation] signup link failed, trying magiclink:", r.error?.message);
      }
      return await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: "https://app.frigy.app/auth" },
      });
    }

    const { data: linkData, error: linkError } = await makeLink();

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[send-email-confirmation] generateLink:", linkError?.message);
      return json({ success: false, error: linkError?.message ?? "Link konnte nicht erstellt werden" }, 500);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("[send-email-confirmation] RESEND_API_KEY not set");
      return json({ success: false, error: "RESEND_API_KEY fehlt in den Supabase Secrets" }, 500);
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Frigy <support@frigy.app>",
        to: [email],
        subject: "✅ Bestätige deine E-Mail-Adresse – Frigy",
        html: buildEmailHTML(linkData.properties.action_link),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("[send-email-confirmation] Resend error:", errText);
      return json({ success: false, error: `Resend: ${errText}` }, 500);
    }

    return json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-email-confirmation] ERROR:", msg);
    return json({ success: false, error: msg }, 500);
  }
});
