import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

type StepsWidgetProps = {
  steps: number;
  goal?: number;
  delay?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

export function StepsWidget({
  steps,
  goal = 10_000,
  delay = 0,
  onToggleExpand,
}: StepsWidgetProps) {
  const addSteps = () => {
    toast({ title: "Schritte", description: "Health-Anbindung folgt als nächstes." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onToggleExpand}
      className="relative h-[158px] min-[360px]:h-[168px] w-full overflow-hidden rounded-xl min-[360px]:rounded-2xl border border-orange-200/50 bg-gradient-to-b from-amber-50 to-orange-100 shadow-[0_6px_18px_-10px_rgba(249,115,22,0.25)]"
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(253,186,116,0.35),transparent_60%)]" />
      <div className="pointer-events-none absolute -bottom-8 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-orange-200/50 blur-2xl" />

      <div className="absolute inset-0 z-[10] flex flex-col justify-between p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] leading-none">👟</span>
          <span className="text-[12px] font-semibold text-slate-800">Schritte</span>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <p className="text-center text-[11px] leading-snug text-slate-700">
            Kurzer<br />Spaziergang?
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={(e) => { e.stopPropagation(); addSteps(); }}
          className="flex h-8 w-full items-center justify-center rounded-full border-2 border-amber-400/80 bg-white/85 text-[11px] font-medium text-orange-700 shadow-sm transition-all hover:bg-orange-50"
        >
          Schritte hinzufügen
        </motion.button>
      </div>
    </motion.div>
  );
}
