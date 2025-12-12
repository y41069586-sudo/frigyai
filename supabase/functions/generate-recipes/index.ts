import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  ingredients: z.array(z.string().min(1).max(100)).min(1).max(50),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const body = await req.json();
    
    // Validate input
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { ingredients } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating recipes for ingredients:", ingredients);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du bist ein erfahrener Koch und Ernährungsberater, der kreative, ECHTE Rezepte erstellt.

WICHTIG: Erstelle REALISTISCHE Gerichte, die man tatsächlich kochen würde!
- NICHT einfach Zutaten-Namen kombinieren (z.B. NICHT "Joghurt-Erbsen-Salat")
- Stattdessen ECHTE Gerichte wie: "Cremiges Erbsen-Curry", "Protein-Bowl mit Joghurt-Dressing", "Gebratene Kichererbsen mit Gemüse"

Denke wie ein Koch: Was kann man aus diesen Zutaten WIRKLICH Leckeres zubereiten?

Regeln:
- 3-5 Rezepte erstellen
- Nur 3-4 Zutaten aus der Liste pro Rezept verwenden
- Unter 500 Kalorien pro Portion
- Unter 15 Minuten Zubereitungszeit
- Einfache Zubereitung (Pfanne, Ofen, Mixer)

Return ONLY a valid JSON array:
[
  {
    "id": "unique-kebab-case-id",
    "title": "Kreativer deutscher Rezeptname",
    "calories": 350,
    "protein": 30,
    "carbs": 25,
    "fat": 12,
    "prepTime": 10,
    "difficulty": "Einfach",
    "ingredients": ["Zutat 1", "Zutat 2", "Zutat 3"],
    "instructions": ["Schritt 1...", "Schritt 2...", "Schritt 3..."],
    "healthierAlternatives": []
  }
]

Alle Texte auf Deutsch. Sei kreativ mit den Rezeptnamen!`
          },
          {
            role: "user",
            content: `Hier sind die verfügbaren Zutaten: ${ingredients.join(", ")}

Erstelle kreative, ECHTE Rezepte die man wirklich kochen würde. Denke an klassische Gerichte wie Rührei, Omelette, Salate mit Dressing, Wraps, Bowls, Pfannengerichte etc. Kombiniere die Zutaten sinnvoll!`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", content);

    // Parse the JSON array from the response
    let recipes = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recipes = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Error parsing recipes:", e);
      throw new Error("Failed to parse recipe response");
    }

    // Ensure each recipe has a unique ID
    recipes = recipes.map((recipe: any, index: number) => ({
      ...recipe,
      id: recipe.id || `recipe-${Date.now()}-${index}`,
    }));

    return new Response(
      JSON.stringify({ recipes }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-recipes:", error);
    return new Response(
      JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
