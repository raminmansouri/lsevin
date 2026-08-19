import { notFound } from "next/navigation";
import { ShieldCheck, UserCog } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { assignAdministrativeRoleAction, revokeAdministrativeRoleAction } from "../actions";
import { getGovernanceUser, listGovernanceEvents } from "../repository";
import { assignableAdminRoles, type AssignableAdminRole } from "../types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function AdminGovernanceUserPage({ params }: ModulePageProps) {
  if (!UUID_RE.test(params.userId ?? "")) notFound();
  const user = await getGovernanceUser(params.userId);
  if (!user) notFound();
  const events = await listGovernanceEvents({ targetUserId: user.id, limit: 50 });
  const adminRoles = user.roles.filter((role): role is AssignableAdminRole => assignableAdminRoles.includes(role as AssignableAdminRole));
  const missingRoles = assignableAdminRoles.filter((role) => !adminRoles.includes(role));
  return <div className="space-y-6">
    <PageHeader title={`Manage ${user.fullName}`} description="SUPERADMIN-only role assignment with mandatory reasons, immutable audit history and last-superadmin protection." action={<LinkButton href="/admin/governance/users">Back to users</LinkButton>} />
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Card><CardHeader><CardTitle>LSevin identity</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Info label="User ID" value={user.id} mono /><Info label="Email" value={user.email || "—"} /><Info label="Phone" value={user.phone || "—"} /><Info label="State" value={user.userState} /><Info label="Last login" value={formatDateTime(user.lastLoggedInAt)} /><Info label="Provider memberships" value={String(user.providerMemberships)} /><div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">All current roles</div><div className="mt-2 flex flex-wrap gap-1">{user.roles.map((role) => <Badge key={role} variant={role === "SUPERADMIN" ? "danger" : role === "ADMIN" ? "warning" : "brand"}>{role}</Badge>)}</div></div></CardContent></Card>
      <div className="space-y-5">
        <Card><CardHeader><CardTitle>Assign administrative role</CardTitle></CardHeader><CardContent>{missingRoles.length ? <form action={assignAdministrativeRoleAction} className="grid gap-3 md:grid-cols-[240px_1fr_auto]"><input type="hidden" name="targetUserId" value={user.id} /><Select name="role" required><option value="">Select role</option>{missingRoles.map((role) => <option key={role} value={role}>{role}</option>)}</Select><Input name="reason" minLength={5} required placeholder="Why this access is needed" /><Button type="submit"><UserCog size={16} /> Assign</Button></form> : <p className="text-sm text-muted-foreground">This user already has every assignable administration role.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Revoke administrative role</CardTitle></CardHeader><CardContent>{adminRoles.length ? <div className="space-y-2">{adminRoles.map((role) => <form key={role} action={revokeAdministrativeRoleAction} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[180px_1fr_auto]"><input type="hidden" name="targetUserId" value={user.id} /><input type="hidden" name="role" value={role} /><div className="flex items-center"><Badge variant={role === "SUPERADMIN" ? "danger" : role === "ADMIN" ? "warning" : "brand"}>{role}</Badge></div><Input name="reason" minLength={5} required placeholder="Why this access is being removed" /><Button type="submit" variant="danger"><ShieldCheck size={16} /> Revoke</Button></form>)}</div> : <p className="text-sm text-muted-foreground">This user has no administrative roles.</p>}</CardContent></Card>
      </div>
    </div>
    <Card><CardHeader><CardTitle>Role history</CardTitle></CardHeader><CardContent>{events.length ? <div className="space-y-2">{events.map((event) => <div key={event.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex flex-col justify-between gap-2 md:flex-row"><div><span className="font-bold">{event.action}</span>{event.roleName ? <Badge variant="brand">{event.roleName}</Badge> : null}<div className="mt-1 text-xs text-muted-foreground">{event.reason}</div><div className="mt-1 text-[11px] text-muted-foreground">Before: {event.previousRoles.join(", ") || "none"} · After: {event.newRoles.join(", ") || "none"}</div></div><div className="text-xs text-muted-foreground">{event.actorName}<br />{formatDateTime(event.createdAt)}</div></div></div>)}</div> : <p className="text-sm text-muted-foreground">No role-governance events for this user.</p>}</CardContent></Card>
  </div>;
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div><div className={mono ? "break-all font-mono text-xs" : "font-medium"}>{value}</div></div>; }
