import { Ban, Gift, Search, Sparkles, TimerOff, UsersRound } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { formatDateTime, formatNumber } from "@core/lib/format";
import { expireOfferAdminAction, setOfferActiveAdminAction, setOfferFeaturedAdminAction } from "../actions";
import { getAdminOfferSummary, listAdminOffers, listOfferProviderOptions, listRecentOfferAdminActions } from "../repository";

function read(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export async function AdminOffersPage({ searchParams }: ModulePageProps) {
  const query = read(searchParams.q);
  const status = read(searchParams.status);
  const providerId = read(searchParams.providerId);
  const [summary, offers, providers, actions] = await Promise.all([
    getAdminOfferSummary(), listAdminOffers({ query, status, providerId }), listOfferProviderOptions(), listRecentOfferAdminActions(),
  ]);
  return <div className="space-y-6">
    <PageHeader title="Offer administration" description="Moderate activation, featured placement and expiration while preserving provider ownership and usage limits." action={<LinkButton href="/admin">Admin control center</LinkButton>} />
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard icon={Gift} label="Offers" value={summary.total} />
      <StatCard icon={Gift} label="Active" value={summary.active} />
      <StatCard icon={Ban} label="Inactive" value={summary.inactive} />
      <StatCard icon={Sparkles} label="Featured" value={summary.featured} />
      <StatCard icon={TimerOff} label="Expired" value={summary.expired} />
      <StatCard icon={UsersRound} label="Usage exhausted" value={summary.exhausted} />
    </div>
    <Card><CardContent><form action="/admin/offers" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_280px_auto]">
      <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" /><Input name="q" defaultValue={query} className="pl-9" placeholder="Offer, code, service or provider" /></div>
      <Select name="status" defaultValue={status}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="featured">Featured</option><option value="expired">Expired</option><option value="exhausted">Usage exhausted</option></Select>
      <Select name="providerId" defaultValue={providerId}><option value="">All providers</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}</Select>
      <Button type="submit">Filter</Button>
    </form></CardContent></Card>
    {offers.length ? <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1420px] text-left text-sm">
      <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Offer</th><th className="px-4 py-3">Provider/service</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Validity</th><th className="px-4 py-3">Usage</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Controls</th></tr></thead>
      <tbody className="divide-y divide-border">{offers.map((offer) => <tr key={offer.id} className="align-top hover:bg-muted/30">
        <td className="px-4 py-4"><div className="font-bold text-slate-950">{offer.title}</div><div className="text-xs text-muted-foreground">{offer.subtitle || offer.code || `Offer #${offer.id}`}</div></td>
        <td className="px-4 py-4"><div className="font-semibold">{offer.providerName}</div><div className="text-xs text-muted-foreground">{offer.serviceName}</div>{!offer.providerActive ? <Badge variant="danger">Provider inactive</Badge> : null}</td>
        <td className="px-4 py-4 text-lg font-black">{Number(offer.discountPercent).toFixed(0)}%</td>
        <td className="px-4 py-4"><div>{formatDateTime(offer.validUntil)}</div>{offer.isExpired ? <Badge variant="danger">Expired</Badge> : null}</td>
        <td className="px-4 py-4"><div>{formatNumber(offer.usedCount)} used</div><div className="text-xs text-muted-foreground">Limit {offer.usageLimit == null ? "unlimited" : formatNumber(offer.usageLimit)}</div></td>
        <td className="px-4 py-4"><div className="flex flex-wrap gap-1"><Badge variant={offer.isActive && !offer.isExpired ? "success" : "danger"}>{offer.isActive ? "Active flag" : "Inactive"}</Badge>{offer.isFeatured ? <Badge variant="warning">Featured</Badge> : null}</div></td>
        <td className="px-4 py-4"><div className="flex min-w-[520px] flex-wrap gap-2"><LinkButton size="sm" variant="secondary" href={`/providers/${offer.providerId}/offers`}>Provider offers</LinkButton><OfferFlagForm action={setOfferActiveAdminAction} offerId={offer.id} value={!offer.isActive} label={offer.isActive ? "Deactivate" : "Activate"} dangerous={offer.isActive} reasonRequired={offer.isActive} /><OfferFlagForm action={setOfferFeaturedAdminAction} offerId={offer.id} value={!offer.isFeatured} label={offer.isFeatured ? "Unfeature" : "Feature"} /><ExpireForm offerId={offer.id} disabled={offer.isExpired} /></div></td>
      </tr>)}</tbody>
    </table></div></Card> : <EmptyState title="No matching offers" description="Change the filters or create offers from provider workspaces." />}
    <Card><CardHeader><CardTitle>Recent offer administration</CardTitle></CardHeader><CardContent>{actions.length ? <div className="space-y-2">{actions.map((action) => <div key={action.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm md:flex-row md:items-center md:justify-between"><div><span className="font-semibold">{action.action}</span> <span className="font-mono text-xs text-muted-foreground">{action.entityId}</span>{action.reason ? <div className="text-xs text-muted-foreground">{action.reason}</div> : null}</div><div className="text-xs text-muted-foreground">{action.actorName} · {formatDateTime(action.createdAt)}</div></div>)}</div> : <p className="text-sm text-muted-foreground">No offer administration actions recorded yet.</p>}</CardContent></Card>
  </div>;
}

function OfferFlagForm({ action, offerId, value, label, dangerous = false, reasonRequired = false }: { action: (formData: FormData) => Promise<void>; offerId: number; value: boolean; label: string; dangerous?: boolean; reasonRequired?: boolean }) {
  return <form action={action} className="flex items-center gap-1"><input type="hidden" name="offerId" value={offerId} /><input type="hidden" name="value" value={value ? "true" : "false"} /><Input name="reason" required={reasonRequired} className="w-32 py-1.5 text-xs" placeholder="Reason" /><Button type="submit" size="sm" variant={dangerous ? "danger" : "secondary"}>{label}</Button></form>;
}

function ExpireForm({ offerId, disabled }: { offerId: number; disabled: boolean }) {
  return <form action={expireOfferAdminAction} className="flex items-center gap-1"><input type="hidden" name="offerId" value={offerId} /><Input name="reason" required className="w-32 py-1.5 text-xs" placeholder="Expiry reason" /><Button type="submit" size="sm" variant="danger" disabled={disabled}>{disabled ? "Expired" : "Expire now"}</Button></form>;
}
