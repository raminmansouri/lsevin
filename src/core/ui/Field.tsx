import { cn } from "@core/lib/cn";

export function Field({ label, help, children, className }: { label: string; help?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
      {help ? <span className="block text-xs text-muted-foreground">{help}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-4", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-28 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-4", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-4", props.className)} />;
}
