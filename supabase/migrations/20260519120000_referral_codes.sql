-- Influencer / Empfehlungscodes → kostenloses Premium über subscription_cache
-- Code = genau 6 Zeichen (Buchstaben/Zahlen), wie in der App (6 Eingabefelder)
-- duration_days = 0 bedeutet lebenslanges Premium

CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  influencer_name TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_redemptions INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_codes_code_unique UNIQUE (code),
  CONSTRAINT referral_codes_code_format CHECK (char_length(code) = 6)
);

CREATE INDEX idx_referral_codes_code_upper ON public.referral_codes (upper(code));

CREATE TABLE public.referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_redemptions_user_unique UNIQUE (user_id)
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

-- Nur Service Role (Edge Functions) verwaltet Codes
CREATE POLICY "Service role manages referral codes"
ON public.referral_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages referral redemptions"
ON public.referral_redemptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Nutzer sehen nur die eigene Einlösung
CREATE POLICY "Users read own referral redemption"
ON public.referral_redemptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE public.referral_codes IS 'Influencer promo codes; redeemed via redeem-referral-code edge function';

-- Beispiel-Codes (anpassen / weitere per Admin oder SQL einfügen)
INSERT INTO public.referral_codes (code, influencer_name, duration_days, max_redemptions, active)
VALUES
  ('DEMO01', 'Demo Influencer', 30, 500, true),
  ('VIP001', 'VIP Partner', 365, 100, true);
