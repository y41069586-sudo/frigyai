# Frigy iOS Native (SwiftUI) Rebuild

Native SwiftUI app replacing the Capacitor WebView on iOS. **UI feature ports are paused** until navigation/auth architecture is validated on device.

## Requirements

- **Xcode 26**
- **Deployment target: iOS 26**

## Generate Xcode project (Mac)

```bash
cd ios-swiftui
cp Config/Secrets.xcconfig.example Config/Secrets.xcconfig
# Set SUPABASE_URL and SUPABASE_ANON_KEY
./scripts/generate-xcodeproj.sh
open FrigyNative.xcodeproj
```

## Architecture (current)

| Layer | Files |
|-------|-------|
| Root routing | `Navigation/AppRouter.swift`, `RootView.swift` |
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
