import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Dispatch, SetStateAction } from "react";
import type { UserData } from "../types";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import {
  OnboardingInputHelper,
  OnboardingManualInput,
  OnboardingManualInputField,
} from "./OnboardingManualInput";
import { MIN_ONBOARDING_AGE } from "../utils";

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  bg: "#FBFFFD",
  selectedBg: "#DCFEEF",
  border: "#6EECC0",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const daysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

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

type BirthdateParseResult =
  | { status: "invalid" }
  | { status: "too_young" }
  | { status: "valid"; day: number; month: number; year: number; age: number };

const parseBirthdateInput = (value: string): BirthdateParseResult | null => {
  if (!value) return null;
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    return { status: "invalid" };
  }

  const [dayString, monthString, yearString] = value.split(".");
  const day = Number(dayString);
  const month = Number(monthString);
  const year = Number(yearString);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return { status: "invalid" };
  }

  if (year > new Date().getFullYear() - MIN_ONBOARDING_AGE) {
    return { status: "too_young" };
  }

  const today = new Date();
  const minYear = today.getFullYear() - MAX_AGE;

  if (year < minYear) {
    return { status: "invalid" };
  }

  if (month < 1 || month > 12) {
    return { status: "invalid" };
  }

  const maxDay = daysInMonth(month, year);
  if (day < 1 || day > maxDay) {
    return { status: "invalid" };
  }

  const age = calculateAgeFromBirthdate(day, month, year);
  if (age < MIN_ONBOARDING_AGE) {
    return { status: "too_young" };
  }
  if (age > MAX_AGE) {
    return { status: "invalid" };
  }

  return { status: "valid", day, month, year, age };
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
  const { t } = useLanguage();
  const [birthdateInput, setBirthdateInput] = useState("");

  useEffect(() => {
    if (!userData.birthdate || !userData.birthdateConfirmed) {
      setBirthdateInput("");
      return;
    }

    setBirthdateInput(formatBirthdateValue(userData.birthdate));
  }, [userData.birthdate, userData.birthdateConfirmed]);

  const title = t.onboardingBirthdateTitle;

  const placeholder = "16.05.2002";
  const helperText = t.onboardingBirthdateFormat;
  const errorText = t.onboardingBirthdateError;
  const tooYoungText = t.onboardingBirthdateTooYoung;

  const parsedBirthdate = parseBirthdateInput(birthdateInput);
  const canProceed = parsedBirthdate?.status === "valid";
  const showTooYoung = parsedBirthdate?.status === "too_young";
  const showInvalid =
    birthdateInput.length > 0 &&
    parsedBirthdate !== null &&
    parsedBirthdate.status === "invalid";

  const handleBirthdateChange = (raw: string) => {
    const nextValue = sanitizeBirthdateInput(raw);
    setBirthdateInput(nextValue);

    const parsed = parseBirthdateInput(nextValue);
    if (!parsed || parsed.status !== "valid") {
      if (userData.birthdateConfirmed) {
        setUserData({
          ...userData,
          birthdate: null,
          birthdateConfirmed: false,
        });
      }
      return;
    }

    setUserData({
      ...userData,
      birthdate: {
        day: parsed.day,
        month: parsed.month,
        year: parsed.year,
      },
      age: parsed.age,
      birthdateConfirmed: true,
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
            aria-label={t.back}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#FBFFFD",
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
        <div className="mx-auto w-full max-w-[300px]">
          <OnboardingManualInputField>
            <OnboardingManualInput
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              value={birthdateInput}
              onChange={(event) => handleBirthdateChange(event.target.value)}
              placeholder={placeholder}
              aria-label={title}
            />
          </OnboardingManualInputField>

          <OnboardingInputHelper error={showTooYoung || showInvalid}>
            {showTooYoung
              ? tooYoungText
              : showInvalid
                ? errorText
                : helperText}
          </OnboardingInputHelper>
        </div>
      </div>

      {/* Continue */}
      <div
        className="relative z-10 shrink-0 border-t border-zinc-200/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3"
        style={{ backgroundColor: PALETTE.bg }}
      >
        <OnboardingDataNotice variant="mint" className="mb-3" notice="minAge" />
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
