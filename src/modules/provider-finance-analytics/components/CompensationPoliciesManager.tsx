import { Badge } from "@core/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { formatMoney } from "@core/lib/format";
import type { CompensationPolicy } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";
import { Button } from "@core/ui/Button";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { saveCompensationPolicyAction, setCompensationPolicyActiveAction } from "../actions";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";

export function CompensationPoliciesManager({ policies, locale = "fa-IR", timeZone = "Asia/Tehran" }: { policies: CompensationPolicy[]; locale?: string; timeZone?: string }) {
  return localizeReactTree((
    <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>LSevin compensation policies</CardTitle></CardHeader>
        <div className="divide-y divide-border">
        {policies.length ? policies.map((policy) => (
          <div key={policy.id} className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_auto]">
            <div>
              <div className="font-semibold">{policy.name}</div>
              <div className="text-xs text-muted-foreground">{policy.scopeType}{policy.scopeId ? ` · ${policy.scopeId}` : ""} · applies to {policy.appliesTo}</div>
              {policy.description ? <div className="mt-1 text-xs text-muted-foreground">{policy.description}</div> : null}
            </div>
            <div className="text-sm">
              <div>Mode: <b>{policy.feeMode}</b></div>
              <div>Gateway fee: <b>{policy.gatewayFeeMode}</b></div>
              <div>Priority: <b>{policy.priority}</b></div>
            </div>
            <div className="space-y-2 text-right">
              <Badge variant={policy.isActive ? "success" : "neutral"}>{policy.isActive ? "active" : "inactive"}</Badge>
              <div className="text-sm font-bold">{policy.platformPercent}% + {formatMoney(policy.platformFixedAmount, policy.currencyCode || "USD")}</div>
              <div className="text-xs text-muted-foreground">Min {formatMoney(policy.minimumPlatformAmount, policy.currencyCode || "USD")}</div>
              <form action={setCompensationPolicyActiveAction}><input type="hidden" name="policyId" value={policy.id} /><input type="hidden" name="isActive" value={policy.isActive ? "false" : "true"} /><Button type="submit" variant="secondary">{policy.isActive ? "Disable" : "Enable"}</Button></form>
            </div>
          </div>
        )) : <CardContent><p className="text-sm text-muted-foreground">No compensation policies found.</p></CardContent>}
        </div>
      </Card>
      <form action={saveCompensationPolicyAction}><Card><CardHeader><CardTitle>Create compensation policy</CardTitle></CardHeader><CardContent className="space-y-4">
        <Field label="Policy name"><Input name="name" required /></Field>
        <Field label="Description"><Textarea name="description" /></Field>
        <Field label="Scope"><Select name="scopeType"><option value="global">Global</option><option value="provider_type">Provider type</option><option value="provider">Provider</option><option value="service_definition">Service definition</option><option value="provider_service">Provider service</option><option value="addon">Add-on</option></Select></Field>
        <Field label="Scope ID" help="Leave empty only for a global policy."><Input name="scopeId" /></Field>
        <Field label="Applies to"><Select name="appliesTo"><option value="main_booking">Main booking</option><option value="child_booking">Child booking</option><option value="addon">Add-on</option></Select></Field>
        <Field label="Fee mode"><Select name="feeMode"><option value="percent">Percent</option><option value="fixed">Fixed</option><option value="hybrid">Percent + fixed</option></Select></Field>
        <Field label="Platform percent"><Input name="platformPercent" type="number" min="0" max="100" step="0.0001" defaultValue="0" required /></Field>
        <Field label="Platform fixed amount"><Input name="platformFixedAmount" type="number" min="0" step="0.01" defaultValue="0" /></Field>
        <Field label="Minimum platform amount"><Input name="minimumPlatformAmount" type="number" min="0" step="0.01" defaultValue="0" /></Field>
        <Field label="Provider percent override"><Input name="providerPercentOverride" type="number" min="0" max="100" step="0.0001" /></Field>
        <Field label="Gateway fee"><Select name="gatewayFeeMode"><option value="platform_pays">LSevin pays</option><option value="provider_pays">Provider pays</option><option value="split">Split</option></Select></Field>
        <Field label="Currency"><CurrencySelect name="currencyCode" value="IRR" /></Field>
        <Field label="Priority"><Input name="priority" type="number" defaultValue="100" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Effective from"><LocalizedDateInput name="effectiveFrom" locale={locale} timeZone={timeZone} dateTime /></Field><Field label="Effective to"><LocalizedDateInput name="effectiveTo" locale={locale} timeZone={timeZone} dateTime /></Field></div>
        <Button type="submit">Create policy</Button>
      </CardContent></Card></form>
    </div>
  ), locale);
}
