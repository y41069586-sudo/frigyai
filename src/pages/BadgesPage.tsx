import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeOverview } from "@/components/StreakBadge";

const BadgesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7FAF7] safe-area-inset">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,146,60,0.16),transparent_34%),linear-gradient(to_bottom,#F7FAF7,white)] pointer-events-none" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-bottom-nav pt-9 safe-top">
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/85 bg-white/80 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.32)]"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Motivation</p>
            <h1 className="flex items-center gap-2 text-[26px] font-bold tracking-[-0.04em]">
              <Trophy className="h-6 w-6 text-amber-500" />
              Deine Badges
            </h1>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <BadgeOverview />
        </motion.div>
      </main>
    </div>
  );
};

export default BadgesPage;
