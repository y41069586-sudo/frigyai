# Shared affiliate helpers (`affiliate.ts`)

Reference implementation for affiliate slug/code lookup and Stripe commission recording.

**All deployed edge functions use inlined code in their own `index.ts`** (Supabase Dashboard only uploads one file).

When changing affiliate logic, update:

- `stripe-webhook/index.ts` (full helpers + Stripe)
- `sync-affiliate-attribution/index.ts`
- `validate-referral-code/index.ts`
- `affiliate-admin/index.ts` (`normalizeSlug` only)
- `manage-referral-codes/index.ts` (`normalizeSlug` only)

Keep this `_shared/affiliate.ts` in sync as the canonical copy for copy-paste.
