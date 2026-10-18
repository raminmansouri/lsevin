import { CheckCircle2 } from "lucide-react";

export function BookingProgress({
  steps,
  currentIndex,
  label,
}: {
  steps: Array<{ key: number; label: string }>;
  currentIndex: number;
  label: string;
}) {
  return (
    <ol
      aria-label={label}
      className="grid grid-cols-3 gap-x-2 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:gap-3"
    >
      {steps.map((step, index) => (
        <li
          key={step.key}
          aria-current={currentIndex === index ? "step" : undefined}
          className="flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:gap-2 sm:text-start"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${currentIndex >= index ? "bg-[#083f30] text-white" : "bg-slate-200 text-slate-500"}`}
          >
            {currentIndex > index ? (
              <CheckCircle2 aria-hidden className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={`max-w-full text-xs leading-snug font-medium break-words sm:text-sm ${currentIndex >= index ? "text-[#083f30]" : "text-slate-500"}`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className={`mx-1 hidden h-0.5 w-6 shrink-0 lg:block ${currentIndex > index ? "bg-[#083f30]" : "bg-slate-200"}`}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
