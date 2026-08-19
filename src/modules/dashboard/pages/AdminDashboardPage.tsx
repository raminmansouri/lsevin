import { Building2, CalendarClock, FileClock, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { requireCurrentUser } from "@core/auth/session";
import { adminRoleGrants, listAdminRoleNames } from "@core/auth/permissions";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { activeReleaseProfile } from "@core/modules/registry";
import { getAdminDashboardMetrics } from "../adminRepository";

export async function AdminDashboardPage() {
  const user = await requireCurrentUser();
  const [metrics, roles] = await Promise.all([getAdminDashboardMetrics(), listAdminRoleNames(user.id)]);
  const canGovern = adminRoleGrants(roles, "SUPERADMIN");
  const canAudit = adminRoleGrants(roles, "ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        title="LSevin administration control center"
        description="Cross-module launch operations, onboarding review, admin-role evidence and the current admin-surface completeness inventory."
        action={<div className="flex flex-wrap gap-2"><LinkButton href="/admin/applications">Review applications</LinkButton>{canGovern ? <LinkButton variant="secondary" href="/admin/governance">Governance</LinkButton> : null}{canAudit ? <LinkButton variant="secondary" href="/admin/audit">Audit center</LinkButton> : null}</div>}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={FileClock} label="Applications awaiting review" value={metrics.applicationsPending} />
        <StatCard icon={Building2} label="Providers" value={`${metrics.providersActive}/${metrics.providersTotal}`} />
        <StatCard icon={Stethoscope} label="Services" value={`${metrics.servicesActive}/${metrics.servicesTotal}`} />
        <StatCard icon={Users} label="Staff" value={`${metrics.staffActive}/${metrics.staffTotal}`} />
        <StatCard icon={CalendarClock} label="Availability rules" value={metrics.availabilityRules} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>How LSevin detects administrators</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg bg-muted p-4">
              <div className="font-bold">LSevin web/mobile application</div>
              <p className="mt-1 text-muted-foreground">OTP authentication returns <code>roles</code> in the NextAuth session. LSevin middleware permits admin routes when the session contains <code>admin</code> or <code>superadmin</code>.</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="font-bold">Providers Portal</div>
              <p className="mt-1 text-muted-foreground">The portal receives the same LSevin user ID, then joins <code>identity.asp_net_user_roles</code> with <code>identity.asp_net_roles</code>. Role names are normalized to uppercase. <code>SUPERADMIN</code> grants governance and every admin surface. <code>ADMIN</code> grants all business administration pages except role governance; specialized roles grant scoped pages.</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current user</div>
              <div className="mt-2 flex flex-wrap gap-2"><Badge variant="brand">{user.fullName}</Badge>{roles.length ? roles.map((role) => <Badge key={role} variant="success">{role}</Badge>) : <Badge variant="warning">Development override / no DB admin role</Badge>}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Production release boundary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 font-bold text-emerald-950"><ShieldCheck size={18} /> {activeReleaseProfile.enabledModuleIds.length} supported modules are enabled</div>
              <p className="mt-2 text-sm text-emerald-900/80">Only onboarding, provider/staff operations, bookings, finance, billing, reviews, media, notifications, support and governance are part of this release.</p>
            </div>
            <div className="flex flex-wrap gap-2">{activeReleaseProfile.enabledModuleIds.map((moduleId) => <Badge key={moduleId} variant="brand">{moduleId}</Badge>)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
