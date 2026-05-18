import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type ReferralCodeStepProps = {
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#20D86B",
  primaryDark: "#0EA84E",
  bg: "#FFFFFF",
  chip: "#F4F7EF",
  text: "#050505",
  muted: "#3F3F46",
};

const CODE_LENGTH = 6;

export function ReferralCodeStep({ onBack, onNext }: ReferralCodeStepProps) {
  const { language } = useLanguage();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const L = {
    de: {
      title: "EIN FREUND LÄDT DICH EIN",
      subtitle: "Gib deinen Empfehlungscode ein, sonst überspringen.",
      label: "Empfehlungscode",
      skip: "Nicht jetzt",
      next: "Weiter",
      back: "Zurück",
    },
    en: {
      title: "A FRIEND INVITED YOU",
      subtitle: "Enter your referral code, or skip this step.",
      label: "Referral code",
      skip: "Not now",
      next: "Next",
      back: "Back",
    },
    fr: {
      title: "UN AMI T'INVITE",
      subtitle: "Saisis ton code de parrainage, ou ignore cette étape.",
      label: "Code de parrainage",
      skip: "Pas maintenant",
      next: "Suivant",
      back: "Retour",
    },
  } as const;

  const t = L[language as keyof typeof L] ?? L.de;

  const finish = () => {
    const value = code.join("").trim().toUpperCase();
    if (value) {
      localStorage.setItem("frigy_referral_code", value);
    }
    onNext?.();
  };

  const updateDigit = (index: number, value: string) => {
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
    event.preventDefault();
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

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden" style={{ backgroundColor: PALETTE.bg }}>
      <div className="flex shrink-0 items-center px-6 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)]">
        {onBack ? (
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
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[360px] text-[30px] font-black uppercase leading-[1.04] tracking-[-0.055em] min-[390px]:text-[32px]"
          style={{ color: PALETTE.text }}
        >
          {t.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="mt-4 max-w-[330px] text-[18px] font-medium leading-snug tracking-[-0.035em]"
          style={{ color: PALETTE.muted }}
        >
          {t.subtitle}
        </motion.p>

        <div className="mt-12">
          <p className="mb-5 text-[18px] font-bold tracking-[-0.035em]" style={{ color: PALETTE.text }}>
            {t.label}
          </p>
          <div className="grid grid-cols-6 gap-2.5">
            {code.map((char, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputsRef.current[index] = node;
                }}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={1}
                value={char}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                aria-label={`${t.label} ${index + 1}`}
                className="h-[54px] min-w-0 rounded-none border-0 text-center text-[22px] font-bold uppercase outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(32,216,107,0.22)]"
                style={{ backgroundColor: PALETTE.chip, color: PALETTE.text }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.75rem)] pt-2">
        <div className="flex w-full overflow-hidden rounded-[25px] border-[3px] border-neutral-950 bg-white">
          <button
            type="button"
            onClick={onNext}
            className="flex h-[54px] min-w-0 flex-1 items-center justify-center bg-white px-3 text-[17px] font-medium tracking-[-0.02em] text-neutral-950"
          >
            {t.skip}
          </button>
          <button
            type="button"
            onClick={finish}
            className="flex h-[54px] min-w-0 flex-1 items-center justify-center px-3 text-[17px] font-medium tracking-[-0.02em] text-white"
            style={{ backgroundColor: PALETTE.primary }}
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
}
