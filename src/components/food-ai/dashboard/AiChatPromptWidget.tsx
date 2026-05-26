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
  const { language } = useLanguage();
  const [value, setValue] = useState("");
  const copy = language === "fr"
    ? {
        label: "Conseiller IA",
        title: "Poser une question",
        placeholder: "Comment couvrir mes proteines ? ...",
        inputAria: "Question pour l'IA",
        submitAria: "Envoyer et ouvrir le chat",
      }
    : language === "en"
      ? {
          label: "AI advisor",
          title: "Ask a question",
          placeholder: "How do I hit my protein target? ...",
          inputAria: "Question for AI",
          submitAria: "Send and open chat",
        }
      : {
          label: "KI-Berater",
          title: "Frage stellen",
          placeholder: "Wie decke ich meine Proteine? ...",
          inputAria: "Frage an die KI",
          submitAria: "Senden und Chat öffnen",
        };

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onSubmit(t);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    submit();
  };

  return (
    <WidgetCard delay={delay} variant="glass" interactive={false} className="w-full rounded-[1.75rem] border border-slate-200/85 bg-white/72 p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.label}</p>
      <h3 className="mt-1 text-[19px] font-bold tracking-[-0.02em]">{copy.title}</h3>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.05 }}
        className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/45 px-2.5 py-2 sm:bg-muted/35 sm:backdrop-blur-sm"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "bg-primary/10 text-primary",
          )}
          aria-hidden
        >
          <Bot className="h-5 w-5 text-primary" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={copy.placeholder}
          enterKeyHint="send"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70",
            "outline-none focus:outline-none",
          )}
          autoComplete="off"
          aria-label={copy.inputAria}
        />
        <Button
          type="button"
          size="icon"
          variant="default"
          className="h-9 w-9 shrink-0 touch-manipulation rounded-full"
          onClick={submit}
          disabled={!value.trim()}
          aria-label={copy.submitAria}
        >
          <Send className="h-4 w-4" />
        </Button>
      </motion.div>
    </WidgetCard>
  );
}
