import { Capacitor } from "@capacitor/core";

/**
 * Stripe & externe Links: im Browser Tab/Fenster, in der nativen App per In-App-Browser (Chrome Custom Tab).
 * `window.top.location` funktioniert in Capacitor-WebView oft nicht.
 */
export async function openExternalUrl(url: string): Promise<void> {
  const target = url?.trim();
  if (!target) return;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: target, presentationStyle: "fullscreen" });
      return;
    } catch (err) {
      console.warn("[openExternalUrl] Capacitor Browser failed, fallback:", err);
    }

    try {
      const opened = window.open(target, "_blank", "noopener,noreferrer");
      if (opened) return;
    } catch (err) {
      console.warn("[openExternalUrl] window.open failed:", err);
    }

    window.location.assign(target);
    return;
  }

  window.location.assign(target);
}
