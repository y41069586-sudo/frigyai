/** Frigy brand — neue globale Mint-Palette app-weit (Onboarding, Tracker, UI) */
export const BRAND = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  primaryDeep: "#2EB56D",
  primaryLight: "#F2FFF8",
  mintBg: "#FFFFFF",
  selectedBg: "#DCFEEF",
  chipBg: "#F2FFF8",
  accent: "#DCFEEF",
  trackActive: "#75FBB2",
  trackInactive: "#DCFEEF",
  border: "#BCFDDC",
  text: "#1F2937",
  textMuted: "#6B7280",
} as const;

/** RGB triplets for rgba() in shadows / overlays */
export const BRAND_RGB = {
  primary: "117, 251, 178",
  primaryDark: "57, 212, 127",
} as const;

/** HSL for CSS variables (primary #75FBB2) */
export const BRAND_HSL = {
  primary: "147 94% 72%",
  primaryDark: "147 64% 53%",
  primaryLight: "148 100% 97%",
} as const;

export const BRAND_SHADOW = {
  button:
    `0 16px 34px -10px rgba(${BRAND_RGB.primaryDark}, 0.5), 0 0 34px rgba(${BRAND_RGB.primary}, 0.28), 0 2px 4px rgba(15,40,30,0.05)`,
  focusRing: `0 0 0 3px rgba(${BRAND_RGB.primary}, 0.16)`,
  cardSelected: `0 8px 24px -10px rgba(${BRAND_RGB.primary}, 0.4)`,
  pill: `0 4px 10px -3px rgba(${BRAND_RGB.primary}, 0.45)`,
} as const;
