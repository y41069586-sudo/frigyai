import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Get authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const userId = userData.user.id;
    console.log(`[DELETE-USER] Starting deletion for user: ${userId}`);

    // Delete auth user FIRST (using admin API with service role)
    // If this fails, DB data remains intact for retry
    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error(`[DELETE-USER] Error deleting auth user: ${deleteAuthError.message}`);
      throw deleteAuthError;
    }

    console.log(`[DELETE-USER] Auth user deleted: ${userId}`);

    // Only delete DB data AFTER successful auth deletion
    // This ensures data is only removed if account deletion is complete
    try {
      await Promise.all([
        supabaseClient.from('user_tracker_settings').delete().eq('user_id', userId),
        supabaseClient.from('food_entries').delete().eq('user_id', userId),
        supabaseClient.from('daily_macros').delete().eq('user_id', userId),
        supabaseClient.from('user_streaks').delete().eq('user_id', userId),
        supabaseClient.from('water_intake').delete().eq('user_id', userId),
        supabaseClient.from('onboarding_data').delete().eq('user_id', userId),
        supabaseClient.from('user_onboarding').delete().eq('user_id', userId),
        supabaseClient.from('weekly_meal_plans').delete().eq('user_id', userId),
        supabaseClient.from('subscription_cache').delete().eq('user_id', userId),
      ]);
      console.log(`[DELETE-USER] All user data deleted: ${userId}`);
    } catch (dbDeleteError) {
      // DB deletion failed after auth deletion - return error status
      // This informs the client that the deletion was incomplete
      console.error(`[DELETE-USER] Error: Could not delete DB records: ${dbDeleteError}`);
      return new Response(
        JSON.stringify({
          error: "Database cleanup failed - auth deleted but data remains",
          userId: userId,
          message: "Please retry deletion or contact support"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log(`[DELETE-USER] User account fully deleted: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[DELETE-USER] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
