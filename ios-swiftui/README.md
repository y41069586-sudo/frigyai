# Frigy iOS Native (SwiftUI) Rebuild

This folder contains the native SwiftUI rebuild scaffold for Frigy.

## Scope

- Full iOS app rewrite in SwiftUI (replacing Capacitor WebView app on iOS).
- Backend remains Supabase + RevenueCat.
- Feature parity target with current React/Capacitor app.

## Current status

Scaffold only (architecture + core app shell):

- `FrigyNativeApp.swift` app entry
- Root routing (auth/onboarding/main tabs)
- Native tab shell
- Service protocols + placeholder implementations

## Next milestones

1. Create Xcode project and wire these files into target.
2. Implement auth (Supabase session, signup/signin, Apple Sign-In).
3. Implement premium/paywall + restore purchases via RevenueCat.
4. Implement dashboard + tracker + meal plan screens.
5. Implement camera/scan flow.
6. Migration QA and App Store rollout.
