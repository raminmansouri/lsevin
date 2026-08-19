import { Trash2 } from "lucide-react";
import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { getPortalLocale } from "@core/i18n/server";
import { getProviderTimeZone } from "@core/providers/timezone";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { deleteStaffAvailabilityRuleAction, saveStaffAvailabilityRuleAction } from "../actions";
import { listStaffAvailabilityRules } from "../repository";
import { formatDate } from "@core/lib/format";
import { translatePortalText } from "@core/i18n/translate";

export async function StaffAvailabilityPage({ params }: { params: Record<string, string> }) {
  const user = await requireCurrentUser();
  const staffId = params.staffId;
  const claim = await requireStaffProfilePermission(user.id, staffId, "manageOwnAvailability");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  const [locale, timeZone] = await Promise.all([getPortalLocale(), getProviderTimeZone(claim.serviceProviderId)]);
  const copy = (source: string) => translatePortalText(locale.locale, source);
  const days = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale.header, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, index + 1))));
  const rules = await listStaffAvailabilityRules(staffId, claim.serviceProviderId);

  return <div className="space-y-6">
    <PageHeader title={copy("My availability")} description={copy("Manage the days and times that customers may book your profile. Clinic rules and administrative blocks still take precedence.")} />
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card><CardHeader><CardTitle>{copy("Saved schedule")}</CardTitle></CardHeader><CardContent className="space-y-3">
        {rules.length ? rules.map((rule) => <div key={rule.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div><div className="font-bold">{rule.specificDate ? formatDate(rule.specificDate, locale.header, timeZone) : (rule.dayOfWeek ? days[rule.dayOfWeek - 1] : "—")}</div><div className="text-sm text-muted-foreground">{rule.startsAt || "—"} – {rule.endsAt || "—"}</div></div>
          <div className="flex items-center gap-2"><Badge variant={rule.isAvailable && rule.isActive ? "success" : "warning"}>{copy(rule.isAvailable ? "Available" : "Blocked")}</Badge><form action={deleteStaffAvailabilityRuleAction}><input type="hidden" name="staffId" value={staffId} /><input type="hidden" name="ruleId" value={rule.id} /><Button type="submit" variant="ghost" className="text-red-600"><Trash2 size={15} /></Button></form></div>
        </div>) : <p className="text-sm text-muted-foreground">{copy("No schedule has been saved yet.")}</p>}
      </CardContent></Card>
      <form action={saveStaffAvailabilityRuleAction}><input type="hidden" name="staffId" value={staffId} /><Card><CardHeader><CardTitle>{copy("Add availability")}</CardTitle></CardHeader><CardContent className="space-y-4">
        <Field label={copy("Recurring day")}><Select name="dayOfWeek" defaultValue="1"><option value="">{copy("Specific date")}</option>{days.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</Select></Field>
        <Field label={copy("Specific date")}><LocalizedDateInput name="specificDate" locale={locale.header} timeZone={timeZone} /></Field>
        <Field label={copy("Starts at")}><Input name="startsAt" type="time" required /></Field>
        <Field label={copy("Ends at")}><Input name="endsAt" type="time" required /></Field>
        <Field label={copy("Slot interval")}><Input name="slotIntervalMinutes" type="number" min="1" defaultValue="15" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isAvailable" defaultChecked /> {copy("Available")}</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> {copy("Active")}</label>
        <Button type="submit">{copy("Save")}</Button>
      </CardContent></Card></form>
    </div>
  </div>;
}
