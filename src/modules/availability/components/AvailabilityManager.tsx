import { Trash2 } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { normalizePortalLocale, translatedPortalValue } from "@core/i18n/config";
import { translatePortalText } from "@core/i18n/translate";
import { formatDate } from "@core/lib/format";
import { deleteAvailabilityRuleAction, deleteBookableResourceAction, deleteOperatingHourAction, saveAvailabilityRuleAction, saveBookableResourceAction, saveOperatingHourAction } from "../actions";
import type { AvailabilityRule, BookableResource, OperatingHour } from "../types";
import { ActionSubmitButton } from "./ActionSubmitButton";

export function AvailabilityManager({ providerId, hours, resources, rules, locale = "fa-IR", timeZone = "Asia/Tehran" }: { providerId: string; hours: OperatingHour[]; resources: BookableResource[]; rules: AvailabilityRule[]; locale?: string; timeZone?: string }) {
  const normalizedLocale = normalizePortalLocale(locale);
  const days = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(normalizedLocale.header, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, index + 1))));
  const englishCopy = {
    operatingHours: "Operating hours", day: "Day", hours: "Hours", slot: "Slot", closed: "Closed", setHour: "Set operating hour",
    opens: "Opens at", closes: "Closes at", slotInterval: "Slot interval", saveHours: "Save hours", resources: "Bookable resources",
    noResources: "No bookable resources yet.", addResource: "Add resource", name: "Name", description: "Description",
    type: "Type", capacity: "Capacity", code: "Code", active: "Active", inactive: "Inactive", saveResource: "Save resource",
    rules: "Availability rules", noRules: "No advanced rules yet.", addRule: "Add rule", target: "Target",
    provider: "Provider", resource: "Bookable resource", providerRule: "Provider-level rule", recurringDay: "Recurring day",
    specificDate: "Specific date", starts: "Starts at", ends: "Ends at", capacityOverride: "Capacity override", available: "Available",
    blocked: "Blocked", anyDay: "Any day", saveRule: "Save rule", generic: "Generic", remove: "Remove", deleting: "Removing...", removeConfirm: "Are you sure you want to remove this availability? This action cannot be undone.",
  };
  const copy = Object.fromEntries(Object.entries(englishCopy).map(([key, value]) => [key, translatePortalText(normalizedLocale.locale, value)])) as typeof englishCopy;

  return <div className="space-y-5">
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <Card className="overflow-hidden"><CardHeader><CardTitle>{copy.operatingHours}</CardTitle></CardHeader>
        <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="px-4 py-3 text-right">{copy.day}</th><th className="px-4 py-3 text-right">{copy.hours}</th><th className="px-4 py-3 text-right">{copy.slot}</th><th className="px-4 py-3 text-right">{copy.remove}</th></tr></thead><tbody className="divide-y divide-border">
          {hours.map((h) => <tr key={h.id}><td className="px-4 py-3 font-bold">{days[h.dayOfWeek - 1]}</td><td className="px-4 py-3">{h.isClosed ? copy.closed : `${h.opensAt ?? "—"} - ${h.closesAt ?? "—"}`}</td><td className="px-4 py-3">{h.slotIntervalMinutes} min</td><td className="px-4 py-3"><form action={deleteOperatingHourAction}><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="operatingHourId" value={h.id} /><ActionSubmitButton label={copy.remove} pendingLabel={copy.deleting} confirmText={copy.removeConfirm} variant="ghost" size="sm" className="text-red-600"><Trash2 size={14} /></ActionSubmitButton></form></td></tr>)}
        </tbody></table>
      </Card>
      <form action={saveOperatingHourAction}><input type="hidden" name="providerId" value={providerId} /><Card><CardHeader><CardTitle>{copy.setHour}</CardTitle></CardHeader><CardContent className="space-y-4">
        <Field label={copy.day}><Select name="dayOfWeek">{days.map((day, idx) => <option key={day} value={idx + 1}>{day}</option>)}</Select></Field>
        <Field label={copy.opens}><Input name="opensAt" type="time" /></Field><Field label={copy.closes}><Input name="closesAt" type="time" /></Field>
        <Field label={copy.slotInterval}><Input name="slotIntervalMinutes" type="number" defaultValue="15" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isClosed" /> {copy.closed}</label><Button type="submit">{copy.saveHours}</Button>
      </CardContent></Card></form>
    </div>

    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden"><CardHeader><CardTitle>{copy.resources}</CardTitle></CardHeader><div className="divide-y divide-border">
        {resources.length ? resources.map((resource) => <div key={resource.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><div className="font-bold text-slate-950">{translatedPortalValue(resource.nameTranslations, locale, copy.generic)}</div><div className="text-sm text-muted-foreground">{resource.resourceType} · {copy.capacity} {resource.totalCapacity}</div></div><Badge variant={resource.isActive ? "success" : "warning"}>{resource.isActive ? copy.active : copy.inactive}</Badge><form action={deleteBookableResourceAction}><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="resourceId" value={resource.id} /><ActionSubmitButton label={copy.remove} pendingLabel={copy.deleting} confirmText={copy.removeConfirm} variant="ghost" size="sm" className="text-red-600"><Trash2 size={14} /></ActionSubmitButton></form></div>) : <div className="p-5 text-sm text-muted-foreground">{copy.noResources}</div>}
      </div></Card>
      <form action={saveBookableResourceAction}><input type="hidden" name="providerId" value={providerId} /><Card><CardHeader><CardTitle>{copy.addResource}</CardTitle></CardHeader><CardContent className="space-y-4">
        <LocalizedField name="name" label={copy.name} requiredLocale="fa-IR" />
        <LocalizedField name="description" label={copy.description} mode="textarea" requiredLocale={null} />
        <Field label={copy.type}><Select name="resourceType" defaultValue="generic"><option value="generic">Generic</option><option value="room">Room</option><option value="bed">Bed</option><option value="seat">Seat</option><option value="vehicle">Vehicle</option><option value="equipment">Equipment</option><option value="unit">Unit</option></Select></Field>
        <Field label={copy.capacity}><Input name="totalCapacity" type="number" min="1" defaultValue="1" /></Field><Field label={copy.code}><Input name="code" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> {copy.active}</label><Button type="submit">{copy.saveResource}</Button>
      </CardContent></Card></form>
    </div>

    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden"><CardHeader><CardTitle>{copy.rules}</CardTitle></CardHeader><div className="divide-y divide-border">
        {rules.length ? rules.map((rule) => <div key={rule.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><div className="font-bold text-slate-950">{rule.resourceName || (rule.targetType === "provider" ? copy.provider : rule.targetType)}</div><div className="text-sm text-muted-foreground">{rule.specificDate ? formatDate(rule.specificDate, locale, timeZone) : (rule.dayOfWeek ? days[rule.dayOfWeek - 1] : copy.anyDay)} · {rule.startsAt ?? "—"} - {rule.endsAt ?? "—"}</div></div><Badge variant={rule.isAvailable && rule.isActive ? "success" : "warning"}>{rule.isAvailable ? copy.available : copy.blocked}</Badge><form action={deleteAvailabilityRuleAction}><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="ruleId" value={rule.id} /><ActionSubmitButton label={copy.remove} pendingLabel={copy.deleting} confirmText={copy.removeConfirm} variant="ghost" size="sm" className="text-red-600"><Trash2 size={14} /></ActionSubmitButton></form></div>) : <div className="p-5 text-sm text-muted-foreground">{copy.noRules}</div>}
      </div></Card>
      <form action={saveAvailabilityRuleAction}><input type="hidden" name="providerId" value={providerId} /><Card><CardHeader><CardTitle>{copy.addRule}</CardTitle></CardHeader><CardContent className="space-y-4">
        <Field label={copy.target}><Select name="targetType" defaultValue="provider"><option value="provider">{copy.provider}</option><option value="bookable_resource">{copy.resource}</option></Select></Field>
        <Field label={copy.resource}><Select name="resourceId"><option value="">{copy.providerRule}</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{translatedPortalValue(resource.nameTranslations, locale, copy.generic)}</option>)}</Select></Field>
        <Field label={copy.recurringDay}><Select name="dayOfWeek" defaultValue="1"><option value="">{copy.specificDate}</option>{days.map((day, idx) => <option key={day} value={idx + 1}>{day}</option>)}</Select></Field>
        <Field label={copy.specificDate}><LocalizedDateInput name="specificDate" locale={locale} timeZone={timeZone} /></Field><Field label={copy.starts}><Input name="startsAt" type="time" /></Field><Field label={copy.ends}><Input name="endsAt" type="time" /></Field>
        <Field label={copy.capacityOverride}><Input name="capacity" type="number" min="1" /></Field><Field label={copy.slotInterval}><Input name="slotIntervalMinutes" type="number" min="1" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isAvailable" defaultChecked /> {copy.available}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> {copy.active}</label><Button type="submit">{copy.saveRule}</Button>
      </CardContent></Card></form>
    </div>
  </div>;
}
