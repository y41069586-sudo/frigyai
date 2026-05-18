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
      className="relative inline-flex h-10 items-center rounded-full p-1 [@media(min-height:701px)]:h-11 [@media(min-height:800px)]:h-[52px]"
      style={{
        backgroundColor: "#E8FFF2",
        border: "1px solid #CDF5E0",
        boxShadow: "inset 0 1px 1px rgba(15,40,30,0.04)",
      }}
    >
      {/* Animated mint indicator — translate X % is relative to the pill width, so use left + segment width */}
      <motion.div
        className="absolute rounded-full"
        initial={false}
        animate={{
          left: `calc(4px + (100% - 8px) * ${selectedIdx} / ${count})`,
        }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        style={{
          top: 4,
          bottom: 4,
          width: `calc((100% - 8px) / ${count})`,
          background: "linear-gradient(135deg, #20D86B 0%, #0EA84E 100%)",
          boxShadow:
            "0 6px 14px -6px rgba(14,168,78,0.55), 0 1px 2px rgba(15,40,30,0.05)",
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
            className="relative z-10 flex h-full min-w-[88px] items-center justify-center px-5 text-[13px] font-medium transition-colors [@media(min-height:701px)]:min-w-[96px] [@media(min-height:701px)]:px-6 [@media(min-height:701px)]:text-[14px] [@media(min-height:800px)]:min-w-[108px] [@media(min-height:800px)]:px-7 [@media(min-height:800px)]:text-[16px]"
            style={{
              color: active ? "white" : "#6B7280",
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
