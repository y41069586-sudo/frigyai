import { supabase } from "@/integrations/supabase/client";
import { getStoredInfluencerRef } from "@/lib/referralAttribution";

export type SyncAffiliateResult = {
  success: boolean;
  attributed?: boolean;
  slug?: string;
  error?: string;
};

/** Persist ChottuLink ?ref= to server (first-touch). Call after login. */
export async function syncAffiliateAttributionToServer(
  accessToken: string,
  options?: { deferred?: boolean; source?: string },
): Promise<SyncAffiliateResult> {
  const slug = getStoredInfluencerRef();
  if (!slug) {
    return { success: true, attributed: false };
  }

  const { data, error } = await supabase.functions.invoke("sync-affiliate-attribution", {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {
      slug,
      ref: slug,
      source: options?.source ?? "app",
      deferred: options?.deferred ?? false,
    },
  });

  if (error) {
    console.warn("[affiliate] sync failed:", error);
    return { success: false, error: error.message };
  }

  return (data ?? { success: true }) as SyncAffiliateResult;
}
