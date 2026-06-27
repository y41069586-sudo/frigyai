import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

type StorePromoCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => void | Promise<void>;
  loading?: boolean;
};

export function StorePromoCodeDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: StorePromoCodeDialogProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;
    void onSubmit(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
        if (!next) setCode("");
      }}
    >
      <DialogContent stackLevel="high" className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.storePromoCodeTitle}</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            {t.storePromoCodeDescription}
          </DialogDescription>
        </DialogHeader>

        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={t.storePromoCodePlaceholder}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          disabled={loading}
          className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-center text-[16px] font-semibold tracking-[0.12em] text-neutral-900 outline-none ring-[#39D47F] focus:ring-2 disabled:opacity-60"
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmit();
          }}
        />

        <p className="text-[12px] leading-relaxed text-neutral-500">{t.storePromoCodePlayHint}</p>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            disabled={loading || !code.trim()}
            onClick={handleSubmit}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#39D47F] px-4 text-[15px] font-semibold text-black disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t.loading}
              </>
            ) : (
              t.storePromoCodeOpenPlay
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
