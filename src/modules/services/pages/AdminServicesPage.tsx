import { Ban, Search, Sparkles, Stethoscope } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { formatDateTime, formatMoney, formatNumber } from "@core/lib/format";
import { setProviderServiceActiveAction, setProviderServicePopularAction } from "../actions";
import { getAdminServiceSummary, listAdminServices, listRecentServiceAdminActions, listServiceProviderOptions } from "../repository";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export async function AdminServicesPage({ searchParams }: ModulePageProps) {
  const query = read(searchParams.q);
  const status = read(searchParams.status);
  const providerId = read(searchParams.providerId);
  const [summary, services, providers, actions] = await Promise.all([
    getAdminServiceSummary(),
    listAdminServices({ query, status, providerId }),
    listServiceProviderOptions(),
    listRecentServiceAdminActions(),
  ]);
  return <div className="space-y-6">
    <PageHeader title="Provider service catalog" description="Moderate every provider service without changing provider ownership or the stable LSevin service-definition contract." action={<LinkButton href="/admin">Admin control center</LinkButton>} />
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard icon={Stethoscope} label="Services" value={summary.total} />
      <StatCard icon={Stethoscope} label="Active" value={summary.active} />
      <StatCard icon={Ban} label="Inactive" value={summary.inactive} />
      <StatCard icon={Sparkles} label="Popular" value={summary.popular} />
      <StatCard icon={Ban} label="On inactive provider" value={summary.inactiveProvider} />
    </div>
    <Card><CardContent><form action="/admin/services" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_280px_auto]">
      <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" /><Input name="q" defaultValue={query} className="pl-9" placeholder="Service, definition or provider" /></div>
      <Select name="status" defaultValue={status}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="popular">Popular</option><option value="inactive_provider">Inactive provider</option></Select>
      <Select name="providerId" defaultValue={providerId}><option value="">All providers</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}</Select>
      <Button type="submit">Filter</Button>
    </form></CardContent></Card>
    {services.length ? <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1320px] text-left text-sm">
      <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Service</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Commercial</th><th className="px-4 py-3">Scheduling</th><th className="px-4 py-3">Reputation</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Controls</th></tr></thead>
      <tbody className="divide-y divide-border">{services.map((service) => <tr key={service.id} className="align-top hover:bg-muted/30">
        <td className="px-4 py-4"><div className="font-bold text-slate-950">{service.displayName}</div><div className="text-xs text-muted-foreground">{service.serviceDefinitionName}</div><div className="mt-1 flex gap-1"><Badge variant={service.isActive ? "success" : "danger"}>{service.isActive ? "Active" : "Inactive"}</Badge>{service.isPopular ? <Badge variant="warning">Popular</Badge> : null}</div></td>
        <td className="px-4 py-4"><div className="font-semibold">{service.providerName}</div>{!service.providerActive ? <Badge variant="danger">Provider inactive</Badge> : null}</td>
        <td className="px-4 py-4 font-bold">{formatMoney(service.value, service.currency)}</td>
        <td className="px-4 py-4 text-xs"><div>{service.durationMinutes} minutes</div><div>{service.slotIntervalMinutes} minute slots</div></td>
        <td className="px-4 py-4"><div className="font-bold">{service.rating.toFixed(2)}</div><div className="text-xs text-muted-foreground">{formatNumber(service.reviewCount)} reviews</div></td>
        <td className="px-4 py-4 text-xs text-muted-foreground">{formatDateTime(service.lastModifiedAt)}</td>
        <td className="px-4 py-4"><div className="flex min-w-[390px] flex-wrap gap-2"><LinkButton size="sm" variant="secondary" href={`/providers/${service.providerId}/services/${service.id}/edit`}>Edit</LinkButton><ServiceFlagForm action={setProviderServiceActiveAction} serviceId={service.id} value={!service.isActive} label={service.isActive ? "Deactivate" : "Activate"} dangerous={service.isActive} reasonRequired={service.isActive} /><ServiceFlagForm action={setProviderServicePopularAction} serviceId={service.id} value={!service.isPopular} label={service.isPopular ? "Unfeature" : "Feature"} /></div></td>
      </tr>)}</tbody>
    </table></div></Card> : <EmptyState title="No matching services" description="Change the filters or ask a provider to add a service." />}
    <Card><CardHeader><CardTitle>Recent service administration</CardTitle></CardHeader><CardContent>{actions.length ? <div className="space-y-2">{actions.map((action) => <div key={action.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm md:flex-row md:items-center md:justify-between"><div><span className="font-semibold">{action.action}</span> <span className="font-mono text-xs text-muted-foreground">{action.entityId}</span>{action.reason ? <div className="text-xs text-muted-foreground">{action.reason}</div> : null}</div><div className="text-xs text-muted-foreground">{action.actorName} · {formatDateTime(action.createdAt)}</div></div>)}</div> : <p className="text-sm text-muted-foreground">No service administration actions recorded yet.</p>}</CardContent></Card>
  </div>;
}

function ServiceFlagForm({ action, serviceId, value, label, dangerous = false, reasonRequired = false }: { action: (formData: FormData) => Promise<void>; serviceId: string; value: boolean; label: string; dangerous?: boolean; reasonRequired?: boolean }) {
  return <form action={action} className="flex items-center gap-1"><input type="hidden" name="serviceId" value={serviceId} /><input type="hidden" name="value" value={value ? "true" : "false"} /><Input name="reason" required={reasonRequired} className="w-32 py-1.5 text-xs" placeholder="Reason" /><Button type="submit" size="sm" variant={dangerous ? "danger" : "secondary"}>{label}</Button></form>;
}
