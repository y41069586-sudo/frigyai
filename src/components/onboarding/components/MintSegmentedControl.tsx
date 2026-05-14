import { motion } from "framer-motion";

type SegmentedOption<T extends string> = {
  id: T;
  label: string;
};

type MintSegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
};

export function MintSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: MintSegmentedControlProps<T>) {
  const selectedIdx = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const count = options.length;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="relative inline-flex h-11 items-center rounded-full p-1"
      style={{
        backgroundColor: "#EFF6F2",
        border: "1px solid #E3EFE7",
        boxShadow: "inset 0 1px 1px rgba(15,40,30,0.04)",
      }}
    >
      {/* Animated mint indicator */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          x: `calc(${selectedIdx} * 100%)`,
        }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        style={{
          top: 4,
          bottom: 4,
          left: 4,
          width: `calc((100% - 8px) / ${count})`,
          background: "linear-gradient(135deg, #7BE0B8 0%, #5BCB9F 100%)",
          boxShadow:
            "0 6px 14px -6px rgba(91,203,159,0.55), 0 1px 2px rgba(15,40,30,0.05)",
          pointerEvents: "none",
        }}
      />

      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className="relative z-10 flex h-full items-center justify-center px-6 text-[14px] font-medium transition-colors"
            style={{
              color: active ? "white" : "#6B7280",
              minWidth: 96,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
