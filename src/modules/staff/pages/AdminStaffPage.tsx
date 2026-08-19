import { BadgeCheck, Link2, Search, UserCheck, UserRoundX, Users } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { formatDateTime, formatNumber } from "@core/lib/format";
import { getPortalLocale } from "@core/i18n/server";
import { setProviderStaffLinkActiveAdminAction, setStaffActiveAdminAction } from "../actions";
import { getAdminStaffSummary, listAdminStaff, listRecentStaffAdminActions, listStaffProviderOptions } from "../repository";
import { staffAdminActionLabel, staffClaimStatusLabel, staffCopy } from "../i18n/copy";

function read(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export async function AdminStaffPage({ searchParams }: ModulePageProps) {
  const query = read(searchParams.q);
  const status = read(searchParams.status);
  const providerId = read(searchParams.providerId);
  const [summary, staffRows, providers, actions, locale] = await Promise.all([
    getAdminStaffSummary(), listAdminStaff({ query, status, providerId }), listStaffProviderOptions(), listRecentStaffAdminActions(), getPortalLocale(),
  ]);
  const copy = staffCopy(locale.header);
  return <div className="space-y-6">
    <PageHeader title={copy.adminTitle} description={copy.adminDescription} action={<LinkButton href="/admin/provider-claims">{copy.openClaims}</LinkButton>} />
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard icon={Users} label={copy.staffProfiles} value={summary.staffTotal} />
      <StatCard icon={UserCheck} label={copy.activeProfiles} value={summary.staffActive} />
      <StatCard icon={UserRoundX} label={copy.inactiveProfiles} value={summary.staffInactive} />
      <StatCard icon={Link2} label={copy.providerLinks} value={summary.providerLinks} />
      <StatCard icon={UserRoundX} label={copy.inactiveLinks} value={summary.inactiveLinks} />
      <StatCard icon={BadgeCheck} label={copy.approvedClaims} value={summary.approvedClaims} />
    </div>
    <Card><CardContent><form action="/admin/staff" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_280px_auto]">
      <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" /><Input name="q" defaultValue={query} className="pl-9" placeholder={copy.searchPlaceholder} /></div>
      <Select name="status" defaultValue={status}><option value="">{copy.allStatuses}</option><option value="active">{copy.activeProfileAndLink}</option><option value="staff_inactive">{copy.staffInactive}</option><option value="link_inactive">{copy.linkInactive}</option><option value="claimed">{copy.approvedClaim}</option></Select>
      <Select name="providerId" defaultValue={providerId}><option value="">{copy.allProviders}</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}</Select>
      <Button type="submit">{copy.filter}</Button>
    </form></CardContent></Card>
    {staffRows.length ? <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1400px] text-left text-sm">
      <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">{copy.tableStaff}</th><th className="px-4 py-3">{copy.providerLink}</th><th className="px-4 py-3">{copy.status}</th><th className="px-4 py-3">{copy.claim}</th><th className="px-4 py-3">{copy.reputation}</th><th className="px-4 py-3">{copy.updated}</th><th className="px-4 py-3">{copy.controls}</th></tr></thead>
      <tbody className="divide-y divide-border">{staffRows.map((staff) => <tr key={staff.providerStaffId} className="align-top hover:bg-muted/30">
        <td className="px-4 py-4"><div className="font-bold text-slate-950">{staff.staffName || staff.staffId}</div><div className="text-xs text-muted-foreground">{staff.title || staff.specialty || copy.noTitle}</div><div className="mt-1 font-mono text-[11px] text-muted-foreground">{staff.staffId}</div></td>
        <td className="px-4 py-4"><div className="font-semibold">{staff.providerName}</div>{!staff.providerActive ? <Badge variant="danger">{copy.providerInactive}</Badge> : null}</td>
        <td className="px-4 py-4"><div className="flex flex-wrap gap-1"><Badge variant={staff.staffActive ? "success" : "danger"}>{staff.staffActive ? copy.profileActive : copy.profileInactive}</Badge><Badge variant={staff.linkActive ? "brand" : "warning"}>{staff.linkActive ? copy.linkActive : copy.linkInactiveBadge}</Badge></div></td>
        <td className="px-4 py-4">{staff.claimStatus ? <Badge variant={staff.claimStatus === "approved" ? "success" : "warning"}>{staffClaimStatusLabel(locale.header, staff.claimStatus)}</Badge> : "—"}</td>
        <td className="px-4 py-4"><div className="font-bold">{staff.rating.toFixed(2)}</div><div className="text-xs text-muted-foreground">{formatNumber(staff.reviewCount)} {copy.reviews}</div></td>
        <td className="px-4 py-4 text-xs text-muted-foreground">{formatDateTime(staff.lastModifiedAt)}</td>
        <td className="px-4 py-4"><div className="flex min-w-[440px] flex-wrap gap-2"><LinkButton size="sm" variant="secondary" href={`/providers/${staff.providerId}/staff/${staff.providerStaffId}/edit`}>{copy.editLink}</LinkButton><StaffFlagForm action={setStaffActiveAdminAction} idName="staffId" id={staff.staffId} value={!staff.staffActive} label={staff.staffActive ? copy.deactivateProfile : copy.activateProfile} dangerous={staff.staffActive} reasonRequired={staff.staffActive} reasonLabel={copy.reason} /><StaffFlagForm action={setProviderStaffLinkActiveAdminAction} idName="providerStaffId" id={staff.providerStaffId} value={!staff.linkActive} label={staff.linkActive ? copy.disableLink : copy.enableLink} dangerous={staff.linkActive} reasonRequired={staff.linkActive} reasonLabel={copy.reason} /></div></td>
      </tr>)}</tbody>
    </table></div></Card> : <EmptyState title={copy.noMatchingStaff} description={copy.noMatchingStaffDescription} />}
    <Card><CardHeader><CardTitle>{copy.recentAdministration}</CardTitle></CardHeader><CardContent>{actions.length ? <div className="space-y-2">{actions.map((action) => <div key={action.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm md:flex-row md:items-center md:justify-between"><div><span className="font-semibold">{staffAdminActionLabel(locale.header, action.action)}</span> <span className="font-mono text-xs text-muted-foreground">{action.entityId}</span>{action.reason ? <div className="text-xs text-muted-foreground">{action.reason}</div> : null}</div><div className="text-xs text-muted-foreground">{action.actorName} · {formatDateTime(action.createdAt)}</div></div>)}</div> : <p className="text-sm text-muted-foreground">{copy.noAdministrationActions}</p>}</CardContent></Card>
  </div>;
}

function StaffFlagForm({ action, idName, id, value, label, dangerous = false, reasonRequired = false, reasonLabel }: { action: (formData: FormData) => Promise<void>; idName: "staffId" | "providerStaffId"; id: string; value: boolean; label: string; dangerous?: boolean; reasonRequired?: boolean; reasonLabel: string }) {
  return <form action={action} className="flex items-center gap-1"><input type="hidden" name={idName} value={id} /><input type="hidden" name="value" value={value ? "true" : "false"} /><Input name="reason" required={reasonRequired} className="w-32 py-1.5 text-xs" placeholder={reasonLabel} /><Button type="submit" size="sm" variant={dangerous ? "danger" : "secondary"}>{label}</Button></form>;
}
