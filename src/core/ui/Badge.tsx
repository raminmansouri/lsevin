import { cn } from "@core/lib/cn";

const variants = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  secondary: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  brand: "bg-primary/10 text-primary border-primary/20",
};

export function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", variants[variant])}>{children}</span>;
}
