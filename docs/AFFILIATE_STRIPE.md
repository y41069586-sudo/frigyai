# Affiliate Tracking (ChottuLink + Stripe)

## Flow: `?ref=proml` → Stripe-Zahlung → Provision

1. Nutzer öffnet `frigy://signup?ref=proml` oder `https://app.frigy.app/signup?ref=proml`
2. App speichert `proml` in `localStorage` (`frigy_influencer_ref`)
3. Nach Login: Edge Function `sync-affiliate-attribution` → DB `affiliate_attributions` (first-touch)
4. Vor Stripe Checkout: `client_reference_id=frigy_{userId}_proml` an Payment Link
5. Stripe Webhook `checkout.session.completed` / `invoice.payment_succeeded`:
   - Premium aktivieren
   - Zahlung in `affiliate_payments` buchen
   - Stripe Customer Metadata: `affiliate_ref=proml`
   - Umsatz/Provision in `referral_codes` aggregieren

## ChottuLink Destination URL

```
frigy://signup?ref={ref}
```

Web-Fallback: `https://app.frigy.app/signup?ref={ref}`

## Partner anlegen (Admin)

- Code: 6 Zeichen (z. B. `PROMO1`)
- Slug: ChottuLink-Ref (z. B. `proml`) — **muss** zum Slug im Link passen
- Provision %: Standard 20

Migration legt Beispiel an: `code=PROMO1`, `slug=proml`.

## Stripe Dashboard

### Webhook-Events

Endpoint: `https://mcabsjuamjgkvfljkfit.supabase.co/functions/v1/stripe-webhook`

Events:

- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Secret: `STRIPE_WEBHOOK_SECRET` in Supabase Secrets.

### Payment Links

URL-Parameter werden von der App gesetzt:

- `prefilled_email`
- `client_reference_id` (Format `frigy_{uuid}_{slug}`)

Optional in Stripe Dashboard unter Payment Link → Metadata (statisch nur für Tests).

## Deploy

```bash
npx supabase db push
npx supabase functions deploy sync-affiliate-attribution
npx supabase functions deploy affiliate-admin
npx supabase functions deploy stripe-webhook
npx supabase functions deploy validate-referral-code
npx supabase functions deploy manage-referral-codes
```

## Deferred Deep Linking

- Web-Klick vor Install: `frigy_deferred_ref` in localStorage
- Erster nativer Start: `applyDeferredReferralOnFirstOpen()` → Ref übernehmen
- Nach Registrierung: `sync-affiliate-attribution`

Für Store-Install ohne Web-Session: ChottuLink Deferred SDK (optional) laut [ChottuLink Docs](https://docs.chottulink.com).

## Admin Reporting

`affiliate-admin` → `revenue_report`: Umsatz & Provision pro Influencer.

UI: Admin → Empfehlungscodes (nur Referral-Admin-E-Mail).
