import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { useMintWheelRowHeight } from "./MintWheelColumn";

const PALETTE = {
  primary: "#7BE0B8",
  primaryDark: "#5BCB9F",
  bg: "#F7FFFB",
  selectedBg: "#E8FFF4",
  border: "#B7F0D7",
  text: "#1F2937",
  textMuted: "#6B7280",
  cardBorderIdle: "#EEF2EF",
};

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
  rowHeight: number;
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
  rowHeight,
}: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);
  const isProgrammaticRef = useRef(false);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const scrollToIndex = useCallback(
    (idx: number, smooth: boolean) => {
      if (!scrollRef.current) return;
      isProgrammaticRef.current = true;
      scrollRef.current.scrollTo({
        top: idx * rowHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setTimeout(
        () => {
          isProgrammaticRef.current = false;
        },
        smooth ? 260 : 30,
      );
    },
    [rowHeight],
  );

  useEffect(() => {
    scrollToIndex(selectedIndex, false);
    lastIndexRef.current = selectedIndex;
  }, [selectedIndex, rowHeight, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isProgrammaticRef.current) return;
    const top = scrollRef.current.scrollTop;
    const idx = Math.round(top / rowHeight);
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
      const targetTop = lastIndexRef.current * rowHeight;
      if (Math.abs(currentTop - targetTop) > 0.5) {
        scrollToIndex(lastIndexRef.current, true);
      }
    }, 90);
  }, [options, onChange, scrollToIndex, rowHeight]);

  useEffect(() => () => {
    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
  }, []);

  const containerHeight = VISIBLE_ITEMS * rowHeight;
  const textAlignClass =
    align === "left" ? "justify-start pl-4" : align === "right" ? "justify-end pr-4" : "justify-center";

  const selectedPx = rowHeight <= 40 ? 18 : 22;
  const idlePx = rowHeight <= 40 ? 15 : 16;

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
        <div style={{ height: PAD_ITEMS * rowHeight }} />
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
                height: rowHeight,
                scrollSnapAlign: "center",
                fontSize: isSelected ? `${selectedPx}px` : `${idlePx}px`,
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
        <div style={{ height: PAD_ITEMS * rowHeight }} />
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
  currentIndex?: number;
  totalSteps?: number;
};

export function BirthdateSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language, t } = useLanguage();
  const wheelRow = useMintWheelRowHeight();

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

  const subtitle =
    language === "de"
      ? "Das hilft uns deinen Plan zu personalisieren."
      : language === "fr"
        ? "Cela nous aide à personnaliser ton plan."
        : "This helps us personalize your plan.";

  const canProceed = true;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        backgroundColor: PALETTE.bg,
        color: PALETTE.text,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* ── Top bar: back + progress ── */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-1 shrink-0">
        {onBack ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{
              backgroundColor: "#EAF8F1",
              color: PALETTE.primaryDark,
              boxShadow: "0 1px 2px rgba(15,40,30,0.04)",
            }}
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} />
          </motion.button>
        ) : (
          <div className="h-9 w-9 shrink-0" />
        )}
        <div className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-[4px] flex-1 rounded-full transition-colors"
              style={{
                backgroundColor: i <= currentIndex ? PALETTE.primary : "#E5F4EC",
              }}
            />
          ))}
        </div>
        <div className="h-9 w-9 shrink-0" />
      </div>

      {/* ── Title + subtitle ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-3 pb-3 shrink-0 [@media(max-height:700px)]:pt-3 [@media(max-height:700px)]:pb-3 [@media(min-height:701px)]:pt-5 [@media(min-height:701px)]:pb-4 [@media(min-height:800px)]:pt-8 [@media(min-height:800px)]:pb-6"
      >
        <h1
          className="text-[24px] font-semibold leading-tight tracking-tight [@media(max-height:700px)]:text-[21px] [@media(min-height:800px)]:text-[30px]"
          style={{ color: PALETTE.text }}
        >
          {title}
        </h1>
        <p
          className="mt-1.5 text-[15px] leading-snug [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:text-[13px] [@media(min-height:800px)]:mt-3 [@media(min-height:800px)]:text-[17px]"
          style={{ color: PALETTE.textMuted }}
        >
          {subtitle}
        </p>
      </motion.div>

      {/* ── Wheel picker card ── */}
      <div className="flex flex-1 min-h-0 flex-col items-center justify-start overflow-y-auto px-4 pb-2 pt-1">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-md rounded-[24px] p-3 [@media(max-height:700px)]:rounded-[22px] [@media(max-height:700px)]:p-2.5 [@media(min-height:800px)]:rounded-[28px] [@media(min-height:800px)]:p-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: `1px solid ${PALETTE.cardBorderIdle}`,
            boxShadow:
              "0 24px 50px -24px rgba(60,120,90,0.18), 0 4px 14px -6px rgba(60,120,90,0.08)",
          }}
        >
          {/* Selection band (mint highlight across whole row) */}
          <div
            className="pointer-events-none absolute inset-x-4 z-0 rounded-2xl"
            style={{
              top: `calc(50% - ${wheelRow / 2}px)`,
              height: wheelRow,
              backgroundColor: PALETTE.selectedBg,
              boxShadow: "0 0 0 4px rgba(123,224,184,0.18)",
            }}
          />

          {/* Top fade */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 rounded-t-[24px] [@media(min-height:800px)]:rounded-t-[28px]"
            style={{
              height: PAD_ITEMS * wheelRow + 12,
              background:
                "linear-gradient(180deg, rgba(247,255,251,0.55) 0%, rgba(247,255,251,0.22) 55%, rgba(247,255,251,0) 100%)",
            }}
          />
          {/* Bottom fade */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 rounded-b-[24px] [@media(min-height:800px)]:rounded-b-[28px]"
            style={{
              height: PAD_ITEMS * wheelRow + 12,
              background:
                "linear-gradient(0deg, rgba(247,255,251,0.55) 0%, rgba(247,255,251,0.22) 55%, rgba(247,255,251,0) 100%)",
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
              rowHeight={wheelRow}
            />
            <WheelColumn
              options={dayOptions}
              value={birth.day}
              onChange={(d) => updateBirth({ day: d })}
              align="center"
              width="33.3333%"
              ariaLabel="Tag"
              rowHeight={wheelRow}
            />
            <WheelColumn
              options={yearOptions}
              value={birth.year}
              onChange={(y) => updateBirth({ year: y })}
              align="center"
              width="33.3333%"
              ariaLabel="Jahr"
              rowHeight={wheelRow}
            />
          </div>
        </motion.div>
      </div>

      {/* ── Continue button ── */}
      <div className="shrink-0 px-5 pt-3 pb-4 [@media(max-height:700px)]:pt-2 [@media(max-height:700px)]:pb-3 [@media(min-height:800px)]:pt-5 [@media(min-height:800px)]:pb-6">
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={onNext}
          disabled={!canProceed}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] text-[15px] font-semibold text-white transition-all [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:text-[14px] [@media(min-height:800px)]:h-[58px] [@media(min-height:800px)]:text-[17px]"
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #CFEEDD 0%, #BCE3CE 100%)",
            boxShadow: canProceed
              ? "0 10px 24px -8px rgba(91,203,159,0.55), 0 2px 4px rgba(15,40,30,0.05)"
              : "0 1px 2px rgba(15,40,30,0.04)",
            cursor: canProceed ? "pointer" : "not-allowed",
            opacity: canProceed ? 1 : 0.85,
          }}
        >
          {t.next}
          <ChevronRight className="size-5 [@media(min-height:800px)]:size-6" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
