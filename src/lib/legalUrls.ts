/** Public privacy policy URL for App Store Connect & in-app links. */
export const PRIVACY_POLICY_URL =
  import.meta.env.VITE_PRIVACY_POLICY_URL?.trim() || "https://app.frigy.app/legal/datenschutz";

export const TERMS_URL =
  import.meta.env.VITE_TERMS_URL?.trim() || "https://app.frigy.app/legal/agb";

export const SUPPORT_URL =
  import.meta.env.VITE_SUPPORT_URL?.trim() || "https://app.frigy.app/legal/impressum";
