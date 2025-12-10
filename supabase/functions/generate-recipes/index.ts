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
            content: `You are a health-focused recipe generator specializing in simple, low-calorie meals. 
            Generate 3-5 healthy recipes using ONLY the provided ingredients or a subset of them.
            
            Each recipe must:
            - Use only 3-4 ingredients from the provided list
            - Be under 500 calories per serving
            - Be high in protein or low in calories
            - Take less than 15 minutes to prepare
            - Be very simple (pan, oven, or blender)
            
            Return ONLY a valid JSON array with this exact structure:
            [
              {
                "id": "unique-id",
                "title": "Recipe Name in German",
                "calories": 350,
                "protein": 30,
                "carbs": 25,
                "fat": 12,
                "prepTime": 10,
                "difficulty": "Einfach",
                "ingredients": ["Ingredient 1", "Ingredient 2", "Ingredient 3"],
                "instructions": ["Step 1", "Step 2", "Step 3"],
                "healthierAlternatives": ["Use yogurt 0% instead of cream", "Use olive oil instead of butter"]
              }
            ]
            
            Important: 
            - All text must be in German
            - Be realistic about calories and macros
            - Instructions should be clear and numbered
            - Healthier alternatives are optional but recommended`
          },
          {
            role: "user",
            content: `Generate healthy low-calorie recipes using these ingredients: ${ingredients.join(", ")}. Remember: Use only 3-4 ingredients per recipe, keep it simple, under 500 calories, and under 15 minutes prep time.`
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
