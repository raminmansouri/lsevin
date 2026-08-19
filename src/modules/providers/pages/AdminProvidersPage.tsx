import { Building2, CircleCheckBig, Search, ShieldCheck, Sparkles, UserRoundX } from "lucide-react";
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
import { providerAdminActionLabel, providersCopy } from "../i18n/copy";
import { setProviderAccreditedAction, setProviderActiveAction, setProviderSponsoredAction } from "../actions";
import { getAdminProviderSummary, listAdminProviders, listProviderTypeOptions, listRecentProviderAdminActions } from "../repository";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export async function AdminProvidersPage({ searchParams }: ModulePageProps) {
  const query = read(searchParams.q);
  const status = read(searchParams.status);
  const providerTypeId = read(searchParams.providerTypeId);
  const [summary, providers, providerTypes, actions, locale] = await Promise.all([
    getAdminProviderSummary(), listAdminProviders({ query, status, providerTypeId }), listProviderTypeOptions(), listRecentProviderAdminActions(), getPortalLocale(),
  ]);
  const copy = providersCopy(locale.header);

  return (
    <div className="space-y-6">
      <PageHeader title={copy.adminTitle} description={copy.adminDescription} action={<LinkButton href="/admin">{copy.adminControlCenter}</LinkButton>} />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Building2} label={copy.providersLabel} value={summary.total} />
        <StatCard icon={CircleCheckBig} label={copy.active} value={summary.active} />
        <StatCard icon={UserRoundX} label={copy.inactive} value={summary.inactive} />
        <StatCard icon={ShieldCheck} label={copy.accredited} value={summary.accredited} />
        <StatCard icon={Sparkles} label={copy.sponsored} value={summary.sponsored} />
        <StatCard icon={UserRoundX} label={copy.withoutOwner} value={summary.withoutOwner} />
      </div>

      <Card><CardContent><form action="/admin/providers" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_260px_auto]">
        <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" /><Input name="q" defaultValue={query} className="pl-9" placeholder={copy.searchPlaceholder} /></div>
        <Select name="status" defaultValue={status}><option value="">{copy.allStatuses}</option><option value="active">{copy.active}</option><option value="inactive">{copy.inactive}</option><option value="accredited">{copy.accredited}</option><option value="sponsored">{copy.sponsored}</option></Select>
        <Select name="providerTypeId" defaultValue={providerTypeId}><option value="">{copy.allProviderTypes}</option>{providerTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</Select>
        <Button type="submit">{copy.filter}</Button>
      </form></CardContent></Card>

      {providers.length ? <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1380px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">{copy.tableProvider}</th><th className="px-4 py-3">{copy.location}</th><th className="px-4 py-3">{copy.status}</th><th className="px-4 py-3">{copy.operations}</th><th className="px-4 py-3">{copy.reputation}</th><th className="px-4 py-3">{copy.lastUpdate}</th><th className="px-4 py-3">{copy.controls}</th></tr></thead>
        <tbody className="divide-y divide-border">{providers.map((provider) => <tr key={provider.id} className="align-top hover:bg-muted/30">
          <td className="px-4 py-4"><div className="font-bold text-slate-950">{provider.name || provider.id}</div><div className="text-xs text-muted-foreground">{provider.providerTypeName}</div><div className="mt-1 text-xs text-muted-foreground">{provider.email}</div></td>
          <td className="px-4 py-4">{provider.country} / {provider.city}</td>
          <td className="px-4 py-4"><div className="flex flex-wrap gap-1"><Badge variant={provider.isActive ? "success" : "danger"}>{provider.isActive ? copy.active : copy.inactive}</Badge>{provider.accredited ? <Badge variant="brand">{copy.accredited}</Badge> : null}{provider.isSponsored ? <Badge variant="warning">{copy.sponsored}</Badge> : null}</div></td>
          <td className="px-4 py-4 text-xs"><div>{provider.memberCount} {copy.members}</div><div>{provider.activeServiceCount}/{provider.serviceCount} {copy.services}</div><div>{provider.staffCount} {copy.staff}</div><div>{provider.openBookingCount} {copy.openBookings}</div></td>
          <td className="px-4 py-4"><div className="font-bold">{provider.rating.toFixed(2)}</div><div className="text-xs text-muted-foreground">{formatNumber(provider.reviewCount)} {copy.reviews}</div></td>
          <td className="px-4 py-4 text-xs text-muted-foreground">{formatDateTime(provider.lastModifiedAt)}</td>
          <td className="px-4 py-4"><div className="flex min-w-[390px] flex-wrap gap-2">
            <LinkButton size="sm" variant="secondary" href={`/providers/${provider.id}/dashboard`}>{copy.workspace}</LinkButton>
            <FlagForm action={setProviderActiveAction} providerId={provider.id} value={!provider.isActive} label={provider.isActive ? copy.deactivate : copy.activate} dangerous={provider.isActive} reasonRequired={provider.isActive} reasonLabel={copy.reason} />
            <FlagForm action={setProviderAccreditedAction} providerId={provider.id} value={!provider.accredited} label={provider.accredited ? copy.removeAccreditation : copy.accredit} reasonLabel={copy.reason} />
            <FlagForm action={setProviderSponsoredAction} providerId={provider.id} value={!provider.isSponsored} label={provider.isSponsored ? copy.removeSponsor : copy.sponsor} reasonLabel={copy.reason} />
          </div></td>
        </tr>)}</tbody>
      </table></div></Card> : <EmptyState title={copy.noMatchingProviders} description={copy.noMatchingProvidersDescription} />}

      <Card><CardHeader><CardTitle>{copy.recentAdministration}</CardTitle></CardHeader><CardContent>{actions.length ? <div className="space-y-2">{actions.map((action) => <div key={action.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm md:flex-row md:items-center md:justify-between"><div><span className="font-semibold">{providerAdminActionLabel(locale.header, action.action)}</span> <span className="font-mono text-xs text-muted-foreground">{action.entityId}</span>{action.reason ? <div className="text-xs text-muted-foreground">{action.reason}</div> : null}</div><div className="text-xs text-muted-foreground">{action.actorName} · {formatDateTime(action.createdAt)}</div></div>)}</div> : <p className="text-sm text-muted-foreground">{copy.noAdministrationActions}</p>}</CardContent></Card>
    </div>
  );
}

function FlagForm({ action, providerId, value, label, reasonLabel = "Reason", dangerous = false, reasonRequired = false }: { action: (formData: FormData) => Promise<void>; providerId: string; value: boolean; label: string; reasonLabel?: string; dangerous?: boolean; reasonRequired?: boolean }) {
  return <form action={action} className="flex items-center gap-1"><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="value" value={value ? "true" : "false"} /><Input name="reason" required={reasonRequired} className="w-32 py-1.5 text-xs" placeholder={reasonLabel} /><Button type="submit" size="sm" variant={dangerous ? "danger" : "secondary"}>{label}</Button></form>;
}
