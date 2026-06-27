import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type AiDisclaimerProps = {
  className?: string;
  compact?: boolean;
};

export function AiDisclaimer({ className, compact }: AiDisclaimerProps) {
  const { t } = useLanguage();
  return (
    <p
      className={cn(
        "leading-snug text-muted-foreground/75",
        compact ? "text-[10px]" : "text-[11px]",
        className,
      )}
      role="note"
    >
      {t.aiDisclaimerShort}
    </p>
  );
}
