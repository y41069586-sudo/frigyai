import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { searchOpenFoodFacts } from "./openFoodFacts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const MAX_BASE64_SIZE = 6_700_000;
const FOOD_NOT_FOUND = "Essen nicht gefunden";

const requestSchema = z
  .object({
    food: z.string().min(1).max(500).optional(),
    imageBase64: z.string().max(MAX_BASE64_SIZE).optional(),
  })
  .refine((data) => data.food || data.imageBase64, {
    message: "Either 'food' or 'imageBase64' must be provided",
  });

async function uploadFoodPhoto(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  imageBase64: string,
): Promise<string | null> {
  try {
    const imageData = base64Decode(imageBase64);
    const fileName = `${userId}/${Date.now()}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from("food-photos")
      .upload(fileName, imageData, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("[ANALYZE-FOOD] Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("food-photos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error("[ANALYZE-FOOD] Photo upload failed:", err);
    return null;
  }
}

function notFoundResponse() {
  return successResponse({ error: FOOD_NOT_FOUND, not_found: true });
}

function successResponse(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function analyzeWithOpenAI(
  apiKey: string,
  food: string | undefined,
  imageBase64: string | undefined,
): Promise<Record<string, unknown> | null> {
  const systemPrompt = `Du bist Ernährungs-Assistent. Antworte NUR mit JSON, kein anderer Text.

Wenn du das Essen als echtes Lebensmittel mit verlässlichen Nährwerten kennst:
{"found":true,"name":"Name mit Menge","calories":123,"protein":10,"carbs":20,"fat":5,"portion":"Portionsangabe"}

Wenn unbekannt, erfunden, keine Speise, nur Zutaten ohne Gericht, oder unsicher:
{"found":false}

Kalorien als ganze Zahl. Deutsche Namen.`;

  const messages: { role: string; content: unknown }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: food?.trim() ? `Analysiere: ${food.trim()}` : "Analysiere:" },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `Analysiere: ${food?.trim()}`,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 180,
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ANALYZE-FOOD] AI error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("[ANALYZE-FOOD] AI response:", content);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      const trimmed = content.trim();
      const startIdx = trimmed.indexOf("{");
      const endIdx = trimmed.lastIndexOf("}");
      if (startIdx === -1 || endIdx === -1) return null;
      parsed = JSON.parse(trimmed.substring(startIdx, endIdx + 1));
    }

    if (parsed.found === false) return null;

    const calories = Math.round(Number(parsed.calories) || 0);
    const name = String(parsed.name || "").trim();
    if (!name || calories <= 0) return null;

    return {
      found: true,
      name,
      calories,
      protein: Math.round(Number(parsed.protein) || 0),
      carbs: Math.round(Number(parsed.carbs) || 0),
      fat: Math.round(Number(parsed.fat) || 0),
      portion: parsed.portion ? String(parsed.portion) : undefined,
      source: "ai",
    };
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new Error("Analyse zu langsam. Bitte erneut versuchen.");
    }
    throw fetchError;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server-Konfiguration fehlt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "AI-Service nicht konfiguriert. Bitte kontaktiere den Admin.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      token,
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { food, imageBase64 } = parseResult.data;
    const uploadPromise = imageBase64
      ? uploadFoodPhoto(supabaseAdmin, user.id, imageBase64)
      : Promise.resolve(null);

    // 1) Text search: Open Food Facts first (verified database)
    if (food?.trim() && !imageBase64) {
      console.log("[ANALYZE-FOOD] OFF search:", food.trim());
      const offMatch = await searchOpenFoodFacts(food.trim());
      if (offMatch) {
        console.log("[ANALYZE-FOOD] OFF hit:", offMatch.name);
        return successResponse(offMatch);
      }
      console.log("[ANALYZE-FOOD] OFF miss, trying OpenAI");
    }

    // 2) OpenAI fallback (text not in OFF, or photo analysis)
    const aiResult = await analyzeWithOpenAI(OPENAI_API_KEY, food, imageBase64);
    const imageUrl = await uploadPromise;

    if (!aiResult) {
      return notFoundResponse();
    }

    return successResponse({
      name: aiResult.name,
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fat: aiResult.fat,
      portion: aiResult.portion,
      source: "ai",
      image_url: imageUrl || undefined,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ANALYZE-FOOD] Error:", errorMessage, error);

    if (errorMessage.includes("zu langsam")) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 408,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: "Analyse fehlgeschlagen. Bitte erneut versuchen.",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
