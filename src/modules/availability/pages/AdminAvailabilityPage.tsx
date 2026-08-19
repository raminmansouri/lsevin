import { Ban, CalendarClock, Search, ToggleLeft, Warehouse } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { formatDateTime } from "@core/lib/format";
import { getPortalLocale } from "@core/i18n/server";
import { availabilityAdminActionLabel, availabilityCopy, availabilityDayLabels, availabilityTargetTypeLabel } from "../i18n/copy";
import { setAvailabilityRuleActiveAdminAction, setBookableResourceActiveAdminAction, setOperatingHourClosedAdminAction } from "../actions";
import { getAdminAvailabilitySummary, listAdminAvailabilityRules, listAdminOperatingHours, listAdminResources, listRecentAvailabilityAdminActions } from "../repository";

function read(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] || "" : value || ""; }

export async function AdminAvailabilityPage({ searchParams }: ModulePageProps) {
  const query = read(searchParams.q);
  const status = read(searchParams.status);
  const targetType = read(searchParams.targetType);
  const [summary, rules, resources, hours, actions, locale] = await Promise.all([
    getAdminAvailabilitySummary(), listAdminAvailabilityRules({ query, status, targetType }), listAdminResources(), listAdminOperatingHours(), listRecentAvailabilityAdminActions(), getPortalLocale(),
  ]);
  const copy = availabilityCopy(locale.header);
  const dayNames = ["—", ...availabilityDayLabels(locale.header)];
  return <div className="space-y-6">
    <PageHeader title={copy.adminTitle} description={copy.adminDescription} action={<LinkButton href="/admin">{copy.adminControlCenter}</LinkButton>} />
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard icon={CalendarClock} label={copy.rules} value={summary.rulesTotal} />
      <StatCard icon={ToggleLeft} label={copy.activeRules} value={summary.rulesActive} />
      <StatCard icon={Ban} label={copy.inactiveRules} value={summary.rulesInactive} />
      <StatCard icon={Ban} label={copy.blockingRules} value={summary.unavailableRules} />
      <StatCard icon={Warehouse} label={copy.activeResources} value={summary.resourcesActive} />
      <StatCard icon={CalendarClock} label={copy.closedOperatingDays} value={summary.closedOperatingHours} />
    </div>
    <Card><CardContent><form action="/admin/availability" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_240px_auto]">
      <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" /><Input name="q" defaultValue={query} className="pl-9" placeholder={copy.searchPlaceholder} /></div>
      <Select name="status" defaultValue={status}><option value="">{copy.allStatuses}</option><option value="active">{copy.active}</option><option value="inactive">{copy.inactive}</option><option value="blocked">{copy.activeButUnavailable}</option></Select>
      <Select name="targetType" defaultValue={targetType}><option value="">{copy.allTargetTypes}</option><option value="provider">{copy.provider}</option><option value="provider_service">{copy.providerServiceTarget}</option><option value="staff">{copy.staffTarget}</option><option value="bookable_resource">{copy.bookableResource}</option></Select>
      <Button type="submit">{copy.filter}</Button>
    </form></CardContent></Card>

    <Card className="overflow-hidden"><CardHeader><CardTitle>{copy.availabilityRules}</CardTitle></CardHeader><div className="overflow-x-auto">{rules.length ? <table className="w-full min-w-[1380px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">{copy.provider}</th><th className="px-4 py-3">{copy.target}</th><th className="px-4 py-3">{copy.schedule}</th><th className="px-4 py-3">{copy.capacity}</th><th className="px-4 py-3">{copy.status}</th><th className="px-4 py-3">{copy.updated}</th><th className="px-4 py-3">{copy.controls}</th></tr></thead><tbody className="divide-y divide-border">{rules.map((rule) => <tr key={rule.id} className="align-top hover:bg-muted/30">
      <td className="px-4 py-4"><div className="font-semibold">{rule.providerName}</div>{!rule.providerActive ? <Badge variant="danger">{copy.providerInactive}</Badge> : null}</td>
      <td className="px-4 py-4"><div className="font-bold">{rule.targetName}</div><div className="text-xs text-muted-foreground">{availabilityTargetTypeLabel(locale.header, rule.targetType)}</div></td>
      <td className="px-4 py-4 text-xs"><div>{rule.specificDate || dayNames[rule.dayOfWeek || 0]}</div><div>{rule.startsAt || "—"} – {rule.endsAt || "—"}</div><div>{rule.timezoneId}</div></td>
      <td className="px-4 py-4 text-xs"><div>{rule.capacity ?? copy.defaultCapacity}</div><div>{rule.slotIntervalMinutes ? `${rule.slotIntervalMinutes} ${copy.minuteSlots}` : copy.defaultInterval}</div></td>
      <td className="px-4 py-4"><div className="flex flex-wrap gap-1"><Badge variant={rule.isActive ? "success" : "danger"}>{rule.isActive ? copy.active : copy.inactive}</Badge><Badge variant={rule.isAvailable ? "brand" : "warning"}>{rule.isAvailable ? copy.available : copy.unavailable}</Badge></div></td>
      <td className="px-4 py-4 text-xs text-muted-foreground">{formatDateTime(rule.lastModifiedAt)}</td>
      <td className="px-4 py-4"><AdminToggleForm action={setAvailabilityRuleActiveAdminAction} idName="ruleId" id={rule.id} value={!rule.isActive} label={rule.isActive ? copy.disableRule : copy.enableRule} dangerous={rule.isActive} reasonRequired={rule.isActive} reasonLabel={copy.reason} /></td>
    </tr>)}</tbody></table> : <div className="p-5"><EmptyState title={copy.noMatchingRules} description={copy.noMatchingRulesDescription} /></div>}</div></Card>

    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="overflow-hidden"><CardHeader><CardTitle>{copy.bookableResources}</CardTitle></CardHeader><div className="max-h-[680px] overflow-auto">{resources.length ? <table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3">{copy.bookableResource}</th><th className="p-3">{copy.providerService}</th><th className="p-3">{copy.capacity}</th><th className="p-3">{copy.controls}</th></tr></thead><tbody>{resources.map((resource) => <tr key={resource.id} className="border-t border-border align-top"><td className="p-3"><div className="font-bold">{resource.resourceName}</div><div className="text-xs text-muted-foreground">{resource.resourceType} · <Badge variant={resource.isActive ? "success" : "danger"}>{resource.isActive ? copy.active : copy.inactive}</Badge></div></td><td className="p-3"><div>{resource.providerName}</div><div className="text-xs text-muted-foreground">{resource.serviceName || copy.allServices}</div></td><td className="p-3">{resource.totalCapacity}</td><td className="p-3"><AdminToggleForm action={setBookableResourceActiveAdminAction} idName="resourceId" id={resource.id} value={!resource.isActive} label={resource.isActive ? copy.disableResource : copy.enableResource} dangerous={resource.isActive} reasonRequired={resource.isActive} reasonLabel={copy.reason} /></td></tr>)}</tbody></table> : <p className="p-5 text-sm text-muted-foreground">{copy.noAdminResources}</p>}</div></Card>
      <Card className="overflow-hidden"><CardHeader><CardTitle>{copy.providerOperatingHours}</CardTitle></CardHeader><div className="max-h-[680px] overflow-auto">{hours.length ? <table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3">{copy.provider}</th><th className="p-3">{copy.day} / {copy.hours}</th><th className="p-3">{copy.status}</th><th className="p-3">{copy.controls}</th></tr></thead><tbody>{hours.map((hour) => <tr key={hour.id} className="border-t border-border align-top"><td className="p-3 font-semibold">{hour.providerName}</td><td className="p-3"><div>{dayNames[hour.dayOfWeek] || hour.dayOfWeek}</div><div className="text-xs text-muted-foreground">{hour.opensAt || "—"} – {hour.closesAt || "—"} · {hour.slotIntervalMinutes} min</div></td><td className="p-3"><Badge variant={hour.isClosed ? "warning" : "success"}>{hour.isClosed ? copy.closed : copy.open}</Badge></td><td className="p-3"><AdminToggleForm action={setOperatingHourClosedAdminAction} idName="operatingHourId" id={hour.id} value={!hour.isClosed} label={hour.isClosed ? copy.reopen : copy.closeDay} dangerous={!hour.isClosed} reasonRequired={!hour.isClosed} reasonLabel={copy.reason} /></td></tr>)}</tbody></table> : <p className="p-5 text-sm text-muted-foreground">{copy.noOperatingHours}</p>}</div></Card>
    </div>

    <Card><CardHeader><CardTitle>{copy.recentAdministration}</CardTitle></CardHeader><CardContent>{actions.length ? <div className="space-y-2">{actions.map((action) => <div key={action.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm md:flex-row md:items-center md:justify-between"><div><span className="font-semibold">{availabilityAdminActionLabel(locale.header, action.action)}</span> <span className="font-mono text-xs text-muted-foreground">{action.entityId}</span>{action.reason ? <div className="text-xs text-muted-foreground">{action.reason}</div> : null}</div><div className="text-xs text-muted-foreground">{action.actorName} · {formatDateTime(action.createdAt)}</div></div>)}</div> : <p className="text-sm text-muted-foreground">{copy.noAdministrationActions}</p>}</CardContent></Card>
  </div>;
}

function AdminToggleForm({ action, idName, id, value, label, reasonLabel = "Reason", dangerous = false, reasonRequired = false }: { action: (formData: FormData) => Promise<void>; idName: "ruleId" | "resourceId" | "operatingHourId"; id: string; value: boolean; label: string; reasonLabel?: string; dangerous?: boolean; reasonRequired?: boolean }) {
  return <form action={action} className="flex min-w-[260px] items-center gap-1"><input type="hidden" name={idName} value={id} /><input type="hidden" name="value" value={value ? "true" : "false"} /><Input name="reason" required={reasonRequired} className="w-32 py-1.5 text-xs" placeholder={reasonLabel} /><Button type="submit" size="sm" variant={dangerous ? "danger" : "secondary"}>{label}</Button></form>;
}
