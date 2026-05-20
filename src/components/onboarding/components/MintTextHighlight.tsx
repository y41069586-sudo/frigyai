import type { ReactNode } from "react";

/** Soft mint glow behind a word (e.g. „Wochenplan“, „Kühlschrank“). */
export function MintTextHighlight({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="absolute inset-x-[-0.08em] bottom-[0.1em] h-[0.42em] rounded-full bg-[#6EF0A8]/70 blur-[2px]" />
      <span className="relative">{children}</span>
    </span>
  );
}
