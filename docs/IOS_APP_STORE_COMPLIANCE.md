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
2. **Client IDs (wichtig für native iOS-App):**  
   Native Sign in with Apple sendet ein Token mit **Bundle ID** als Audience (`com.frigyapp.app`).  
   Unter **Client IDs** muss diese Bundle ID stehen — **zusätzlich** zur Services ID für Web-OAuth, kommagetrennt, z. B.:
   ```
   com.frigyapp.app,dein.apple.services.id
   ```
   Ohne `com.frigyapp.app` erscheint nach Apple-Login:  
   `Login failed — Unacceptable audience in id_token: [com.frigyapp.app]`
3. **Skip nonce check (falls „Nonces mismatch“):**  
   Bekannter GoTrue-Bug: Apple nutzt base64url im ID-Token, GoTrue vergleicht hex ([supabase/auth#2378](https://github.com/supabase/auth/issues/2378)).  
   In **Authentication → Providers → Apple** ggf. **Skip nonce check** aktivieren (hosted Dashboard), oder die App sendet keinen Nonce (native iOS in `appleSignIn.ts`).
4. **URL Configuration → Redirect URLs**:
   - `frigy://callback`
   - `https://app.frigy.app/auth/callback`
   - Your local dev URL if needed

## Apple Developer

1. **Identifiers → App ID** `com.frigyapp.app`: Sign in with Apple, Push Notifications.
2. **Sign in with Apple → Configure**: Server-to-Server Notification Endpoint:
   - `https://<project-ref>.supabase.co/functions/v1/apple-signin-s2s`
3. **Subscriptions**: monthly/yearly products → RevenueCat (see `STORE_BILLING_SETUP.md`).

### Deploy Apple S2S function

```bash
supabase secrets set APPLE_CLIENT_ID=com.frigyapp.app
supabase secrets set APPLE_S2S_WEBHOOK_SECRET=<optional-bearer-secret>
supabase functions deploy apple-signin-s2s --no-verify-jwt
```

Handles `account-delete` and `consent-revoked` from Apple (deletes Supabase user + data).

Optional path alias `https://app.frigy.app/apple/s2s` → reverse-proxy to the same function.

## Review checklist

- [x] Sign in with Apple visible when Google is offered (Auth screen)
- [x] Restore Purchases on Paywall + Profile (native builds)
- [x] No external payment links in native app for digital premium
- [x] Privacy Policy + Terms links on subscription paywall (Guideline 3.1.2)
- [x] Auto-renewal disclosure on paywall (store + web copy)
- [ ] Privacy Policy URL in App Store Connect matches `VITE_PRIVACY_POLICY_URL`
- [ ] Account deletion in Profile works (deploy `delete-user` Edge Function)
- [x] App launches without login (Onboarding first)
- [x] No HealthKit capability
- [ ] Sandbox subscription test on real device before submit
- [ ] App Store prices: monthly **€9,99** (3-day free trial), yearly **€36,95** — match paywall + ASC
- [x] No Apple Health / Google Fit claims in UI
- [x] Minimum age 13+ enforced in onboarding birthdate step
- [x] AI / medical / allergen disclaimers on scan, chat, meal plan, meal detail
- [x] Paywall sign-out for reviewers on wrong account
- [x] No mock dashboard meals when plan is empty
- [x] Native builds use store billing only (RevenueCat)
- [x] Android: removed SCHEDULE_EXACT_ALARM permission
- [x] iOS permission strings in English for App Review
- [ ] RevenueCat keys in Codemagic (`VITE_REVENUECAT_API_KEY_IOS` / `ANDROID`) — build fails without them
- [ ] In-App Purchase capability enabled in Xcode

## App Review Information (copy into App Store Connect)

Paste into **App Review Information → Notes** (English):

```
Frigy is a nutrition & meal-planning app. Premium is required after onboarding.

How to test subscriptions (Sandbox):
1. Complete onboarding (you may skip camera/notifications).
2. Sign up with email or Sign in with Apple.
3. On the paywall, tap "Start my 3-day free trial" (monthly) or choose yearly.
4. Sign in with a Sandbox Apple ID when prompted.
5. After purchase, the app opens the dashboard automatically.
6. To restore: tap "Restore Purchases" on the paywall or Profile → Restore Purchases.

Demo account (optional, if you prefer email login):
Email: [YOUR_REVIEW_EMAIL]
Password: [YOUR_REVIEW_PASSWORD]
(Pre-subscribe this account in Sandbox, or use Restore Purchases after Sandbox IAP.)

Legal links in app: Paywall footer → Terms of Service / Privacy Policy.
Account deletion: Profile → Delete Account.

No medical advice — informational nutrition tracking only.
```

For **Google Play → App content → App access**, provide the same steps and a test account if login is required.

## StoreKit 2

Handled by **RevenueCat** (`@revenuecat/purchases-capacitor`) on iOS 15+. No separate StoreKit code required.

## App Tracking Transparency

Not used (no IDFA). Do **not** add `NSUserTrackingUsageDescription` unless you add tracking SDKs.
