import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FridgeScanHero() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/12 via-background/95 to-background p-6 sm:p-8 mb-6 sm:mb-8 shadow-[0_24px_60px_-28px_hsl(var(--primary)/0.5)]"
    >
      <div className="absolute -right-6 top-0 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <p className="text-4xl sm:text-5xl leading-none" aria-hidden>
            📷
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Kühlschrank scannen</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Scanne deinen Kühlschrank – Frigy erstellt daraus deinen Wochenplan und die passende Einkaufsliste.
          </p>
        </div>
        <Button
          size="lg"
          className="shrink-0 h-14 px-8 rounded-2xl rounded-tl-sm rounded-br-3xl font-semibold shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary/85"
          onClick={() => navigate("/scan")}
        >
          <Camera className="h-5 w-5 mr-2" />
          Jetzt scannen
        </Button>
      </div>
    </motion.div>
  );
}
