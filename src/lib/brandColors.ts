/** Frigy brand — helles Mint-Grün app-weit (Onboarding, Tracker, UI) */
export const BRAND = {
  primary: "#6EF0A8",
  primaryDark: "#4AE896",
  primaryDeep: "#32D082",
  primaryLight: "#F0FFF6",
  mintBg: "#FEFFFE",
  selectedBg: "#E0FDEC",
  chipBg: "#F5FFF9",
  accent: "#E0FDEC",
  trackActive: "#6EF0A8",
  trackInactive: "#E0FDEC",
  border: "#B8EFD0",
  text: "#1F2937",
  textMuted: "#6B7280",
} as const;

/** RGB triplets for rgba() in shadows / overlays */
export const BRAND_RGB = {
  primary: "110, 240, 168",
  primaryDark: "74, 232, 150",
} as const;

/** HSL for CSS variables (primary #6EF0A8) */
export const BRAND_HSL = {
  primary: "144 78% 68%",
  primaryDark: "146 72% 58%",
  primaryLight: "142 100% 96%",
} as const;

export const BRAND_SHADOW = {
  button:
    `0 16px 34px -10px rgba(${BRAND_RGB.primaryDark}, 0.5), 0 0 34px rgba(${BRAND_RGB.primary}, 0.28), 0 2px 4px rgba(15,40,30,0.05)`,
  focusRing: `0 0 0 3px rgba(${BRAND_RGB.primary}, 0.16)`,
  cardSelected: `0 8px 24px -10px rgba(${BRAND_RGB.primary}, 0.4)`,
  pill: `0 4px 10px -3px rgba(${BRAND_RGB.primary}, 0.45)`,
} as const;
