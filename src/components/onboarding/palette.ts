import { BRAND, BRAND_RGB, BRAND_SHADOW } from "@/lib/brandColors";

/** Einheitliche Onboarding-Farben — immer aus BRAND ableiten */
export const ONBOARDING_PALETTE = {
  primary: BRAND.primary,
  primaryDark: BRAND.primaryDark,
  primaryDeep: BRAND.primaryDeep,
  primaryLight: BRAND.primaryLight,
  bg: BRAND.mintBg,
  selectedBg: BRAND.selectedBg,
  chipBg: BRAND.chipBg,
  accent: BRAND.accent,
  trackActive: BRAND.trackActive,
  trackInactive: BRAND.trackInactive,
  border: BRAND.border,
  activateBg: BRAND.primary,
  highlight: BRAND.selectedBg,
  cardBorderIdle: "#D1D5DB",
  text: BRAND.text,
  textMuted: BRAND.textMuted,
  badLine: "#C8232C",
  badLineDeep: "#A0181F",
  rgbPrimary: BRAND_RGB.primary,
  rgbPrimaryDark: BRAND_RGB.primaryDark,
  shadowButton: BRAND_SHADOW.button,
  shadowFocus: BRAND_SHADOW.focusRing,
  shadowCard: BRAND_SHADOW.cardSelected,
  shadowPill: BRAND_SHADOW.pill,
} as const;
