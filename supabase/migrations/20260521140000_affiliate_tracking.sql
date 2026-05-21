-- ChottuLink / Stripe affiliate: slug (proml), attributions, revenue & commissions

ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS commission_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS total_revenue_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_commission_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_payments INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_codes_slug_lower
  ON public.referral_codes (lower(slug))
  WHERE slug IS NOT NULL;

ALTER TABLE public.referral_codes
  ADD CONSTRAINT referral_codes_slug_format CHECK (
    slug IS NULL OR (char_length(slug) >= 3 AND char_length(slug) <= 20)
  );

COMMENT ON COLUMN public.referral_codes.slug IS 'ChottuLink ?ref= slug, e.g. proml';
COMMENT ON COLUMN public.referral_codes.commission_rate_percent IS 'Affiliate commission % on Stripe payments';

-- First-touch attribution per user (used for Stripe metadata & commissions)
CREATE TABLE IF NOT EXISTS public.affiliate_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE RESTRICT,
  affiliate_slug TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'deep_link',
  deferred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_payment_at TIMESTAMPTZ,
  CONSTRAINT affiliate_attributions_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_slug
  ON public.affiliate_attributions (lower(affiliate_slug));

CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_code
  ON public.affiliate_attributions (referral_code_id);

-- Stripe payments attributed to influencers
CREATE TABLE IF NOT EXISTS public.affiliate_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_slug TEXT NOT NULL,
  stripe_event_id TEXT NOT NULL,
  stripe_session_id TEXT,
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  commission_rate_percent NUMERIC(5, 2) NOT NULL,
  commission_cents INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  commission_status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_payments_stripe_event_unique UNIQUE (stripe_event_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payments_code_created
  ON public.affiliate_payments (referral_code_id, created_at DESC);

ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages affiliate attributions"
ON public.affiliate_attributions FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Users read own affiliate attribution"
ON public.affiliate_attributions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages affiliate payments"
ON public.affiliate_payments FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Example: ChottuLink ?ref=proml
INSERT INTO public.referral_codes (
  code, slug, influencer_name, duration_days, commission_rate_percent, max_redemptions, active
)
VALUES ('PROMO1', 'proml', 'Prom Influencer', 30, 20.00, NULL, true)
ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  influencer_name = EXCLUDED.influencer_name,
  commission_rate_percent = EXCLUDED.commission_rate_percent;
