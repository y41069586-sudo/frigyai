# Frigy iOS Native (SwiftUI) Rebuild

This folder contains the native SwiftUI rebuild scaffold for Frigy.

## Scope

- Full iOS app rewrite in SwiftUI (replacing Capacitor WebView app on iOS).
- Backend remains Supabase + RevenueCat.
- Feature parity target with current React/Capacitor app.

## Requirements

- **Xcode 26**
- **Deployment target: iOS 26** (required for `.glassEffect()`, `GlassEffectContainer`, `glassEffectID`)

When creating the Xcode project, set **iOS Deployment Target** to **26.0** under target → General → Minimum Deployments.

## Current status

Scaffold only (architecture + core app shell):

- `FrigyNativeApp.swift` app entry
- Root routing (auth/onboarding/main tabs)
- Native tab shell with **Liquid Glass morphing tab bar** (`GlassTabBar`, no `TabView`)
- Service protocols + placeholder implementations
- `GlassComponents.swift` — reusable Liquid Glass UI (native iOS 26 APIs only)
- `MainShellView.swift` — Home / Plans / Shopping + tracker sheet
- `Core/MacroCalculator.swift` — port of onboarding macro math
- Migration plan: `docs/SWIFTUI_MIGRATION_PLAN.md`

### Liquid Glass guidelines (iOS 26)

- Use `.glassEffect()`, `GlassEffectContainer`, and `.glassEffectID()` only — no `.ultraThinMaterial` or custom blur stacks.
- Apply `.glassEffect()` as the **last** modifier on a view.
- Put adjacent glass controls in a `GlassEffectContainer` so surfaces merge correctly; do not stack glass on glass.
- Reserve glass for functional chrome (buttons, toolbars, navigation, overlays), not body text backgrounds.
- Test with **Settings → Accessibility → Display & Text Size → Reduce Transparency** enabled; labels and controls must stay readable (system APIs handle the fallback).

## Next milestones

1. Create Xcode project (iOS 26 target) and wire these files into target.
2. Implement auth (Supabase session, signup/signin, Apple Sign-In).
3. Implement premium/paywall + restore purchases via RevenueCat.
4. Implement dashboard + tracker + meal plan screens.
5. Implement camera/scan flow.
6. Migration QA and App Store rollout.
