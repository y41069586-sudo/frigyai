import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const tools = [
  {
    type: "function",
    function: {
      name: "get_weight_entries",
      description: "Holt Gewichtseinträge des Nutzers aus der Datenbank",
      parameters: { type: "object", properties: { limit: { type: "number", description: "Anzahl der Einträge" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "add_weight_entry",
      description: "Fügt einen neuen Gewichtseintrag hinzu",
      parameters: { type: "object", properties: { weight: { type: "number", description: "Gewicht in kg" } }, required: ["weight"] }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_weight_entry",
      description: "Löscht einen Gewichtseintrag",
      parameters: { type: "object", properties: { entry_id: { type: "string" } }, required: ["entry_id"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_water_intake",
      description: "Holt die heutige Wasseraufnahme des Nutzers",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "add_water",
      description: "Fügt Wassergläser zum heutigen Tracker hinzu",
      parameters: { type: "object", properties: { glasses: { type: "number", description: "Anzahl Gläser (1 Glas = 250ml)" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_streaks",
      description: "Holt die aktuelle Streak des Nutzers",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_badges",
      description: "Holt alle Badges/Abzeichen des Nutzers",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "reset_tracker",
      description: "Setzt den Makro-Tracker für heute zurück",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_todays_food",
      description: "Holt die heute gegessenen Mahlzeiten",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_daily_macros",
      description: "Holt die heutigen Makronährstoffe (Kalorien, Protein, Kohlenhydrate, Fett)",
      parameters: { type: "object", properties: {} }
    }
  }
];

async function executeTool(
  toolName: string, 
  args: Record<string, unknown>, 
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  
  switch (toolName) {
    case 'get_weight_entries': {
      const { data } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit((args.limit as number) || 10);
      
      if (!data?.length) return "Keine Gewichtseinträge gefunden.";
      return `Gewichtsverlauf:\n${(data as any[]).map(e => `${new Date(e.recorded_at).toLocaleDateString('de-DE')}: ${e.weight}kg`).join('\n')}`;
    }
    
    case 'add_weight_entry': {
      const weight = args.weight as number;
      if (!weight || weight < 20 || weight > 500) return "Ungültiges Gewicht (20-500kg).";
      
      await supabase.from('weight_entries').insert({ user_id: userId, weight, recorded_at: new Date().toISOString() } as never);
      return `${weight}kg eingetragen! 💪`;
    }
    
    case 'delete_weight_entry': {
      const { data: existing } = await supabase
        .from('weight_entries')
        .select('id')
        .eq('user_id', userId)
        .ilike('id', `${args.entry_id}%`)
        .limit(1);
      
      if (!existing?.length) return "Eintrag nicht gefunden.";
      await supabase.from('weight_entries').delete().eq('id', (existing[0] as any).id);
      return "Gelöscht! ✓";
    }
    
    case 'get_water_intake': {
      const { data } = await supabase
        .from('water_intake')
        .select('glasses')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      
      const glasses = (data as any)?.glasses || 0;
      return `Heute: ${glasses} Gläser Wasser (${glasses * 250}ml) 💧`;
    }
    
    case 'add_water': {
      const glassesToAdd = (args.glasses as number) || 1;
      const { data: existing } = await supabase
        .from('water_intake')
        .select('id, glasses')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      
      if (existing) {
        await supabase.from('water_intake').update({ glasses: (existing as any).glasses + glassesToAdd } as never).eq('id', (existing as any).id);
        return `+${glassesToAdd} Glas! Gesamt: ${(existing as any).glasses + glassesToAdd} 💧`;
      } else {
        await supabase.from('water_intake').insert({ user_id: userId, date: today, glasses: glassesToAdd } as never);
        return `${glassesToAdd} Glas eingetragen! 💧`;
      }
    }
    
    case 'get_streaks': {
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!data) return "Noch keine Streak. Starte heute! 🔥";
      return `🔥 Aktuelle Streak: ${(data as any).current_streak} Tage | 🏆 Längste: ${(data as any).longest_streak} Tage`;
    }
    
    case 'get_badges': {
      const { data } = await supabase
        .from('user_badges')
        .select('badge_name')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (!data?.length) return "Noch keine Badges verdient. Weiter so! 🎯";
      return `Deine Badges: ${(data as any[]).map(b => `🏅 ${b.badge_name}`).join(', ')}`;
    }
    
    case 'reset_tracker':
      return "[ACTION:RESET_TRACKER] Tracker wird zurückgesetzt!";
    
    case 'get_todays_food': {
      const { data } = await supabase
        .from('food_entries')
        .select('name, calories, protein, carbs, fat, meal_type')
        .eq('user_id', userId)
        .eq('date', today);
      
      if (!data?.length) return "Heute noch nichts gegessen eingetragen.";
      const total = (data as any[]).reduce((acc, e) => ({
        cal: acc.cal + e.calories,
        prot: acc.prot + e.protein,
        carb: acc.carb + e.carbs,
        fat: acc.fat + e.fat
      }), { cal: 0, prot: 0, carb: 0, fat: 0 });
      
      return `Heute gegessen:\n${(data as any[]).map(e => `• ${e.name} (${e.calories} kcal)`).join('\n')}\n\nGesamt: ${total.cal} kcal | ${total.prot}g Protein | ${total.carb}g Carbs | ${total.fat}g Fett`;
    }
    
    case 'get_daily_macros': {
      const { data } = await supabase
        .from('daily_macros')
        .select('calories, protein, carbs, fat')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      
      if (!data) return "Heute noch keine Makros getrackt.";
      return `Heute: ${(data as any).calories} kcal | ${(data as any).protein}g Protein | ${(data as any).carbs}g Carbs | ${(data as any).fat}g Fett`;
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentifizierung erforderlich' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Ungültige Authentifizierung' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const { message, userProfile, history = [] } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'Nachricht erforderlich' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userContext = userProfile
      ? `Nutzer-Ziele: ${userProfile.dailyCalories}kcal pro Tag, ${userProfile.dailyProtein}g Protein, ${userProfile.dailyCarbs}g Kohlenhydrate, ${userProfile.dailyFat}g Fett. Aktuelles Gewicht: ${userProfile.weight}kg, Zielgewicht: ${userProfile.targetWeight}kg.`
      : '';

    const systemPrompt = `Du bist Frigy, der freundliche KI-Ernährungsassistent in der Frig AI App.

ÜBER DIE APP:
- Frig AI ist eine Ernährungs-App zum Kühlschrank scannen, Rezepte generieren und Wochenpläne erstellen
- Nutzer können ihren Kühlschrank fotografieren → KI erkennt Zutaten → generiert passende Rezepte
- Die App erstellt personalisierte Wochenpläne mit automatischer Einkaufsliste
- Es gibt Makro-Tracking (Kalorien, Protein, Kohlenhydrate, Fett), Wasser-Tracker und Gewichtsverlauf

DEINE FÄHIGKEITEN:
- Du kannst echte Aktionen in der App ausführen: Wasser hinzufügen, Gewicht tracken, Daten abrufen
- Du siehst die Ziele und den Fortschritt des Nutzers
- Gib konkrete, personalisierte Ernährungstipps basierend auf den Nutzerdaten
- Sei motivierend, kurz und freundlich (max 2-3 Sätze)
- Antworte auf Deutsch

${userContext}

Nutze die verfügbaren Tools um echte Aktionen auszuführen wenn der Nutzer darum bittet!`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools, tool_choice: 'auto', max_tokens: 300 }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Zu viele Anfragen. Bitte warte kurz.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 401) return new Response(JSON.stringify({ error: 'OpenAI API Key ungültig.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI error: ${response.status}`);
    }

    let data = await response.json();
    let assistantMessage = data.choices?.[0]?.message;

    if (assistantMessage?.tool_calls?.length) {
      const toolResults = [];
      for (const tc of assistantMessage.tool_calls) {
        const result = await executeTool(tc.function.name, JSON.parse(tc.function.arguments || '{}'), user.id, supabase);
        toolResults.push({ role: 'tool', tool_call_id: tc.id, content: result });
      }

      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [...messages, assistantMessage, ...toolResults], max_tokens: 300 }),
      });

      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      data = await response.json();
      assistantMessage = data.choices?.[0]?.message;
    }

    return new Response(JSON.stringify({ message: assistantMessage?.content || 'Entschuldigung, da ist etwas schiefgelaufen.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[AI-CHAT] Error:', error);
    return new Response(JSON.stringify({ error: 'Ein Fehler ist aufgetreten.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
