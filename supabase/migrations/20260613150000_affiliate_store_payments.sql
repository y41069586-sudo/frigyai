-- Affiliate payments: App Store / Play Store via RevenueCat (no Stripe)

-- Idempotency key: was stripe_event_id, now payment_event_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'affiliate_payments'
      AND column_name = 'stripe_event_id'
  ) THEN
    ALTER TABLE public.affiliate_payments
      RENAME COLUMN stripe_event_id TO payment_event_id;
  END IF;
END $$;

-- Drop legacy Stripe columns (unused — billing is RevenueCat only)
ALTER TABLE public.affiliate_payments
  DROP COLUMN IF EXISTS stripe_session_id,
  DROP COLUMN IF EXISTS stripe_invoice_id,
  DROP COLUMN IF EXISTS stripe_customer_id;

-- Rename unique constraint if it still uses the old name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'affiliate_payments_stripe_event_unique'
  ) THEN
    ALTER TABLE public.affiliate_payments
      RENAME CONSTRAINT affiliate_payments_stripe_event_unique
      TO affiliate_payments_payment_event_unique;
  END IF;
END $$;

-- Store payment metadata
ALTER TABLE public.affiliate_payments
  ADD COLUMN IF NOT EXISTS payment_source TEXT NOT NULL DEFAULT 'store',
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS revenuecat_event_id TEXT,
  ADD COLUMN IF NOT EXISTS product_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Fix rows/migrations that used the old default
UPDATE public.affiliate_payments
SET payment_source = 'store'
WHERE payment_source = 'stripe';

ALTER TABLE public.affiliate_payments
  ALTER COLUMN payment_source SET DEFAULT 'store';

COMMENT ON COLUMN public.affiliate_payments.payment_event_id IS
  'Unique idempotency key, e.g. rc_<revenuecat_event_id>';
COMMENT ON COLUMN public.affiliate_payments.payment_source IS
  'app_store | play_store | store';
COMMENT ON COLUMN public.affiliate_payments.store_name IS
  'RevenueCat store: APP_STORE, PLAY_STORE';
COMMENT ON COLUMN public.affiliate_payments.revenuecat_event_id IS
  'RevenueCat webhook event id';
COMMENT ON COLUMN public.affiliate_payments.product_id IS
  'RevenueCat / store product id';
COMMENT ON COLUMN public.affiliate_payments.transaction_id IS
  'App Store or Play Store transaction id';

COMMENT ON COLUMN public.referral_codes.commission_rate_percent IS
  'Affiliate commission % on store subscription payments';

CREATE INDEX IF NOT EXISTS idx_affiliate_payments_source_created
  ON public.affiliate_payments (payment_source, created_at DESC);
