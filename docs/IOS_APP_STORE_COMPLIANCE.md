# iOS App Store Compliance (Frigy)

## Xcode (on Mac, after `npm run build && npx cap sync ios`)

Open `ios/App/App.xcworkspace` or `npx cap open ios`, then **Signing & Capabilities**:

| Capability | Status in repo | Action in Xcode |
|------------|----------------|-----------------|
| Sign in with Apple | `App.entitlements` | Verify capability enabled |
| Push Notifications | `aps-environment` in entitlements | Enable + upload APNs key to Firebase/your push provider |
| In-App Purchase | RevenueCat SDK | Enable **In-App Purchase** capability |
| HealthKit | **Not used** | Do **not** add |
| App Groups | Only if you add widgets | Not required today |

Before **Archive / App Store**: set `aps-environment` to `production` in `App.entitlements` (or use separate entitlements for Release).

## Supabase Auth

1. **Authentication → Providers → Apple**: enable, add Services ID / secret from Apple Developer.
2. **URL Configuration → Redirect URLs**:
   - `frigy://callback`
   - `https://app.frigy.app/auth/callback`
   - Your local dev URL if needed

## Apple Developer

1. **Identifiers → App ID** `com.frigy.app`: Sign in with Apple, Push Notifications.
2. **Sign in with Apple → Configure**: Server-to-Server Notification Endpoint:
   - `https://<project-ref>.supabase.co/functions/v1/apple-signin-s2s`
3. **Subscriptions**: monthly/yearly products → RevenueCat (see `STORE_BILLING_SETUP.md`).

### Deploy Apple S2S function

```bash
supabase secrets set APPLE_CLIENT_ID=com.frigy.app
supabase secrets set APPLE_S2S_WEBHOOK_SECRET=<optional-bearer-secret>
supabase functions deploy apple-signin-s2s --no-verify-jwt
```

Handles `account-delete` and `consent-revoked` from Apple (deletes Supabase user + data).

Optional path alias `https://app.frigy.app/apple/s2s` → reverse-proxy to the same function.

## Review checklist

- [ ] Sign in with Apple visible when Google is offered (Auth screen)
- [ ] Restore Purchases on Profile (native builds)
- [ ] No Stripe payment links in native app for digital premium
- [ ] Privacy Policy URL in App Store Connect matches `VITE_PRIVACY_POLICY_URL`
- [ ] Account deletion in Profile works
- [ ] App launches without login (Landing / Onboarding)
- [ ] No HealthKit capability
- [ ] Sandbox subscription test on real device

## StoreKit 2

Handled by **RevenueCat** (`@revenuecat/purchases-capacitor`) on iOS 15+. No separate StoreKit code required.

## App Tracking Transparency

Not used (no IDFA). Do **not** add `NSUserTrackingUsageDescription` unless you add tracking SDKs.
