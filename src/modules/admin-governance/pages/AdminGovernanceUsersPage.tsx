import { Search, ShieldCheck, UserCog, Users } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { formatDateTime } from "@core/lib/format";
import { assignableAdminRoles } from "../types";
import { getAdminGovernanceSummary, listGovernanceUsers } from "../repository";

function read(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export async function AdminGovernanceUsersPage({ searchParams }: ModulePageProps) {
  const query = read(searchParams.q);
  const role = read(searchParams.role);
  const state = read(searchParams.state);
  const [summary, users] = await Promise.all([getAdminGovernanceSummary(), listGovernanceUsers({ query, role, state })]);
  return <div className="space-y-6">
    <PageHeader title="Administrative users" description="Search LSevin identities, inspect effective roles and open a user to assign or revoke scoped administration access." action={<LinkButton href="/admin/governance">Governance overview</LinkButton>} />
    <div className="grid gap-4 md:grid-cols-4"><StatCard icon={Users} label="Users" value={summary.totalUsers} /><StatCard icon={UserCog} label="Admin users" value={summary.usersWithAdminRoles} /><StatCard icon={ShieldCheck} label="Superadmins" value={summary.superadmins} /><StatCard icon={UserCog} label="Scoped admins" value={summary.scopedAdministrators} /></div>
    <Card><CardContent><form action="/admin/governance/users" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]"><div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" /><Input name="q" defaultValue={query} className="pl-9" placeholder="Name, email, phone or user ID" /></div><Select name="role" defaultValue={role}><option value="">All roles</option>{assignableAdminRoles.map((item) => <option key={item} value={item}>{item}</option>)}</Select><Select name="state" defaultValue={state}><option value="">All user states</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Disabled">Disabled</option></Select><Button type="submit">Filter</Button></form></CardContent></Card>
    {users.length ? <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3">Provider memberships</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-border">{users.map((user) => <tr key={user.id}><td className="px-4 py-4"><div className="font-bold">{user.fullName}</div><div className="text-xs text-muted-foreground">{user.email}</div><div className="font-mono text-[10px] text-muted-foreground">{user.id}</div></td><td className="px-4 py-4"><Badge variant={user.userState.toLowerCase() === "active" ? "success" : "danger"}>{user.userState}</Badge></td><td className="px-4 py-4"><div className="flex max-w-[380px] flex-wrap gap-1">{user.roles.length ? user.roles.map((item) => <Badge key={item} variant={item === "SUPERADMIN" ? "danger" : item === "ADMIN" ? "warning" : "brand"}>{item}</Badge>) : <span className="text-xs text-muted-foreground">No roles</span>}</div></td><td className="px-4 py-4">{user.providerMemberships}</td><td className="px-4 py-4 text-xs text-muted-foreground">{formatDateTime(user.lastLoggedInAt)}</td><td className="px-4 py-4"><LinkButton size="sm" href={`/admin/governance/users/${user.id}`}>Manage roles</LinkButton></td></tr>)}</tbody></table></div></Card> : <EmptyState title="No matching users" description="Change the filters or search by the exact LSevin user ID." />}
  </div>;
}
