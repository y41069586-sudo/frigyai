import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalSteps?: number;
};

const PALETTE = {
  primary: "#7BE0B8",
  primaryDark: "#5BCB9F",
  primaryDeep: "#2DAA82",
  bg: "#F7FFFB",
  selectedBg: "#E8FFF4",
  border: "#B7F0D7",
  text: "#1F2937",
  textMuted: "#6B7280",
  subtext: "#7C9388",
  cardBorderIdle: "#EEF2EF",
};

type AllergyId =
  | "none"
  | "peanuts"
  | "tree-nuts"
  | "milk"
  | "eggs"
  | "fish"
  | "shellfish"
  | "soy"
  | "wheat"
  | "other";

export function AllergiesSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
  currentIndex = 0,
  totalSteps = 1,
}: Props) {
  const { language, t } = useLanguage();

  const labels = {
    de: {
      title: "Hast du Allergien oder Unverträglichkeiten?",
      subtitle: "Wähle alle aus, die auf dich zutreffen. Wir passen deine Rezepte an.",
      none: "Keine Allergien",
      peanuts: "Erdnüsse",
      treeNuts: "Schalenfrüchte",
      milk: "Milch",
      eggs: "Eier",
      fish: "Fisch",
      shellfish: "Schalentiere",
      soy: "Soja",
      wheat: "Weizen",
      other: "Andere",
      otherPlaceholder: "Beschreibe deine Allergie…",
    },
    en: {
      title: "Do you have any allergies or intolerances?",
      subtitle: "Select everything that applies. We'll adapt your recipes.",
      none: "No allergies",
      peanuts: "Peanuts",
      treeNuts: "Tree nuts",
      milk: "Milk",
      eggs: "Eggs",
      fish: "Fish",
      shellfish: "Shellfish",
      soy: "Soy",
      wheat: "Wheat",
      other: "Other",
      otherPlaceholder: "Describe your allergy…",
    },
    fr: {
      title: "As-tu des allergies ou intolérances ?",
      subtitle: "Sélectionne tout ce qui s'applique. Nous adaptons tes recettes.",
      none: "Aucune allergie",
      peanuts: "Cacahuètes",
      treeNuts: "Fruits à coque",
      milk: "Lait",
      eggs: "Œufs",
      fish: "Poisson",
      shellfish: "Crustacés",
      soy: "Soja",
      wheat: "Blé",
      other: "Autre",
      otherPlaceholder: "Décris ton allergie…",
    },
  } as const;

  const L = labels[(language as "de" | "en" | "fr")] ?? labels.de;

  const options: { id: AllergyId; title: string; emoji: string; isNone?: boolean; isOther?: boolean }[] = [
    { id: "none", title: L.none, emoji: "✅", isNone: true },
    { id: "peanuts", title: L.peanuts, emoji: "🥜" },
    { id: "tree-nuts", title: L.treeNuts, emoji: "🌰" },
    { id: "milk", title: L.milk, emoji: "🥛" },
    { id: "eggs", title: L.eggs, emoji: "🥚" },
    { id: "fish", title: L.fish, emoji: "🐟" },
    { id: "shellfish", title: L.shellfish, emoji: "🦐" },
    { id: "soy", title: L.soy, emoji: "🫘" },
    { id: "wheat", title: L.wheat, emoji: "🌾" },
    { id: "other", title: L.other, emoji: "✏️", isOther: true },
  ];

  const selected = userData.allergies ?? [];
  const otherText = userData.allergiesOther ?? "";
  const canProceed = selected.length > 0;

  const toggle = (id: AllergyId) => {
    if (id === "none") {
      // Clears everything else; toggles "none" off if already selected.
      const has = selected.includes("none");
      setUserData({
        ...userData,
        allergies: has ? [] : ["none"],
        allergiesOther: has ? otherText : "",
      });
      return;
    }
    const withoutNone = selected.filter((s) => s !== "none");
    const has = withoutNone.includes(id);
    const next = has
      ? withoutNone.filter((s) => s !== id)
      : [...withoutNone, id];
    setUserData({
      ...userData,
      allergies: next,
      // Reset "other" text if user deselects "other"
      allergiesOther: id === "other" && has ? "" : otherText,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-2 shrink-0">
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

      {/* Title + subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="px-6 pt-8 pb-5 shrink-0"
      >
        <h1
          className="text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: PALETTE.text }}
        >
          {L.title}
        </h1>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{ color: PALETTE.textMuted }}
        >
          {L.subtitle}
        </p>
      </motion.div>

      {/* Cards (scrollable) */}
      <div className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-y-auto px-5 pb-2">
        {options.map((opt, i) => {
          const isSelected = selected.includes(opt.id);
          const showOtherField = opt.isOther && isSelected;
          return (
            <div key={opt.id} className="flex flex-col gap-2">
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isSelected ? 1.02 : 1,
                }}
                transition={{
                  opacity: { delay: 0.03 + i * 0.04, duration: 0.3 },
                  y: { delay: 0.03 + i * 0.04, duration: 0.3 },
                  scale: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
                }}
                whileTap={{ scale: isSelected ? 1.0 : 0.985 }}
                onClick={() => toggle(opt.id)}
                aria-pressed={isSelected}
                className="relative flex w-full items-center gap-4 rounded-[18px] px-5 py-3.5 text-left transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? PALETTE.selectedBg : "#FFFFFF",
                  border: `1.5px solid ${isSelected ? PALETTE.primary : PALETTE.cardBorderIdle}`,
                  boxShadow: isSelected
                    ? "0 6px 18px -8px rgba(123,224,184,0.55), 0 1px 4px rgba(15,40,30,0.04)"
                    : "0 1px 2px rgba(15,40,30,0.03)",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[20px] transition-colors"
                  style={{
                    backgroundColor: isSelected ? "#D6F8E8" : "#F2FAF6",
                  }}
                  aria-hidden
                >
                  <span>{opt.emoji}</span>
                </div>
                <span
                  className="flex-1 text-[15.5px] font-medium tracking-tight"
                  style={{ color: PALETTE.text }}
                >
                  {opt.title}
                </span>
                <motion.span
                  initial={false}
                  animate={{
                    scale: isSelected ? 1 : 0.6,
                    opacity: isSelected ? 1 : 0,
                  }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: PALETTE.primary,
                    boxShadow: "0 4px 10px -3px rgba(123,224,184,0.6)",
                  }}
                  aria-hidden
                >
                  <Check className="size-4 text-white" strokeWidth={3} />
                </motion.span>
              </motion.button>

              {/* Inline "Other" text field */}
              <AnimatePresence initial={false}>
                {showOtherField && (
                  <motion.div
                    key="other-field"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          allergiesOther: e.target.value,
                        })
                      }
                      placeholder={L.otherPlaceholder}
                      className="w-full rounded-[16px] px-4 py-3 text-[15px] outline-none transition-all"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: `1.5px solid ${PALETTE.border}`,
                        color: PALETTE.text,
                        boxShadow:
                          "0 4px 14px -6px rgba(123,224,184,0.35), inset 0 1px 1px rgba(15,40,30,0.02)",
                      }}
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Continue */}
      <div className="shrink-0 px-5 pt-3 pb-10">
        <motion.button
          type="button"
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={canProceed ? onNext : undefined}
          disabled={!canProceed}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-all"
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
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
