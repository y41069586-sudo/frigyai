import { cn } from "@/lib/utils";

type OnboardingMascotQuestionProps = {
  children: React.ReactNode;
  className?: string;
};

/** Step question headline (no mascot / speech bubble). */
export function OnboardingMascotQuestion({
  children,
  className,
}: OnboardingMascotQuestionProps) {
  return (
    <div className={cn("shrink-0 px-5 pb-3 pt-1", className)}>
      {children}
    </div>
  );
}
