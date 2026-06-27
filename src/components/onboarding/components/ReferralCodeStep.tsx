import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  savePendingReferralCode,
  redeemReferralCode,
  validateReferralCode,
} from "@/lib/referralCode";
import { getStoredInfluencerRef } from "@/lib/referralAttribution";
import { OnboardingOtpCell } from "./OnboardingManualInput";

type ReferralCodeStepProps = {
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  bg: "#FBFFFD",
  chip: "#F4F7EF",
  text: "#050505",
  muted: "#3F3F46",
  error: "#DC2626",
};

const CODE_LENGTH = 6;

type StepPhase = "input" | "validating" | "check" | "success";

export function ReferralCodeStep({ onBack, onNext }: ReferralCodeStepProps) {
  const { language } = useLanguage();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [phase, setPhase] = useState<StepPhase>("input");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const validatingRef = useRef(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    const stored = getStoredInfluencerRef();
    const seed = (fromUrl || stored || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, CODE_LENGTH);
    if (seed.length >= 3) {
      const chars = seed.split("");
      setCode([
        chars[0] ?? "",
        chars[1] ?? "",
        chars[2] ?? "",
        chars[3] ?? "",
        chars[4] ?? "",
        chars[5] ?? "",
      ]);
    }
  }, []);

  const L = {
    de: {
      title: "EIN FREUND LÄDT DICH EIN",
      label: "Empfehlungscode",
      invalid: "Ungültig",
      empty: "Bitte Code eingeben oder „Nicht jetzt“ wählen",
      successTitle: "Code erkannt!",
      successBody: "Dein Partner wurde gespeichert. Als Nächstes wählst du dein Premium-Abo.",
      skip: "Nicht jetzt",
      next: "Weiter",
      back: "Zurück",
    },
    en: {
      title: "A FRIEND INVITED YOU",
      label: "Referral code",
      invalid: "Invalid",
      empty: "Enter a code or choose “Not now”",
      successTitle: "Code recognized!",
      successBody: "Your partner was saved. Next, choose your Premium subscription.",
      skip: "Not now",
      next: "Next",
      back: "Back",
    },
    fr: {
      title: "UN AMI T'INVITE",
      label: "Code de parrainage",
      invalid: "Invalide",
      empty: "Saisis un code ou choisis « Pas maintenant »",
      successTitle: "Code reconnu !",
      successBody: "Ton partenaire est enregistré. Ensuite, choisis ton abonnement Premium.",
      skip: "Pas maintenant",
      next: "Suivant",
      back: "Retour",
    },
  } as const;

  const t = L[language as keyof typeof L] ?? L.de;

  const codeValue = code.join("").trim().toUpperCase();

  const runSuccessFlow = useCallback(
    (name: string | null | undefined) => {
      setPartnerName(name?.trim() || null);
      setFieldError(null);
      setPhase("check");
      window.setTimeout(() => setPhase("success"), 700);
      window.setTimeout(() => onNext?.(), 2800);
    },
    [onNext],
  );

  const validateAndProceed = useCallback(
    async (value: string) => {
      if (validatingRef.current) return;
      validatingRef.current = true;
      setPhase("validating");
      setFieldError(null);

      const result = await validateReferralCode(value);

      if (!result.valid) {
        setPhase("input");
        setFieldError(t.invalid);
        validatingRef.current = false;
        return;
      }

      savePendingReferralCode(value);
      const partner = result.influencer_name;

      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) {
        const redeem = await redeemReferralCode(accessToken, value);
        validatingRef.current = false;
        if (!redeem.success && !redeem.already_redeemed) {
          setPhase("input");
          setFieldError(t.invalid);
          return;
        }
      } else {
        validatingRef.current = false;
      }

      runSuccessFlow(partner);
    },
    [runSuccessFlow, t.invalid],
  );

  useEffect(() => {
    if (codeValue.length === CODE_LENGTH && phase === "input" && !fieldError) {
      void validateAndProceed(codeValue);
    }
  }, [codeValue, phase, fieldError, validateAndProceed]);

  const handleSkip = () => {
    if (phase === "success" || phase === "check" || phase === "validating") return;
    setFieldError(null);
    onNext?.();
  };

  const handleWeiter = () => {
    if (phase === "success" || phase === "check" || phase === "validating") return;

    if (codeValue.length === 0) {
      setFieldError(t.empty);
      return;
    }

    if (codeValue.length < CODE_LENGTH) {
      setFieldError(t.invalid);
      return;
    }

    void validateAndProceed(codeValue);
  };

  const updateDigit = (index: number, value: string) => {
    if (phase !== "input") return;
    setFieldError(null);
    const nextValue = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...code];
    next[index] = nextValue;
    setCode(next);

    if (nextValue && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (phase !== "input") return;
    event.preventDefault();
    setFieldError(null);
    const pasted = event.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, CODE_LENGTH)
      .toUpperCase()
      .split("");

    if (!pasted.length) return;

    const next = Array(CODE_LENGTH).fill("");
    pasted.forEach((char, index) => {
      next[index] = char;
    });
    setCode(next);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const inputsDisabled = phase !== "input";
  const showCheckOnInputs = phase === "check" || phase === "success";

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden" style={{ backgroundColor: PALETTE.bg }}>
      <AnimatePresence>
        {phase === "success" && (
          <motion.div
            key="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8"
            style={{ backgroundColor: PALETTE.bg }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative mb-8 flex h-[120px] w-[120px] items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(110, 240, 168, 0.12)" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 16 }}
                className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-[4px]"
                style={{ borderColor: PALETTE.primary, backgroundColor: "#FBFFFD" }}
              >
                <Check className="h-11 w-11" strokeWidth={3} style={{ color: PALETTE.primary }} />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: PALETTE.primary }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.45, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
              />
            </motion.div>

            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-center"
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
                style={{ backgroundColor: "rgba(110, 240, 168, 0.15)", color: PALETTE.primaryDark }}>
                <Check className="h-4 w-4" />
                Partner
              </div>
              <h2 className="text-[28px] font-black uppercase leading-tight tracking-[-0.04em]" style={{ color: PALETTE.text }}>
                {t.successTitle}
              </h2>
              <p className="mt-3 max-w-[300px] text-[17px] font-medium leading-snug" style={{ color: PALETTE.muted }}>
                {t.successBody}
              </p>
              {partnerName ? (
                <p className="mt-2 text-[15px] font-semibold" style={{ color: PALETTE.primaryDark }}>
                  {partnerName}
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex shrink-0 items-center px-6 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)]">
        {onBack && phase === "input" ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label={t.back}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: PALETTE.chip, color: PALETTE.text }}
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={2.8} />
          </motion.button>
        ) : (
          <div className="h-12 w-12 shrink-0" aria-hidden />
        )}
      </div>

      <div className="min-h-0 flex-1 px-6 pt-4">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[360px] text-[30px] font-black uppercase leading-[1.04] tracking-[-0.055em] min-[390px]:text-[32px]"
          style={{ color: PALETTE.text }}
        >
          {t.title}
        </motion.h1>

        <div className="mt-10">
          <p className="mb-5 text-[18px] font-bold tracking-[-0.035em]" style={{ color: PALETTE.text }}>
            {t.label}
          </p>

          <div className="relative grid grid-cols-6 gap-2">
            {code.map((char, index) => (
              <div key={index} className="relative">
                <OnboardingOtpCell
                  ref={(node) => {
                    inputsRef.current[index] = node;
                  }}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  maxLength={1}
                  value={char}
                  disabled={inputsDisabled}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  aria-label={`${t.label} ${index + 1}`}
                  aria-invalid={!!fieldError}
                  hasError={!!fieldError}
                  success={showCheckOnInputs}
                />
              </div>
            ))}

            <AnimatePresence>
              {showCheckOnInputs && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="pointer-events-none absolute -right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-[3px] bg-white"
                  style={{ borderColor: PALETTE.primary }}
                >
                  <Check className="h-5 w-5" strokeWidth={3} style={{ color: PALETTE.primary }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {fieldError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-center text-[13px] font-medium"
                style={{ color: PALETTE.error }}
              >
                {fieldError}
              </motion.p>
            )}
          </AnimatePresence>

          {phase === "validating" && (
            <p className="mt-3 text-center text-[13px] font-medium text-[#6B7280]">…</p>
          )}
        </div>
      </div>

      {phase !== "success" && (
        <div className="shrink-0 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.75rem)] pt-2">
          <div className="flex w-full overflow-hidden rounded-[25px] border-[3px] border-neutral-950 bg-white">
            <button
              type="button"
              onClick={handleSkip}
              disabled={phase === "validating" || phase === "check"}
              className="flex h-[54px] min-w-0 flex-1 items-center justify-center bg-white px-3 text-[17px] font-medium tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
            >
              {t.skip}
            </button>
            <button
              type="button"
              onClick={handleWeiter}
              disabled={phase === "validating" || phase === "check"}
              className="flex h-[54px] min-w-0 flex-1 items-center justify-center px-3 text-[17px] font-medium tracking-[-0.02em] text-white disabled:opacity-60"
              style={{ backgroundColor: PALETTE.primary }}
            >
              {t.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
