-- Extend affiliate payments for App Store / Play Store (RevenueCat) commissions

ALTER TABLE public.affiliate_payments
  ADD COLUMN IF NOT EXISTS payment_source TEXT NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS revenuecat_event_id TEXT;

COMMENT ON COLUMN public.affiliate_payments.stripe_event_id IS
  'Unique idempotency key: Stripe evt_* or RevenueCat rc_*';
COMMENT ON COLUMN public.affiliate_payments.payment_source IS
  'stripe | app_store | play_store';
COMMENT ON COLUMN public.affiliate_payments.store_name IS
  'RevenueCat store: APP_STORE, PLAY_STORE, STRIPE, …';

CREATE INDEX IF NOT EXISTS idx_affiliate_payments_source_created
  ON public.affiliate_payments (payment_source, created_at DESC);
