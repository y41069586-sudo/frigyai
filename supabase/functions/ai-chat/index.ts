import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const tools = [
  {
    type: "function",
    function: {
      name: "get_weight_entries",
      description: "Holt Gewichtseinträge des Nutzers",
      parameters: { type: "object", properties: { limit: { type: "number" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "add_weight_entry",
      description: "Fügt Gewichtseintrag hinzu",
      parameters: { type: "object", properties: { weight: { type: "number" } }, required: ["weight"] }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_weight_entry",
      description: "Löscht Gewichtseintrag",
      parameters: { type: "object", properties: { entry_id: { type: "string" } }, required: ["entry_id"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_water_intake",
      description: "Holt heutige Wasseraufnahme",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "add_water",
      description: "Fügt Wasser hinzu",
      parameters: { type: "object", properties: { glasses: { type: "number" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_streaks",
      description: "Holt Streak-Daten",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_badges",
      description: "Holt Badges",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "reset_tracker",
      description: "Setzt Makro-Tracker zurück",
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
      return `Gewicht:\n${(data as any[]).map(e => `${new Date(e.recorded_at).toLocaleDateString('de-DE')}: ${e.weight}kg`).join('\n')}`;
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
      return `Heute: ${glasses} Gläser (${glasses * 250}ml) 💧`;
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
      return `🔥 Aktuell: ${(data as any).current_streak} Tage | 🏆 Längste: ${(data as any).longest_streak} Tage`;
    }
    
    case 'get_badges': {
      const { data } = await supabase
        .from('user_badges')
        .select('badge_name')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (!data?.length) return "Noch keine Badges. Weiter so! 🎯";
      return `Badges: ${(data as any[]).map(b => `🏅 ${b.badge_name}`).join(', ')}`;
    }
    
    case 'reset_tracker':
      return "[ACTION:RESET_TRACKER] Tracker wird zurückgesetzt!";
    
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
      return new Response(JSON.stringify({ error: 'Auth required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { message, userProfile, history = [] } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userContext = userProfile ? `Ziele: ${userProfile.dailyCalories}kcal, ${userProfile.dailyProtein}g P, ${userProfile.weight}kg→${userProfile.targetWeight}kg` : '';

    const systemPrompt = `Du bist Fridgie, ein freundlicher Ernährungsassistent (deutsch).
${userContext}

Nutze Tools nur wenn explizit gefragt. Halte Antworten kurz (max 100 Wörter). Sei motivierend!`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages, tools, tool_choice: 'auto', max_tokens: 300 }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Zu viele Anfragen.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [...messages, assistantMessage, ...toolResults], max_tokens: 300 }),
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
