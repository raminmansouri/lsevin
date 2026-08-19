import { Search, ScrollText } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { listUnifiedAdminAudit } from "../repository";

function read(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export async function AdminAuditPage({ searchParams }: ModulePageProps) {
  const source = read(searchParams.source);
  const query = read(searchParams.q);
  const events = await listUnifiedAdminAudit({ source, query });
  return <div className="space-y-6">
    <PageHeader title="Administration audit center" description="A unified read-only timeline for role governance, catalog moderation and onboarding decisions." action={<LinkButton href="/admin/governance">Governance</LinkButton>} />
    <Card><CardContent><form action="/admin/audit" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_auto]"><div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" /><Input name="q" defaultValue={query} className="pl-9" placeholder="Action, actor, entity or reason" /></div><Select name="source" defaultValue={source}><option value="">All sources</option><option value="governance">Role governance</option><option value="catalog">Catalog administration</option><option value="onboarding">Onboarding decisions</option></Select><Button type="submit">Filter</Button></form></CardContent></Card>
    {events.length ? <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Details</th></tr></thead><tbody className="divide-y divide-border">{events.map((event) => <tr key={`${event.source}:${event.id}`} className="align-top"><td className="px-4 py-4 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</td><td className="px-4 py-4"><Badge variant={event.source === "governance" ? "danger" : event.source === "catalog" ? "brand" : "warning"}>{event.source}</Badge></td><td className="px-4 py-4 font-semibold">{event.action}</td><td className="px-4 py-4">{event.entityLabel}</td><td className="px-4 py-4">{event.actorName}</td><td className="px-4 py-4 text-muted-foreground">{event.reason || "—"}</td><td className="px-4 py-4"><details><summary className="cursor-pointer text-xs font-semibold text-primary"><ScrollText className="mr-1 inline" size={14} /> View</summary><pre className="mt-2 max-w-[420px] overflow-auto rounded bg-slate-950 p-3 text-[10px] text-slate-100">{JSON.stringify(event.detail, null, 2)}</pre></details></td></tr>)}</tbody></table></div></Card> : <EmptyState title="No matching administration events" description="Apply the migrations and perform an onboarding, catalog or role-governance action first." />}
  </div>;
}
