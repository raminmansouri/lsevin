import { Activity, ShieldCheck, UserCog, Users } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { assignableAdminRoles } from "../types";
import { getAdminGovernanceSummary, listGovernanceEvents } from "../repository";
import { formatDateTime } from "@core/lib/format";

const descriptions: Record<string, string> = {
  SUPERADMIN: "Role governance, every administration page and emergency recovery authority.",
  ADMIN: "All business administration pages without role-governance authority.",
  PROVIDER_ADMIN: "Provider onboarding, providers, services, staff, availability, bookings and reviews.",
  FINANCE_ADMIN: "Invoices, settlements, wallets and finance reports.",
  SUPPORT_ADMIN: "Support queues and customer service operations.",
  CONTENT_ADMIN: "Offers, content, campaigns and growth operations.",
  ANALYTICS_ADMIN: "Analytics and reporting administration.",
  REVIEW_ADMIN: "Review and trust moderation.",
  CONVERSION_ADMIN: "Conversion operations and permitted content administration.",
};

export async function AdminGovernancePage() {
  const [summary, events] = await Promise.all([getAdminGovernanceSummary(), listGovernanceEvents({ limit: 12 })]);
  return <div className="space-y-6">
    <PageHeader title="Administration governance" description="Manage the LSevin administration model, inspect privileged-user coverage and review recent role changes." action={<div className="flex gap-2"><LinkButton href="/admin/governance/users">Manage roles</LinkButton><LinkButton variant="secondary" href="/admin/audit">Audit center</LinkButton></div>} />

    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard icon={Users} label="Active users" value={`${summary.activeUsers}/${summary.totalUsers}`} />
      <StatCard icon={UserCog} label="Admin users" value={summary.usersWithAdminRoles} />
      <StatCard icon={ShieldCheck} label="Superadmins" value={summary.superadmins} />
      <StatCard icon={ShieldCheck} label="Administrators" value={summary.administrators} />
      <StatCard icon={UserCog} label="Scoped admins" value={summary.scopedAdministrators} />
      <StatCard icon={Activity} label="Role changes · 30d" value={summary.governanceEvents30d} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <Card><CardHeader><CardTitle>Administrative role matrix</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">
        {assignableAdminRoles.map((role) => <div key={role} className="rounded-lg border border-border p-4"><div className="flex items-center justify-between gap-2"><div className="font-bold">{role}</div><Badge variant={role === "SUPERADMIN" ? "danger" : role === "ADMIN" ? "warning" : "brand"}>{role === "SUPERADMIN" ? "Governance" : role === "ADMIN" ? "Global" : "Scoped"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{descriptions[role]}</p></div>)}
      </div></CardContent></Card>

      <Card><CardHeader><CardTitle>30-day administration evidence</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <Evidence label="Governance events" value={summary.governanceEvents30d} />
        <Evidence label="Catalog actions" value={summary.catalogActions30d} />
        <Evidence label="Onboarding decisions" value={summary.onboardingDecisions30d} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950"><div className="font-bold">Safety rules</div><ul className="mt-2 list-disc space-y-1 pl-5 text-xs"><li>Only SUPERADMIN can change administrative roles.</li><li>A reason is mandatory for every role change.</li><li>A superadmin cannot remove their own SUPERADMIN role.</li><li>The final active SUPERADMIN cannot be removed.</li></ul></div>
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>Recent role changes</CardTitle></CardHeader><CardContent>{events.length ? <div className="space-y-2">{events.map((event) => <div key={event.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex flex-col justify-between gap-2 md:flex-row md:items-center"><div><span className="font-bold">{event.action}</span>{event.roleName ? <Badge variant="brand">{event.roleName}</Badge> : null}<div className="mt-1 text-xs text-muted-foreground">{event.targetName} · {event.reason}</div></div><div className="text-xs text-muted-foreground">{event.actorName} · {formatDateTime(event.createdAt)}</div></div></div>)}</div> : <p className="text-sm text-muted-foreground">No role changes have been recorded yet.</p>}</CardContent></Card>
  </div>;
}

function Evidence({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-lg bg-muted p-3"><span>{label}</span><span className="text-lg font-black">{value}</span></div>;
}
