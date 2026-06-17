# Frigy: Capacitor/React → Native SwiftUI Migration Plan

**Ziel:** Vollständig native iOS-26-App mit echtem Liquid Glass, App-Store-Release, Wiederverwendung der Backend- und Business-Logik.

**Scope iOS:** SwiftUI ersetzt `ios/` Capacitor-WebView. **Android bleibt vorerst Capacitor/React.**

---

## Phasen & Prioritäten

| Phase | Inhalt | Priorität | Tage |
|-------|--------|-----------|------|
| 0 | Xcode 26 Projekt, SPM, CI, Entitlements | P0 | 3 |
| 1 | App-Shell + native Glass Tab-Bar | P0 | 5 |
| 2 | Supabase Auth (Email, Apple, OAuth) | P0 | 6 |
| 3 | Onboarding (~57 Steps) | P0 | 18 |
| 4 | RevenueCat Paywall + Restore | P0 | 5 |
| 5 | Dashboard + Tracker + Chatbot | P1 | 12 |
| 6 | Meal Plans + Shopping + Reminders | P1 | 12 |
| 7 | Camera/Scan + Barcode (VisionKit) | P1 | 10 |
| 8 | Profile, i18n, Notifications | P2 | 8 |
| 9 | Deep Links, Referral, Badges, QA | P2 | 7 |
| 10 | Capacitor-iOS Abschaltung, App Store | P0 | 3 |

**Gesamt:** ~89 Tage + 20 % Puffer ≈ **~107 Tage** (1 Dev) · **~65–75 Tage** (2 Devs parallel)

---

## Phase 1 — Umgesetzt in Branch `cursor/swiftui-native-migration-e370`

- `Navigation/GlassTabBar.swift` — Morphing-Capsule via `glassEffectID`
- `MainShellView.swift` — kein Standard-`TabView`
- Screen-Platzhalter: Home, Plans, Shopping, Tracker Sheet
- `Core/MacroCalculator.swift` — Port von `onboarding/utils.ts`

---

## React-Dateien: Entfallen nach iOS-Migration

### Komplett entfernen (Glass / iOS-Capacitor)

- `src/components/LiquidGlass.tsx`, `LiquidGlass.css`
- `src/components/MainNavChrome.tsx`
- `src/lib/mobileEffects.ts`, `appleSignIn.ts`, `chottuLinkNative.ts`
- `ios/App/**` (Capacitor WebView)

### Bereinigen

- `src/components/BottomNavigation.tsx` — LiquidGlass (nur Android/Web behalten)
- `src/pages/Index.tsx`, `MealPlansPage.tsx` — LiquidGlass-Imports
- `src/App.tsx` — `LiquidGlassDefs`
- `src/index.css` — `.liquid-*` Regeln

### Seiten → SwiftUI (bis Parität behalten)

Alle `src/pages/*.tsx`, `OnboardingFlow.tsx`, `AIChatbot.tsx`, `ShoppingList.tsx`, etc.

### Behalten unverändert

- `supabase/functions/**` (Edge Functions)
- `android/**` + React für Android
- `src/integrations/supabase/types.ts` als Referenz für Swift Models

---

## SwiftUI-Dateien

### Vorhanden + Phase 1 ✅

```
ios-swiftui/FrigyNative/
├── FrigyNativeApp.swift, AppState.swift, RootView.swift
├── GlassComponents.swift
├── MainShellView.swift
├── Navigation/AppTab.swift, GlassTabBar.swift
├── Screens/HomeDashboardView.swift, MealPlansView.swift
├── Screens/ShoppingListView.swift, TrackerLogMealView.swift
└── Core/MacroCalculator.swift
```

### Phase 2–10 (noch zu erstellen)

- `Services/SupabaseAuthService.swift`, `RevenueCatService.swift`
- `Models/*` aus `supabase/types.ts`
- `Onboarding/OnboardingFlowView.swift` + Steps
- `Core/ShoppingGapCalculator.swift`, `SubscriptionRules.swift`
- `Camera/IngredientScanView.swift`, `BarcodeScannerView.swift`
- `Resources/Localizable.xcstrings`, `Assets.xcassets`

---

## Services-Übernahme

| TypeScript | Swift | Status |
|------------|-------|--------|
| `onboarding/utils.ts` | `MacroCalculator.swift` | ✅ |
| `shoppingGap.ts` | `ShoppingGapCalculator.swift` | ⏳ |
| `subscription.ts` | `SubscriptionRules.swift` | ⏳ |
| Supabase JS | supabase-swift | ⏳ |
| RevenueCat Capacitor | RevenueCat Swift | ⏳ |
| Edge Functions | HTTP (unverändert) | ✅ |

---

## Liquid Glass Regeln

1. Nur `.glassEffect()`, `GlassEffectContainer`, `.glassEffectID()`
2. Tab-Bar: Morphing nur auf aktivem Tab
3. Kein Glass hinter Fließtext
4. `.glassEffect()` als letzter Modifier
5. Reduce Transparency: System-Fallback, keine CSS-Workarounds

