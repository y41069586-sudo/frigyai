/**
 * Prints the OAuth URL Supabase returns for localhost redirect (same as the app uses).
 * Run: node scripts/test-google-oauth-url.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://mcabsjuamjgkvfljkfit.supabase.co";
const key =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_pYpJ5oKR-VFmy0O-meSmmQ_AZF9F0Aa";
const redirectTo = "http://localhost:4137/auth";

const supabase = createClient(url, key);

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo,
    skipBrowserRedirect: true,
    queryParams: { prompt: "select_account" },
  },
});

if (error) {
  console.error("error:", error.message);
  process.exit(1);
}

console.log("redirectTo sent:", redirectTo);
console.log("data.url:", data?.url ?? "(none)");

if (data?.url) {
  const parsed = new URL(data.url);
  console.log("host:", parsed.host);
  console.log("redirect_to param:", parsed.searchParams.get("redirect_to"));
  const goesGoogle =
    data.url.includes("accounts.google.com") || data.url.includes("/auth/v1/authorize");
  console.log("looks like Google OAuth:", goesGoogle);
  console.log("contains app.frigy.app:", data.url.includes("app.frigy.app"));
}
