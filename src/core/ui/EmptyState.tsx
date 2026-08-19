import { Inbox } from "lucide-react";
import { Card } from "./Card";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Inbox size={22} /></div>
      <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
