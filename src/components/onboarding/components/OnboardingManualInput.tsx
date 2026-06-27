import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ONBOARDING_PALETTE } from "../palette";

const P = ONBOARDING_PALETTE;

const fieldBase =
  "border bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-[color:var(--manual-input-focus)] focus-within:shadow-[var(--manual-input-focus-shadow)]";

const fieldStyle = {
  "--manual-input-focus": P.primaryDark,
  "--manual-input-focus-shadow": P.shadowFocus,
  borderColor: "rgba(31, 41, 55, 0.08)",
  boxShadow: "0 1px 2px rgba(15, 40, 30, 0.03)",
} as React.CSSProperties;

type ManualInputVariant = "hero" | "inline" | "auth";

const variantClasses: Record<ManualInputVariant, string> = {
  hero: "text-[24px] font-semibold tracking-[-0.03em] text-center",
  inline: "text-[15px] font-medium",
  auth: "text-[15px] font-medium",
};

type FieldProps = {
  children: ReactNode;
  className?: string;
  centered?: boolean;
};

export function OnboardingManualInputField({
  children,
  className,
  centered = false,
}: FieldProps) {
  return (
    <div
      className={cn(
        fieldBase,
        "rounded-2xl px-4 py-3.5",
        centered && "flex items-center gap-2.5",
        className,
      )}
      style={fieldStyle}
    >
      {children}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: ManualInputVariant;
};

export const OnboardingManualInput = forwardRef<HTMLInputElement, InputProps>(
  function OnboardingManualInput(
    { variant = "hero", className, style, ...props },
    ref,
  ) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full min-w-0 bg-transparent outline-none placeholder:text-[#A8BDB3]",
          variantClasses[variant],
          className,
        )}
        style={{ color: P.text, ...style }}
        {...props}
      />
    );
  },
);

type UnitLabelProps = {
  children: ReactNode;
  className?: string;
};

export function OnboardingManualInputUnit({ children, className }: UnitLabelProps) {
  return (
    <span
      className={cn("shrink-0 text-[15px] font-medium", className)}
      style={{ color: P.textMuted }}
    >
      {children}
    </span>
  );
}

type HelperProps = {
  children: ReactNode;
  error?: boolean;
  className?: string;
};

export function OnboardingInputHelper({ children, error, className }: HelperProps) {
  return (
    <p
      className={cn("mt-2.5 text-center text-[12px] font-medium leading-snug", className)}
      style={{ color: error ? P.badLine : P.textMuted }}
    >
      {children}
    </p>
  );
}

type OtpCellProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  success?: boolean;
};

export const OnboardingOtpCell = forwardRef<HTMLInputElement, OtpCellProps>(
  function OnboardingOtpCell(
    { hasError, success, className, style, ...props },
    ref,
  ) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-[52px] min-w-0 w-full rounded-xl border text-center text-[20px] font-semibold uppercase outline-none transition-all duration-200 disabled:opacity-60",
          className,
        )}
        style={{
          color: P.text,
          backgroundColor: hasError ? "#FEF8F8" : success ? P.selectedBg : "#FFFFFF",
          borderColor: hasError
            ? P.badLine
            : success
              ? P.primaryDark
              : "rgba(31, 41, 55, 0.1)",
          boxShadow: success ? P.shadowFocus : "0 1px 2px rgba(15, 40, 30, 0.03)",
          ...style,
        }}
        {...props}
      />
    );
  },
);

type AuthFieldProps = {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function OnboardingAuthField({
  id,
  label,
  icon,
  children,
  trailing,
  className,
}: AuthFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(fieldBase, "relative rounded-2xl")}
        style={fieldStyle}
      >
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
          style={{ color: P.textMuted }}
          aria-hidden
        >
          {icon}
        </span>
        {children}
        {trailing}
      </div>
    </div>
  );
}

export const onboardingAuthInputClass =
  "h-12 w-full bg-transparent pl-11 pr-3 outline-none";
