# SwiftUI Architecture Report (Post-Refactor)

**Branch:** `cursor/swiftui-architecture-refactor-e370`  
**Date:** Architecture refactor after review — UI ports paused.

---

## Executive Summary

The SwiftUI scaffold now has a **production-oriented navigation foundation**:

| Component | Status |
|-----------|--------|
| Xcode 26 project scaffold (`project.yml` + generate script) | ✅ Ready for Mac/Xcode |
| `AppRouter` (root routes + deep links + auth bootstrap) | ✅ |
| `MainTabCoordinator` (per-tab `NavigationPath`) | ✅ |
| `TabView` with hidden system tab bar (state preservation) | ✅ |
| Typed routes (`HomeRoute`, `PlansRoute`, `ShoppingRoute`, `AppDeepLink`) | ✅ |
| `DeepLinkParser` (frigy:// + Universal Links) | ✅ |
| Auth spike (Supabase, Apple, OAuth, session restore) | ⚠️ Spike — needs device QA |
| Unit tests (deep links + coordinator) | ✅ |

---

## Architecture Diagram

```
FrigyNativeApp
└── AppRouter (@Observable, environment)
    ├── rootRoute: loading | onboarding | auth | main
    ├── authService: SupabaseAuthService | MockAuthService
    ├── pendingDeepLink queue
    └── MainTabCoordinator
        ├── selectedTab
        ├── homePath / plansPath / shoppingPath
        └── showTrackerSheet

RootView → switch rootRoute
MainShellView → TabView(hidden tab bar) + GlassTabBar overlay
  ├── HomeTabRoot → NavigationStack(homePath) → HomeDashboardView → push HomeRoute
  ├── PlansTabRoot → NavigationStack(plansPath)
  └── ShoppingTabRoot → NavigationStack(shoppingPath)
```

---

## Verification Checklist

### Navigation state preserved on tab switch?

**Design:** ✅ Yes — `TabView` keeps each tab root alive; `@State` (e.g. `draftNote`) and `NavigationPath` are owned by the coordinator / tab root, not recreated by a `switch`.

**Manual QA on device (required):**
1. Type text in Home “State preservation test” field.
2. Switch to Plans → Shopping → back to Home.
3. Confirm text remains and `tabActivationCounts` increments only once per first appear (not full re-init every switch).

### Push navigation across tabs?

**Design:** ✅ Yes — `MainTabCoordinator.pushHome/.pushPlans/.pushShopping` sets `selectedTab` and appends to the correct path.

**Deep links:** ✅ `AppRouter.handle(deepLink:)` → `tabCoordinator.open(_:)` maps:
- `https://app.frigy.app/profile` → Home + push `.profile`
- `?tab=shopping` → select Shopping tab
- `?logMeal=1` → tracker sheet

**Manual QA:** Use Auth spike “Deep Link Tests” buttons + Safari Universal Link to `https://app.frigy.app/profile`.

### Suitable for 50+ screens?

**Design:** ✅ With caveats — pattern scales if every new screen is:
1. A new case on a tab `*Route` enum, or
2. A root-level `AppRoute` case (onboarding, paywall modal).

**Still needed before mass UI port:**
- `OnboardingCoordinator` with its own `NavigationPath` / step enum
- Modal/sheet router (paywall, camera, chatbot)
- Optional `NavigationSplitView` for iPad

---

## Xcode Project

Generate on Mac with Xcode 26:

```bash
cd ios-swiftui
cp Config/Secrets.xcconfig.example Config/Secrets.xcconfig
# Fill SUPABASE_URL + SUPABASE_ANON_KEY
./scripts/generate-xcodeproj.sh
open FrigyNative.xcodeproj
```

Dependencies: **supabase-swift** (Auth + Supabase products).

---

## Auth Spike Scope

| Feature | Implementation | Verified |
|---------|----------------|----------|
| Session restore | `client.auth.session` on bootstrap | ⏳ Device |
| Apple Sign In | ASAuthorization + `signInWithIdToken` + nonce | ⏳ Device + Supabase Apple provider |
| Google OAuth | ASWebAuthenticationSession + `frigy://callback` | ⏳ Device |
| OAuth callback | `session(from: url)` | ⏳ Device |
| Universal Links | `applinks:app.frigy.app` entitlement + `DeepLinkParser` | ⏳ Apple Developer + AASA file |

Uses `MockAuthService` when `Secrets.xcconfig` still has placeholder keys.

---

## Remaining P0 Blockers Before Phase 3 (Onboarding)

| # | Blocker | Why P0 |
|---|---------|--------|
| 1 | **First successful Xcode 26 build on Mac** | Cannot validate Glass, Auth, or navigation on device |
| 2 | **Real Supabase keys in Secrets.xcconfig** | Auth spike runs mock without them |
| 3 | **Apple Sign In: Supabase provider + bundle ID `com.frigyapp.app`** | Native id_token rejection otherwise |
| 4 | **OAuth redirect `frigy://callback` registered in Supabase** | Google OAuth fails |
| 5 | **Universal Links AASA on `app.frigy.app`** | HTTPS deep links won’t open app |
| 6 | **`OnboardingCoordinator` design** | 57 steps need state machine before UI port |
| 7 | **Referral deep link → onboarding state** | `pendingReferralCode` storage exists but no coordinator |
| 8 | **End-to-end auth QA** | Apple + Google + session restore on TestFlight build |

---

## Remaining P0 Blockers Before Phase 4 (RevenueCat)

| # | Blocker | Why P0 |
|---|---------|--------|
| 1 | **Stable authenticated user UUID** | RC must `logIn(supabaseUserId)` |
| 2 | **`SubscriptionService` real implementation** | Still mock |
| 3 | **`sync-store-subscription` Edge Fn parity** | Server premium cache |
| 4 | **Paywall routing in `AppRouter`** | Post-auth / post-onboarding paywall paths |
| 5 | **Restore purchases + App Store review copy** | Required for review |
| 6 | **Trial eligibility port** | `trialEligibility.ts` rules |
| 7 | **Premium gate overlay architecture** | Blocks scan/meal plan without navigation plan |

---

## Recommended Next Steps (no UI ports)

1. Run `./scripts/generate-xcodeproj.sh` on Mac; fix compile errors against supabase-swift API.
2. Device QA: tab state preservation + deep link buttons + OAuth callback.
3. Implement `OnboardingCoordinator` skeleton (step enum + persistence only).
4. Implement `RevenueCatService` stub with `logIn(userId)` wired to auth session.
5. Add modal route channel to `AppRouter` (paywall, camera).

