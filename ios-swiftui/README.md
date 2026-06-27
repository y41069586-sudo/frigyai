# Frigy iOS Native (SwiftUI) Rebuild

Native SwiftUI shell hosting the **full Frigy web app** via Capacitor (same React UI + native plugins as `ios-build`). SwiftUI scaffold code remains for incremental native screen ports.

## Requirements

- **Xcode 26**
- **Deployment target: iOS 26**
- **Node 22** (CI builds Vite `dist/` and bundles into the app)

## Codemagic (recommended)

Workflow **iOS Native SwiftUI Build** (`ios-swiftui-build`):

1. `npm run build` → Vite `dist/`
2. `cap sync ios` → copy `public/` + `capacitor.config.json` into `FrigyNative/`
3. XcodeGen + archive → TestFlight

Same env vars as **iOS Build** (`frigy` group + RevenueCat keys).

## Generate Xcode project (Mac, optional)

```bash
# From repo root — bundle web assets first:
npm ci --legacy-peer-deps && npm run build
bash scripts/codemagic-sync-web-for-native-ios.sh

cd ios-swiftui
cp Config/Secrets.xcconfig.example Config/Secrets.xcconfig
./scripts/generate-xcodeproj.sh
open FrigyNative.xcodeproj
```

Without `FrigyNative/public/`, the app falls back to the SwiftUI onboarding skeleton (dev only).

## Architecture (current)

| Layer | Files |
|-------|-------|
| Root routing | `Navigation/AppRouter.swift`, `RootView.swift` |
| Onboarding state machine | `Onboarding/OnboardingCoordinator.swift`, `OnboardingStep.swift` |
| Tabs + paths | `Navigation/MainTabCoordinator.swift`, `MainShellView.swift` |
| Tab roots | `Navigation/TabRoots.swift` |
| Deep links | `Navigation/DeepLinkParser.swift`, `Navigation/AppRoute.swift` |
| Auth spike | `Services/SupabaseAuthService.swift`, `Screens/AuthSpikeView.swift` |
| Glass UI | `Navigation/GlassTabBar.swift`, `GlassComponents.swift` |

See `docs/SWIFTUI_ARCHITECTURE_REPORT.md` and `docs/SWIFTUI_MIGRATION_PLAN.md`.

## Manual QA checklist

1. **Tab state:** Enter text in dashboard field → switch tabs → text must remain.
2. **Push:** “Push Profile” → back → switch tabs → path preserved per tab.
3. **Deep link:** Auth screen test buttons; Universal Link to `/profile`.
4. **Auth:** Apple Sign In + Google OAuth with real Supabase keys on device.

## Tests

```bash
# In Xcode: Product → Test (FrigyNativeTests)
```

Covers `DeepLinkParser` and `MainTabCoordinator` routing logic.
