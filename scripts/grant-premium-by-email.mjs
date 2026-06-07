/**
 * One-off admin grant (needs service role key):
 *   set SUPABASE_SERVICE_ROLE_KEY=... && node scripts/grant-premium-by-email.mjs user@example.com [days]
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2]?.trim().toLowerCase();
const durationDays = Number(process.argv[3] || 365);
const ADMIN_GRANT_PRODUCT_ID = "store_admin_grant";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!email) {
  console.error("Usage: node scripts/grant-premium-by-email.mjs <email> [duration_days]");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const subscriptionEnd = new Date();
subscriptionEnd.setDate(subscriptionEnd.getDate() + Math.max(1, durationDays));

const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error("listUsers failed:", listError.message);
  process.exit(1);
}

const user = listData.users.find((u) => u.email?.trim().toLowerCase() === email);
if (!user) {
  console.error(`User not found: ${email}`);
  process.exit(1);
}

const { error: upsertError } = await supabase.from("subscription_cache").upsert(
  {
    user_id: user.id,
    subscribed: true,
    product_id: ADMIN_GRANT_PRODUCT_ID,
    subscription_end: subscriptionEnd.toISOString(),
    is_trial: false,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "user_id" },
);

if (upsertError) {
  console.error("subscription_cache upsert failed:", upsertError.message);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      email: user.email,
      user_id: user.id,
      product_id: ADMIN_GRANT_PRODUCT_ID,
      subscription_end: subscriptionEnd.toISOString(),
    },
    null,
    2,
  ),
);
