import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI-CHAT] User authenticated:', user.id);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { message, userProfile, history = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context about user's goals
    let userContext = '';
    if (userProfile) {
      const deficit = userProfile.weight - userProfile.targetWeight;
      userContext = `
Der Benutzer hat folgende Ziele:
- Tägliche Kalorien: ${userProfile.dailyCalories} kcal
- Tägliches Protein: ${userProfile.dailyProtein}g
- Tägliche Kohlenhydrate: ${userProfile.dailyCarbs}g
- Tägliches Fett: ${userProfile.dailyFat}g
- Aktuelles Gewicht: ${userProfile.weight}kg
- Zielgewicht: ${userProfile.targetWeight}kg (${deficit}kg abnehmen)

Alle Rezeptvorschläge MÜSSEN diese Kalorienziele berücksichtigen!`;
    }

    const systemPrompt = `Du bist Frig AI, ein freundlicher und kompetenter KI-Ernährungsberater in einer deutschen Abnehm-App.

${userContext}

Deine Aufgaben:
1. Beantworte Fragen zu Ernährung, Abnehmen und gesunden Rezepten
2. Schlage Rezepte vor, die zu den Kalorienzielen des Benutzers passen
3. Gib motivierende Tipps zum Abnehmen
4. Erkläre Makronährstoffe und deren Bedeutung
5. Hilf bei der Essensplanung

Regeln:
- Antworte immer auf Deutsch
- Halte Antworten kurz und prägnant (max 150 Wörter)
- Bei Rezeptvorschlägen: Nenne immer Kalorien und Protein
- Sei motivierend und positiv
- Verwende gelegentlich Emojis für Freundlichkeit
- Wenn der Benutzer nach einem Rezept fragt, stelle sicher, dass es zu seinen Kalorienzielen passt

Beispiel für Rezeptvorschlag:
"🍳 Protein-Rührei (320 kcal, 28g Protein)
- 3 Eier
- 50g Hüttenkäse
- Gemüse nach Wahl
Schnell zubereitet und perfekt für dein Ziel!"`;

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('[AI-CHAT] Sending request to AI gateway');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'KI-Dienst nicht verfügbar.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[AI-CHAT] AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.';

    console.log('[AI-CHAT] Response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[AI-CHAT] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
