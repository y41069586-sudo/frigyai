import { Capacitor } from "@capacitor/core";
import { openExternalUrl } from "@/lib/openExternalUrl";

/** Opens Google Play redeem UI with the promo code pre-filled (Play Store app on Android). */
export async function openPlayStorePromoRedeem(code: string): Promise<void> {
  const normalized = code.trim();
  if (!normalized) return;

  const httpsUrl = `https://play.google.com/redeem?code=${encodeURIComponent(normalized)}`;

  if (Capacitor.getPlatform() === "android") {
    const fallback = encodeURIComponent(httpsUrl);
    const intentUrl =
      `intent://play.google.com/redeem?code=${encodeURIComponent(normalized)}` +
      `#Intent;scheme=https;package=com.android.vending;S.browser_fallback_url=${fallback};end`;

    try {
      window.location.assign(intentUrl);
      return;
    } catch (error) {
      console.warn("[playStoreRedeem] Play Store intent failed, using browser:", error);
    }
  }

  await openExternalUrl(httpsUrl);
}
