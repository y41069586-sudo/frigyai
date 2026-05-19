import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";
import { MintWheelColumn, type MintWheelOption } from "./MintWheelColumn";

const PALETTE = {
  primary: "#6EF0A8",
  primaryDark: "#4AE896",
  bg: "#FEFFFE",
  selectedBg: "#E0FDEC",
  border: "#6EECC0",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const BIRTH_WHEEL_ROW = 44;


const MONTHS_DE = [
  "Januar", "Februar", "MÃ¤rz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_FR = [
  "Janvier", "FÃ©vrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "AoÃ»t", "Septembre", "Octobre", "Novembre", "DÃ©cembre",
];

const daysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

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

  const monthNames = language === "fr" ? MONTHS_FR : language === "en" ? MONTHS_EN : MONTHS_DE;

  const today = new Date();
  const maxYear = today.getFullYear() - 13;
  const minYear = today.getFullYear() - 100;

  const birth = userData.birthdate ?? {
    day: 15,
    month: 6,
    year: maxYear - 12,
  };

  const monthOptions: MintWheelOption[] = monthNames.map((label, i) => ({
    value: i + 1,
    label,
  }));

  const maxDay = daysInMonth(birth.month, birth.year);
  const dayOptions: MintWheelOption[] = Array.from({ length: maxDay }, (_, i) => ({
    value: i + 1,
    label: String(i + 1).padStart(2, "0"),
  }));

  const yearOptions: MintWheelOption[] = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => {
      const v = maxYear - i;
      return { value: v, label: String(v) };
    },
  );

  const updateBirth = (patch: Partial<typeof birth>) => {
    const next = { ...birth, ...patch };
    const cap = daysInMonth(next.month, next.year);
    if (next.day > cap) next.day = cap;
    setUserData({ ...userData, birthdate: next });
  };

  const title =
    language === "de"
      ? "Wann bist du geboren?"
      : language === "fr"
        ? "Quand es-tu nÃ©(e) ?"
        : "When were you born?";

  const canProceed = true;

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
              backgroundColor: "#F5FFF9",
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

      {/* Datumswheels â€” ohne weiÃŸe Kachel */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 pb-1 pt-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
          className="relative mx-auto w-full max-w-[288px] shrink-0 py-0.5"
        >
          <div
            className="pointer-events-none absolute inset-x-0 z-0 rounded-xl"
            style={{
              top: `calc(50% - ${BIRTH_WHEEL_ROW / 2}px)`,
              height: BIRTH_WHEEL_ROW,
              backgroundColor: PALETTE.selectedBg,
              boxShadow: "0 0 0 3px rgba(110, 240, 168,0.16)",
            }}
          />
{/* Three columns â€” equal width and centered for consistent spacing */}
          <div className="relative z-10 flex items-stretch">
            <MintWheelColumn
              options={monthOptions}
              value={birth.month}
              onChange={(m) => updateBirth({ month: m })}
              align="center"
              width="33.3333%"
              rowHeight={BIRTH_WHEEL_ROW}
              ariaLabel="Monat"
            />
            <MintWheelColumn
              options={dayOptions}
              value={birth.day}
              onChange={(d) => updateBirth({ day: d })}
              align="center"
              width="33.3333%"
              rowHeight={BIRTH_WHEEL_ROW}
              ariaLabel="Tag"
            />
            <MintWheelColumn
              options={yearOptions}
              value={birth.year}
              onChange={(y) => updateBirth({ year: y })}
              align="center"
              width="33.3333%"
              rowHeight={BIRTH_WHEEL_ROW}
              ariaLabel="Jahr"
            />
          </div>
        </motion.div>
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
          onClick={onNext}
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
