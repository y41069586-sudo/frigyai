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
    <WidgetCard delay={delay} variant="glass" interactive={false} className="w-full rounded-[1.75rem] border border-slate-200/85 bg-white/72 p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">KI-Berater</p>
      <h3 className="mt-1 text-[19px] font-bold tracking-[-0.02em]">Frage stellen</h3>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.05 }}
        className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/35 px-2.5 py-2 backdrop-blur-sm"
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
          placeholder={PLACEHOLDER}
          enterKeyHint="send"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70",
            "outline-none focus:outline-none",
          )}
          autoComplete="off"
          aria-label="Frage an die KI"
        />
        <Button
          type="button"
          size="icon"
          variant="default"
          className="h-9 w-9 shrink-0 touch-manipulation rounded-full"
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
