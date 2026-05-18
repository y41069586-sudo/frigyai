import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";

const PALETTE = {
  primary: "#20D86B",
  primaryDark: "#0EA84E",
  bg: "#FAFFF5",
  selectedBg: "#BFF4D4",
  border: "#6EECC0",
  text: "#1F2937",
  textMuted: "#6B7280",
};

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PAD_ITEMS = Math.floor(VISIBLE_ITEMS / 2);

type WheelOption = { value: number; label: string };

type WheelColumnProps = {
  options: WheelOption[];
  value: number;
  onChange: (value: number) => void;
  align?: "left" | "center" | "right";
  width?: number | string;
  ariaLabel?: string;
};

const haptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(4);
  }
};

function WheelColumn({
  options,
  value,
  onChange,
  align = "center",
  width = "100%",
  ariaLabel,
}: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);
  const isProgrammaticRef = useRef(false);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const scrollToIndex = useCallback((idx: number, smooth: boolean) => {
    if (!scrollRef.current) return;
    isProgrammaticRef.current = true;
    scrollRef.current.scrollTo({
      top: idx * ITEM_HEIGHT,
      behavior: smooth ? "smooth" : "auto",
    });
    setTimeout(
      () => {
        isProgrammaticRef.current = false;
      },
      smooth ? 260 : 30,
    );
  }, []);

  useEffect(() => {
    scrollToIndex(selectedIndex, false);
    lastIndexRef.current = selectedIndex;
  }, []);

  useEffect(() => {
    if (selectedIndex !== lastIndexRef.current) {
      scrollToIndex(selectedIndex, false);
      lastIndexRef.current = selectedIndex;
    }
  }, [selectedIndex, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isProgrammaticRef.current) return;
    const top = scrollRef.current.scrollTop;
    const idx = Math.round(top / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(options.length - 1, idx));

    if (clamped !== lastIndexRef.current) {
      haptic();
      lastIndexRef.current = clamped;
      onChange(options[clamped].value);
    }

    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const currentTop = scrollRef.current.scrollTop;
      const targetTop = lastIndexRef.current * ITEM_HEIGHT;
      if (Math.abs(currentTop - targetTop) > 0.5) {
        scrollToIndex(lastIndexRef.current, true);
      }
    }, 90);
  }, [options, onChange, scrollToIndex]);

  useEffect(() => () => {
    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
  }, []);

  const containerHeight = VISIBLE_ITEMS * ITEM_HEIGHT;
  const textAlignClass =
    align === "left" ? "justify-start pl-2" : align === "right" ? "justify-end pr-2" : "justify-center";

  return (
    <div
      className="relative shrink-0"
      style={{ height: containerHeight, width }}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          WebkitUserSelect: "none",
          userSelect: "none",
          willChange: "scroll-position",
          transform: "translateZ(0)",
        }}
        onScroll={handleScroll}
      >
        <div style={{ height: PAD_ITEMS * ITEM_HEIGHT }} />
        {options.map((opt, idx) => {
          const distance = Math.abs(idx - selectedIndex);
          const isSelected = idx === selectedIndex;
          const opacity =
            distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.28 : 0.15;
          return (
            <div
              key={opt.value}
              role="option"
              aria-selected={isSelected}
              className={`flex items-center ${textAlignClass}`}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
                fontSize: isSelected ? "19px" : "15px",
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? PALETTE.text : PALETTE.textMuted,
                opacity,
                letterSpacing: "-0.01em",
                transition: "font-size 160ms cubic-bezier(0.4,0,0.2,1), color 160ms",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {opt.label}
            </div>
          );
        })}
        <div style={{ height: PAD_ITEMS * ITEM_HEIGHT }} />
      </div>
    </div>
  );
}

const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
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

  const monthOptions: WheelOption[] = monthNames.map((label, i) => ({
    value: i + 1,
    label,
  }));

  const maxDay = daysInMonth(birth.month, birth.year);
  const dayOptions: WheelOption[] = Array.from({ length: maxDay }, (_, i) => ({
    value: i + 1,
    label: String(i + 1).padStart(2, "0"),
  }));

  const yearOptions: WheelOption[] = Array.from(
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
        ? "Quand es-tu né(e) ?"
        : "When were you born?";

  const canProceed = true;

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* ── Top bar: back + progress ── */}
      <div className="flex shrink-0 items-center px-5 pb-1 pt-[calc(env(safe-area-inset-top,0px)+1.375rem)]">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#E9FFF1",
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

      {/* Datumswheels — ohne weiße Kachel */}
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
              top: `calc(50% - ${ITEM_HEIGHT / 2}px)`,
              height: ITEM_HEIGHT,
              backgroundColor: PALETTE.selectedBg,
              boxShadow: "0 0 0 3px rgba(32,216,107,0.16)",
            }}
          />
{/* Three columns — equal width and centered for consistent spacing */}
          <div className="relative z-10 flex items-stretch">
            <WheelColumn
              options={monthOptions}
              value={birth.month}
              onChange={(m) => updateBirth({ month: m })}
              align="center"
              width="33.3333%"
              ariaLabel="Monat"
            />
            <WheelColumn
              options={dayOptions}
              value={birth.day}
              onChange={(d) => updateBirth({ day: d })}
              align="center"
              width="33.3333%"
              ariaLabel="Tag"
            />
            <WheelColumn
              options={yearOptions}
              value={birth.year}
              onChange={(y) => updateBirth({ year: y })}
              align="center"
              width="33.3333%"
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
              ? "0 16px 34px -10px rgba(14,168,78,0.72), 0 0 34px rgba(32,216,107,0.36), 0 2px 4px rgba(15,40,30,0.05)"
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
