import type { ReactNode } from "react";
import { useMintWheelRowHeight, WHEEL_ITEM_HEIGHT } from "./MintWheelColumn";

const SELECTED_BG = "#E0FDEC";

type MintWheelPickerSectionProps = {
  children: ReactNode;
  maxWidthClass?: string;
  /** Row height for selection band — must match MintWheelColumn `rowHeight`. */
  rowHeight?: number;
  animationKey?: string | number;
  /** `center` = middle of step (birthdate). `lower` = below unit toggle, not stuck under controls. */
  placement?: "center" | "lower";
};

export function MintWheelPickerSection({
  children,
  maxWidthClass = "max-w-[260px]",
  rowHeight,
  animationKey,
  placement = "center",
}: MintWheelPickerSectionProps) {
  const responsiveRowHeight = useMintWheelRowHeight();
  const bandHeight = rowHeight ?? responsiveRowHeight ?? WHEEL_ITEM_HEIGHT;

  const placementClass =
    placement === "lower"
      ? "justify-start pt-10 pb-4 max-md:pt-12 min-[390px]:pt-14"
      : "justify-center pt-0 pb-2 max-md:pb-1";

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col items-center overflow-x-hidden px-4 ${placementClass}`}
    >
      <div
        key={animationKey}
        className={`relative mx-auto w-full shrink-0 py-0.5 ${maxWidthClass}`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 z-0 rounded-xl"
          style={{
            top: `calc(50% - ${bandHeight / 2}px)`,
            height: bandHeight,
            backgroundColor: SELECTED_BG,
            boxShadow: "0 0 0 3px rgba(110, 240, 168, 0.16)",
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
