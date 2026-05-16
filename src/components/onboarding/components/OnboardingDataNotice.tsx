import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type OnboardingDataNoticeProps = {
  className?: string;
  /** Mint steps use darker green-gray subtext */
  variant?: "default" | "mint";
};

export function OnboardingDataNotice({
  className,
  variant = "default",
}: OnboardingDataNoticeProps) {
  const { language } = useLanguage();

  const message =
    language === "de"
      ? "Ihre Daten werden nach Erstellung eines Plans gelöscht."
      : language === "fr"
        ? "Vos données seront supprimées après la création d'un plan."
        : "Your data will be deleted after a plan is created.";

  const textColor = variant === "mint" ? "#7C9388" : undefined;

  return (
    <p
      className={cn(
        "flex items-center justify-center gap-2 text-center text-[11px] leading-snug",
        variant === "default" && "text-muted-foreground",
        className,
      )}
      style={textColor ? { color: textColor } : undefined}
    >
      <span
        className="flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] font-bold leading-none"
        style={{
          borderColor: variant === "mint" ? "#9BB5A8" : "currentColor",
          color: variant === "mint" ? "#7C9388" : undefined,
          fontSize: "11px",
        }}
        aria-hidden
      >
        !
      </span>
      <span>{message}</span>
    </p>
  );
}
