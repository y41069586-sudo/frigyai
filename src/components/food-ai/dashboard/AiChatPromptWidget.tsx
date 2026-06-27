import { useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Bot, Send } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

type AiChatPromptWidgetProps = {
  delay?: number;
  /** Wird aufgerufen, wenn der Nutzer Enter drückt (nicht leer) */
  onSubmit: (message: string) => void;
};

export function AiChatPromptWidget({ delay = 0.06, onSubmit }: AiChatPromptWidgetProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    submit();
  };

  return (
    <WidgetCard delay={delay} variant="glass" interactive={false} className="w-full">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.dashboardAiAdvisorLabel}</p>
          <h3 className="text-[15px] font-bold tracking-tight">{t.dashboardAiAskTitle}</h3>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.dashboardAiPlaceholder}
          aria-label={t.dashboardAiInputAria}
          className={cn(
            "min-w-0 flex-1 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 text-sm",
            "placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
        />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          aria-label={t.dashboardAiSubmitAria}
          className="h-10 w-10 shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </WidgetCard>
  );
}
