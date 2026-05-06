import { useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Bot, Send } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PLACEHOLDER = "Wie decke ich meine Proteine? …";

type AiChatPromptWidgetProps = {
  delay?: number;
  /** Wird aufgerufen, wenn der Nutzer Enter drückt (nicht leer) */
  onSubmit: (message: string) => void;
};

export function AiChatPromptWidget({ delay = 0.06, onSubmit }: AiChatPromptWidgetProps) {
  const [value, setValue] = useState("");

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
    <WidgetCard delay={delay} variant="glass" interactive={false} className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">KI-Berater</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight">Frage stellen</h3>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.05 }}
        className="mt-4 flex items-center gap-2 sm:gap-3 rounded-2xl border border-border/40 bg-background/50 px-2 py-2 sm:px-3 sm:py-2.5 backdrop-blur-sm"
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            "bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15",
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
          placeholder={PLACEHOLDER}
          enterKeyHint="send"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-base sm:text-sm text-foreground placeholder:text-muted-foreground/70",
            "outline-none focus:outline-none",
          )}
          autoComplete="off"
          aria-label="Frage an die KI"
        />
        <Button
          type="button"
          size="icon"
          variant="default"
          className="h-11 w-11 shrink-0 touch-manipulation rounded-xl sm:h-10 sm:w-10"
          onClick={submit}
          disabled={!value.trim()}
          aria-label="Senden und Chat öffnen"
        >
          <Send className="h-4 w-4" />
        </Button>
      </motion.div>
    </WidgetCard>
  );
}
