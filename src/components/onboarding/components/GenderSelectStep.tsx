import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { MINT_STEP_HEADER_PT } from "../layout";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";
import { OnboardingDataNotice } from "./OnboardingDataNotice";

type GenderSelectStepProps = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

const PALETTE = {
  primary: "#75FBB2",
  primaryDark: "#39D47F",
  bg: "#FBFFFD",
  selectedBg: "#DCFEEF",
  border: "#75FBB2",
  text: "#1F2937",
  cardBorderIdle: "#BCFDDC",
};

const GENDER_IMAGES = {
  male: "/gender-male.png",
  female: "/gender-female.png",
} as const;

const SELECTED_RING =
  "0 0 0 3px #DCFEEF, 0 0 0 5px #75FBB2";

export function GenderSelectStep({
  userData,
  setUserData,
  onBack,
  onNext,
}: GenderSelectStepProps) {
  const { t } = useLanguage();

  const binaryOptions: {
    id: "male" | "female";
    image: string;
    label: string;
  }[] = [
    { id: "male", image: GENDER_IMAGES.male, label: t.onboardingMale },
    { id: "female", image: GENDER_IMAGES.female, label: t.onboardingFemale },
  ];

  const nonBinaryLabel = t.onboardingNonBinaryLabel;

  const title = t.onboardingGenderQuestionTitle;

  const canProceed = userData.gender !== null;

  const selectGender = (gender: "male" | "female") => {
    setUserData((prev) => ({ ...prev, gender }));
  };

  const toggleNonBinary = () => {
    setUserData((prev) => ({
      ...prev,
      gender: prev.gender === "non-binary" ? null : "non-binary",
    }));
  };

  const nonBinarySelected = userData.gender === "non-binary";

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      <div
        className="flex shrink-0 items-center px-5 pb-1"
        style={{ paddingTop: MINT_STEP_HEADER_PT }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={t.back}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-neutral-500 transition-transform active:scale-95 hover:bg-white"
            style={{ boxShadow: "0 1px 2px rgba(15,40,30,0.04)" }}
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <div className="h-9 w-9 shrink-0" aria-hidden />
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-5 pb-4 pt-6">
        <div className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-4">
          {binaryOptions.map((opt) => {
            const selected = userData.gender === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectGender(opt.id)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-2.5 border-0 bg-transparent p-0 outline-none",
                  "transition-[transform,opacity] duration-200 ease-out active:scale-[0.97]",
                  "focus-visible:ring-2 focus-visible:ring-[#75FBB2]/50",
                  selected ? "scale-[1.03] opacity-100" : "scale-100 opacity-[0.88]",
                )}
              >
                <div
                  className="relative w-full transition-[box-shadow] duration-300 ease-out"
                  style={{
                    aspectRatio: "1",
                    boxShadow: selected ? SELECTED_RING : "0 0 0 3px transparent, 0 0 0 5px transparent",
                  }}
                >
                  <img
                    src={opt.image}
                    alt=""
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
                <span
                  className={cn(
                    "text-[15px] tracking-tight transition-[opacity,font-weight] duration-200",
                    selected ? "font-semibold opacity-100" : "font-medium opacity-70",
                  )}
                  style={{ color: PALETTE.text }}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <button
            type="button"
            onClick={toggleNonBinary}
            aria-pressed={nonBinarySelected}
            className="flex items-center gap-3 border-0 bg-transparent p-0 outline-none transition-transform active:scale-[0.98]"
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all duration-200",
                nonBinarySelected ? "scale-105 border-[#75FBB2] bg-[#75FBB2]" : "scale-100 bg-white",
              )}
              style={{ borderColor: nonBinarySelected ? PALETTE.border : PALETTE.cardBorderIdle }}
              aria-hidden
            >
              <Check
                className={cn(
                  "size-3.5 text-white transition-all duration-200",
                  nonBinarySelected ? "scale-100 opacity-100" : "scale-75 opacity-0",
                )}
                strokeWidth={3}
              />
            </span>
            <span
              className={cn(
                "text-[15px] font-medium tracking-tight transition-opacity duration-200",
                nonBinarySelected ? "opacity-100" : "opacity-80",
              )}
              style={{ color: PALETTE.text }}
            >
              {nonBinaryLabel}
            </span>
          </button>
        </div>
      </div>

      <div
        className="relative z-10 shrink-0 border-t border-zinc-200/50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3"
        style={{ backgroundColor: PALETTE.bg }}
      >
        <OnboardingDataNotice variant="mint" className="mb-3" />
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-semibold text-white transition-transform",
            canProceed && "active:scale-[0.98]",
          )}
          style={{
            background: canProceed
              ? `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`
              : "linear-gradient(135deg, #FBFFFD 0%, #DCFEEF 100%)",
            boxShadow: canProceed
              ? "0 16px 34px -10px rgba(74, 232, 150,0.72), 0 0 34px rgba(110, 240, 168,0.36), 0 2px 4px rgba(15,40,30,0.05)"
              : "0 1px 2px rgba(15,40,30,0.04)",
            cursor: canProceed ? "pointer" : "not-allowed",
            opacity: canProceed ? 1 : 0.85,
          }}
        >
          {t.next}
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
