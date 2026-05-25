import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Dispatch, SetStateAction } from "react";
import type { UserData } from "../types";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  bg: "#F2FFF8",
  selectedBg: "#DCFEEF",
  border: "#6EECC0",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const daysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

const MIN_AGE = 13;
const MAX_AGE = 100;

const formatBirthdateValue = (birthdate: { day: number; month: number; year: number }) =>
  `${String(birthdate.day).padStart(2, "0")}.${String(birthdate.month).padStart(2, "0")}.${birthdate.year}`;

const sanitizeBirthdateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts: string[] = [];

  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));

  return parts.join(".");
};

const calculateAgeFromBirthdate = (day: number, month: number, year: number) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
};

const parseBirthdateInput = (value: string) => {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    return null;
  }

  const [dayString, monthString, yearString] = value.split(".");
  const day = Number(dayString);
  const month = Number(monthString);
  const year = Number(yearString);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  const today = new Date();
  const maxYear = today.getFullYear() - MIN_AGE;
  const minYear = today.getFullYear() - MAX_AGE;

  if (year < minYear || year > maxYear) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  const maxDay = daysInMonth(month, year);
  if (day < 1 || day > maxDay) {
    return null;
  }

  const age = calculateAgeFromBirthdate(day, month, year);
  if (age < MIN_AGE || age > MAX_AGE) {
    return null;
  }

  return { day, month, year, age };
};

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

export function BirthdateSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: Props) {
  const { language, t } = useLanguage();
  const [birthdateInput, setBirthdateInput] = useState("");

  useEffect(() => {
    if (!userData.birthdate) {
      setBirthdateInput("");
      return;
    }

    setBirthdateInput(formatBirthdateValue(userData.birthdate));
  }, [userData.birthdate]);

  const title =
    language === "de"
      ? "Wann bist du geboren?"
      : language === "fr"
        ? "Quand es-tu né(e) ?"
        : "When were you born?";

  const placeholder = "16.05.2002";
  const helperText =
    language === "de"
      ? "Format: TT.MM.JJJJ"
      : language === "fr"
        ? "Format : JJ.MM.AAAA"
        : "Format: DD.MM.YYYY";
  const errorText =
    language === "de"
      ? "Bitte gib ein gueltiges Geburtsdatum ein."
      : language === "fr"
        ? "Entre une date de naissance valide."
        : "Enter a valid birth date.";

  const parsedBirthdate = parseBirthdateInput(birthdateInput);
  const canProceed = Boolean(parsedBirthdate);

  const handleBirthdateChange = (raw: string) => {
    const nextValue = sanitizeBirthdateInput(raw);
    setBirthdateInput(nextValue);

    const parsed = parseBirthdateInput(nextValue);
    if (!parsed) return;

    setUserData({
      ...userData,
      birthdate: {
        day: parsed.day,
        month: parsed.month,
        year: parsed.year,
      },
      age: parsed.age,
    });
  };

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* â”€â”€ Top bar: back + progress â”€â”€ */}
      <div className="flex shrink-0 items-center px-5 pb-1 pt-[calc(env(safe-area-inset-top,0px)+1.375rem)]">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="ZurÃ¼ck"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#F2FFF8",
              color: PALETTE.primaryDark,
              boxShadow: "0 1px 2px rgba(15,40,30,0.04)",
            }}
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} />
          </motion.button>
        ) : (
          <div className="h-9 w-9 shrink-0" />
        )}
</div>

      <OnboardingMascotQuestion>
        <h1
          className="text-[19px] font-semibold leading-snug tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {title}
        </h1>
      </OnboardingMascotQuestion>

      <div className="flex min-h-0 flex-1 flex-col justify-center px-5">
        <div className="mx-auto w-full max-w-[320px]">
          <div
            className="rounded-[24px] border px-5 py-4 shadow-[0_18px_45px_-28px_rgba(57,212,127,0.45)]"
            style={{ backgroundColor: "#FFFFFF", borderColor: PALETTE.border }}
          >
            <input
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              value={birthdateInput}
              onChange={(event) => handleBirthdateChange(event.target.value)}
              placeholder={placeholder}
              aria-label={title}
              className="w-full bg-transparent text-center text-[28px] font-semibold tracking-[-0.04em] outline-none placeholder:text-[#9AB5A7]"
              style={{ color: PALETTE.text }}
            />
          </div>

          <p
            className="mt-3 text-center text-[12px] font-medium"
            style={{ color: birthdateInput.length > 0 && !canProceed ? "#DC2626" : PALETTE.textMuted }}
          >
            {birthdateInput.length > 0 && !canProceed ? errorText : helperText}
          </p>
        </div>
      </div>

      {/* Continue */}
      <div
        className="relative z-10 shrink-0 border-t border-zinc-200/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3"
        style={{ backgroundColor: PALETTE.bg }}
      >
        <OnboardingDataNotice variant="mint" className="mb-3" />
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={canProceed ? onNext : undefined}
          disabled={!canProceed}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #BEF5D8 0%, #98EBC5 100%)",
            boxShadow: canProceed
              ? "0 16px 34px -10px rgba(74, 232, 150,0.72), 0 0 34px rgba(110, 240, 168,0.36), 0 2px 4px rgba(15,40,30,0.05)"
              : "0 1px 2px rgba(15,40,30,0.04)",
            cursor: canProceed ? "pointer" : "not-allowed",
            opacity: canProceed ? 1 : 0.85,
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
