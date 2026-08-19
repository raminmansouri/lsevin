import { Trash2 } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { formatDate } from "@core/lib/format";
import { availabilityCopy, availabilityDayLabels } from "../i18n/copy";
import { staffAvailabilityCopy } from "../i18n/staffCopy";
import { deleteStaffAvailabilityRuleAction, saveStaffAvailabilityRuleAction } from "../actions";
import type { AvailabilityRule } from "../types";
import { ActionSubmitButton } from "./ActionSubmitButton";

export function StaffAvailabilityManager({ staffId, rules, locale, timeZone = "Asia/Tehran" }: { staffId: string; rules: AvailabilityRule[]; locale: string; timeZone?: string }) {
  const copy = availabilityCopy(locale);
  const staffCopy = staffAvailabilityCopy(locale);
  const days = availabilityDayLabels(locale);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>{staffCopy.personalRules}</CardTitle></CardHeader>
        <div className="divide-y divide-border">
          {rules.length ? rules.map((rule) => (
            <div key={rule.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <div className="font-bold text-slate-950">{rule.specificDate ? formatDate(rule.specificDate, locale, timeZone) : (rule.dayOfWeek ? days[rule.dayOfWeek - 1] : copy.anyDay)}</div>
                <div className="text-sm text-muted-foreground">{rule.startsAt ?? "—"} – {rule.endsAt ?? "—"}{rule.slotIntervalMinutes ? ` · ${rule.slotIntervalMinutes} ${copy.minutes}` : ""}</div>
              </div>
              <div className="flex gap-1"><Badge variant={rule.isActive ? "success" : "warning"}>{rule.isActive ? copy.active : copy.inactive}</Badge><Badge variant={rule.isAvailable ? "brand" : "warning"}>{rule.isAvailable ? copy.available : copy.unavailable}</Badge></div>
              <form action={deleteStaffAvailabilityRuleAction}>
                <input type="hidden" name="staffId" value={staffId} />
                <input type="hidden" name="ruleId" value={rule.id} />
                <ActionSubmitButton label="" pendingLabel={copy.deleting} ariaLabel={copy.delete} confirmText={staffCopy.deleteConfirm} variant="ghost" size="sm" className="text-red-600"><Trash2 size={15} /></ActionSubmitButton>
              </form>
            </div>
          )) : <div className="p-5 text-sm text-muted-foreground">{staffCopy.noRules}</div>}
        </div>
      </Card>

      <form action={saveStaffAvailabilityRuleAction}>
        <input type="hidden" name="staffId" value={staffId} />
        <Card><CardHeader><CardTitle>{staffCopy.addRule}</CardTitle></CardHeader><CardContent className="space-y-4">
          <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{staffCopy.providerManagedHint}</p>
          <Field label={copy.recurringDay}><Select name="dayOfWeek" defaultValue="1"><option value="">—</option>{days.map((day, index) => <option key={index} value={index + 1}>{day}</option>)}</Select></Field>
          <Field label={copy.specificDate} help={copy.chooseOneSchedule}><LocalizedDateInput name="specificDate" locale={locale} timeZone={timeZone} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label={copy.startsAt}><Input name="startsAt" type="time" /></Field><Field label={copy.endsAt}><Input name="endsAt" type="time" /></Field></div>
          <Field label={copy.intervalOverride}><Input name="slotIntervalMinutes" type="number" min="5" max="1440" step="5" /></Field>
          <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isAvailable" defaultChecked /> {copy.available}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> {copy.active}</label></div>
          <ActionSubmitButton label={copy.saveRule} pendingLabel={copy.saving} />
        </CardContent></Card>
      </form>
    </div>
  );
}
