import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY");
    if (!OPENAI_API_KEY) {
      console.error("[assess-fridge-for-week] OPENAI_API_KEY fehlt");
      return new Response(JSON.stringify({ error: "ai_not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const raw = body.ingredients;
    if (!Array.isArray(raw) || raw.length === 0) {
      return new Response(JSON.stringify({ error: "ingredients_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const list = raw
      .map((x: unknown) => String(x).trim())
      .filter(Boolean)
      .slice(0, 80);

    const prompt = `Du bist Ernährungsberater. Beurteile, ob die folgende Liste erkannter Kühlschrank-Zutaten für EINE VOLLE WOCHE (7 Tage, jeweils Frühstück, Mittag- und Abendessen) für eine ausgewogene Ernährung AUSREICHT, wenn man möglichst nur mit dem Vorhandenen kochen soll. Mengen sind unbekannt – schätze konservativ (wenig Vielfalt oder nur Snacks = meist unzureichend).

Zutaten:
${list.map((x: string) => `- ${x}`).join("\n")}

Antwort NUR als JSON-Objekt, kein Markdown:
{"sufficient": true oder false, "reason": "Kurze Begründung auf Deutsch, maximal 2 Sätze"}

"sufficient" ist true nur wenn Vielfalt und erwartbare Menge realistisch für 7 Tage reichen; false bei zu wenig Positionen, kaum Protein/Gemüse/Kohlenhydrate, nur Süßigkeiten/Getränke, oder offensichtlich zu wenig für 21 Mahlzeiten.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[assess-fridge-for-week] OpenAI ${response.status}: ${errText}`);
      return new Response(JSON.stringify({ error: "openai_failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: { sufficient?: unknown; reason?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("[assess-fridge-for-week] JSON parse failed:", content.slice(0, 200));
      return new Response(JSON.stringify({ error: "parse_failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sufficient = parsed.sufficient === true;
    const reason = typeof parsed.reason === "string" ? parsed.reason : "";

    return new Response(JSON.stringify({ sufficient, reason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[assess-fridge-for-week]", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
