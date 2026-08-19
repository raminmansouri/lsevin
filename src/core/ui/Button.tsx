import Link from "next/link";
import { cn } from "@core/lib/cn";

const styles = {
  primary: "bg-primary !text-white hover:bg-primary/90",
  secondary: "bg-white text-slate-900 border border-border hover:bg-muted",
  ghost: "text-slate-700 hover:bg-muted",
  danger: "bg-red-600 text-white hover:bg-red-700",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};

export function Button({ className, variant = "primary", size = "md", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles; size?: string }) {
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-md font-medium transition", styles[variant], sizes[size as keyof typeof sizes] ?? sizes.md, className)} {...props} />;
}

export function LinkButton({ className, variant = "primary", size = "md", ...props }: React.ComponentProps<typeof Link> & { variant?: keyof typeof styles; size?: string }) {
  return <Link className={cn("inline-flex items-center justify-center gap-2 rounded-md font-medium transition", styles[variant], sizes[size as keyof typeof sizes] ?? sizes.md, className)} {...props} />;
}
