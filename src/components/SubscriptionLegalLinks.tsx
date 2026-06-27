import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type SubscriptionLegalLinksProps = {
  className?: string;
};

export function SubscriptionLegalLinks({ className }: SubscriptionLegalLinksProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-medium",
        className,
      )}
      aria-label={t.termsOfService}
    >
      <button
        type="button"
        onClick={() => navigate("/legal/agb")}
        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        {t.termsOfService}
      </button>
      <span className="text-border" aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={() => navigate("/legal/datenschutz")}
        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        {t.privacyPolicy}
      </button>
    </nav>
  );
}
