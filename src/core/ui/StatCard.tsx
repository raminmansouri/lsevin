import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint?: string; icon: LucideIcon }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon size={18} /></div>
        <div className="min-w-0">
          <div className="text-2xl font-bold leading-none text-slate-950">{value}</div>
          <div className="mt-1 text-sm font-medium text-slate-800">{label}</div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
      </div>
    </Card>
  );
}
