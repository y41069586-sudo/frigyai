import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tool definitions for the AI
const tools = [
  {
    type: "function",
    function: {
      name: "get_weight_entries",
      description: "Holt die Gewichtseinträge des Nutzers. Nutze dies wenn der Nutzer nach seinem Gewichtsverlauf fragt.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Anzahl der Einträge (Standard: 10)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_weight_entry",
      description: "Fügt einen neuen Gewichtseintrag hinzu. Nutze dies wenn der Nutzer sein Gewicht eintragen möchte.",
      parameters: {
        type: "object",
        properties: {
          weight: { type: "number", description: "Gewicht in kg" }
        },
        required: ["weight"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_weight_entry",
      description: "Löscht einen Gewichtseintrag. Nutze dies wenn der Nutzer einen Eintrag löschen möchte.",
      parameters: {
        type: "object",
        properties: {
          entry_id: { type: "string", description: "ID des Eintrags" }
        },
        required: ["entry_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_water_intake",
      description: "Holt die heutige Wasseraufnahme des Nutzers.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_water",
      description: "Fügt ein Glas Wasser hinzu. Nutze dies wenn der Nutzer Wasser tracken möchte.",
      parameters: {
        type: "object",
        properties: {
          glasses: { type: "number", description: "Anzahl der Gläser (Standard: 1)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "reset_water_intake",
      description: "Setzt die Wasseraufnahme für heute zurück.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_streaks",
      description: "Holt die Streak-Daten des Nutzers (aktuelle und längste Streak).",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_badges",
      description: "Holt die verdienten Badges/Abzeichen des Nutzers.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "reset_tracker",
      description: "Setzt den Makro-Tracker zurück. Nutze dies NUR wenn der Nutzer explizit seinen Tracker zurücksetzen möchte.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_scan_usage",
      description: "Zeigt wie viele Scans der Nutzer heute schon gemacht hat.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

// Execute tool functions
async function executeTool(
  toolName: string, 
  args: Record<string, unknown>, 
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  console.log(`[AI-CHAT] Executing tool: ${toolName}`, args);
  
  const today = new Date().toISOString().split('T')[0];
  
  switch (toolName) {
    case 'get_weight_entries': {
      const limit = (args.limit as number) || 10;
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(limit);
      
      if (error) return `Fehler beim Abrufen: ${error.message}`;
      if (!data || data.length === 0) return "Keine Gewichtseinträge gefunden.";
      
      const entries = (data as { weight: number; recorded_at: string; id: string }[]).map(e => 
        `${new Date(e.recorded_at).toLocaleDateString('de-DE')}: ${e.weight}kg (ID: ${e.id.slice(0, 8)})`
      ).join('\n');
      return `Gewichtseinträge:\n${entries}`;
    }
    
    case 'add_weight_entry': {
      const weight = args.weight as number;
      if (!weight || weight < 20 || weight > 500) {
        return "Ungültiges Gewicht. Bitte gib ein Gewicht zwischen 20 und 500 kg an.";
      }
      
      const { error } = await supabase
        .from('weight_entries')
        .insert({ user_id: userId, weight, recorded_at: new Date().toISOString() } as never);
      
      if (error) return `Fehler beim Speichern: ${error.message}`;
      return `Gewicht ${weight}kg wurde erfolgreich eingetragen! 💪`;
    }
    
    case 'delete_weight_entry': {
      const entryId = args.entry_id as string;
      
      // First check if entry exists and belongs to user
      const { data: existing } = await supabase
        .from('weight_entries')
        .select('id')
        .eq('user_id', userId)
        .ilike('id', `${entryId}%`)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        return "Eintrag nicht gefunden oder gehört nicht zu dir.";
      }
      
      const existingEntry = existing[0] as { id: string };
      
      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', existingEntry.id)
        .eq('user_id', userId);
      
      if (error) return `Fehler beim Löschen: ${error.message}`;
      return "Gewichtseintrag wurde gelöscht! ✓";
    }
    
    case 'get_water_intake': {
      const { data, error } = await supabase
        .from('water_intake')
        .select('glasses')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      
      if (error) return `Fehler: ${error.message}`;
      const waterData = data as { glasses: number } | null;
      const glasses = waterData?.glasses || 0;
      return `Heute: ${glasses} Gläser Wasser (${glasses * 250}ml) 💧`;
    }
    
    case 'add_water': {
      const glassesToAdd = (args.glasses as number) || 1;
      
      // Get current intake
      const { data: existingData } = await supabase
        .from('water_intake')
        .select('id, glasses')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      
      const existing = existingData as { id: string; glasses: number } | null;
      
      if (existing) {
        const { error } = await supabase
          .from('water_intake')
          .update({ glasses: existing.glasses + glassesToAdd } as never)
          .eq('id', existing.id);
        
        if (error) return `Fehler: ${error.message}`;
        return `+${glassesToAdd} Glas Wasser hinzugefügt! Gesamt: ${existing.glasses + glassesToAdd} Gläser 💧`;
      } else {
        const { error } = await supabase
          .from('water_intake')
          .insert({ user_id: userId, date: today, glasses: glassesToAdd } as never);
        
        if (error) return `Fehler: ${error.message}`;
        return `${glassesToAdd} Glas Wasser eingetragen! 💧`;
      }
    }
    
    case 'reset_water_intake': {
      const { error } = await supabase
        .from('water_intake')
        .delete()
        .eq('user_id', userId)
        .eq('date', today);
      
      if (error) return `Fehler: ${error.message}`;
      return "Wasseraufnahme für heute zurückgesetzt! 💧";
    }
    
    case 'get_streaks': {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) return `Fehler: ${error.message}`;
      if (!data) return "Noch keine Streak-Daten vorhanden. Starte heute! 🔥";
      
      const streakData = data as { current_streak: number; longest_streak: number; last_activity_date: string | null };
      return `🔥 Aktuelle Streak: ${streakData.current_streak} Tage\n🏆 Längste Streak: ${streakData.longest_streak} Tage\n📅 Letzte Aktivität: ${streakData.last_activity_date || 'Keine'}`;
    }
    
    case 'get_badges': {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_name, badge_type, earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (error) return `Fehler: ${error.message}`;
      if (!data || data.length === 0) return "Noch keine Badges verdient. Weiter so! 🎯";
      
      const badges = (data as { badge_name: string; earned_at: string }[]).map(b => 
        `🏅 ${b.badge_name} (${new Date(b.earned_at).toLocaleDateString('de-DE')})`
      ).join('\n');
      return `Deine Badges:\n${badges}`;
    }
    
    case 'reset_tracker': {
      // Return action command for frontend to handle
      return "[ACTION:RESET_TRACKER] Dein Makro-Tracker wird jetzt zurückgesetzt. Du kannst deine Ziele neu einrichten!";
    }
    
    case 'get_scan_usage': {
      const { data, error } = await supabase
        .from('scan_usage')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('scan_date', today)
        .maybeSingle();
      
      if (error) return `Fehler: ${error.message}`;
      const scanData = data as { scan_count: number } | null;
      const count = scanData?.scan_count || 0;
      return `Heute: ${count} Scans verwendet 📷`;
    }
    
    default:
      return "Unbekannte Aktion.";
  }
}

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
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

    const systemPrompt = `Du bist Frig AI, ein freundlicher und kompetenter KI-Assistent in einer deutschen Abnehm-App.

${userContext}

Du hast Zugriff auf folgende Funktionen die du nutzen kannst:
- Gewichtseinträge anzeigen, hinzufügen und löschen
- Wasseraufnahme anzeigen, hinzufügen und zurücksetzen
- Streaks und Badges anzeigen
- Scan-Nutzung anzeigen
- Makro-Tracker zurücksetzen

WICHTIG: 
- Nutze die Tools NUR wenn der Nutzer explizit danach fragt
- Bei Fragen wie "Wie viel wiege ich?" oder "Zeig mir mein Gewicht" → nutze get_weight_entries
- Bei "Trag 75kg ein" oder "Ich wiege heute 80kg" → nutze add_weight_entry
- Bei "Wie viel Wasser habe ich getrunken?" → nutze get_water_intake
- Bei "Ich habe ein Glas Wasser getrunken" → nutze add_water
- Bei "Zeig mir meine Streaks/Badges" → nutze entsprechende Tools
- Bei "Tracker zurücksetzen" → nutze reset_tracker

Deine weiteren Aufgaben:
1. ERNÄHRUNGSBERATUNG: Beantworte Fragen zu Ernährung und gesunden Rezepten
2. APP-HILFE: Erkläre wie die App funktioniert
3. Schlage Rezepte vor, die zu den Kalorienzielen passen
4. Gib motivierende Tipps zum Abnehmen

APP-FUNKTIONEN die du erklären kannst:
- Tracker: Tägliche Kalorien und Makros erfassen
- Wochenplan: Personalisierte Mahlzeiten basierend auf Zielen
- Einkaufsliste: Automatisch generiert aus dem Wochenplan
- Wasser Tracker: Tägliche Wasseraufnahme tracken
- Fortschritt: Gewichtsverlauf verfolgen
- Kühlschrank scannen: Foto machen, Rezepte erhalten
- Essen bearbeiten: Auf einen Eintrag tippen um Makros anzupassen

Regeln:
- Antworte immer auf Deutsch
- Halte Antworten kurz und prägnant (max 150 Wörter)
- Bei Rezeptvorschlägen: Nenne immer Kalorien und Protein
- Sei motivierend und positiv
- Verwende gelegentlich Emojis`;

    // Build messages array with history
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('[AI-CHAT] Sending request to AI gateway with tools');

    // First API call with tools
    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        tool_choice: 'auto',
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

    let data = await response.json();
    let assistantMessage = data.choices?.[0]?.message;
    
    // Check if the model wants to call a tool
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('[AI-CHAT] Tool calls detected:', assistantMessage.tool_calls);
      
      // Execute all tool calls
      const toolResults: Array<{ role: string; tool_call_id: string; content: string }> = [];
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        const result = await executeTool(toolName, toolArgs, user.id, supabase);
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }
      
      // Second API call with tool results
      const followUpMessages = [
        ...messages,
        assistantMessage,
        ...toolResults,
      ];
      
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: followUpMessages,
          max_tokens: 500,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI gateway error on follow-up: ${response.status}`);
      }
      
      data = await response.json();
    }

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
