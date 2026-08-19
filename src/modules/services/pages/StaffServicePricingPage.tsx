import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { getPortalLocale } from "@core/i18n/server";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { EmptyState } from "@core/ui/EmptyState";
import { Field, Input } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatMoney } from "@core/lib/format";
import { translatePortalText } from "@core/i18n/translate";
import { saveStaffServicePriceAction } from "../actions";
import { listStaffPricedServices } from "../repository";

export async function StaffServicePricingPage({ params }: { params: Record<string, string> }) {
  const user = await requireCurrentUser();
  const staffId = params.staffId;
  const claim = await requireStaffProfilePermission(user.id, staffId, "manageOwnProfile");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  const locale = await getPortalLocale();
  const services = await listStaffPricedServices(staffId, claim.serviceProviderId, locale.header);
  const copy = (source: string) => translatePortalText(locale.locale, source);

  return <div className="space-y-6">
    <PageHeader
      title={copy("My service prices")}
      description={copy("You can edit only services assigned by the clinic to your approved staff profile. Changes update the canonical LSevin provider-service price.")}
    />
    {services.length ? <div className="grid gap-4 lg:grid-cols-2">{services.map((service) => <Card key={service.providerServiceId}>
      <CardHeader><CardTitle>{service.serviceName}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">{copy("Current price")}: <b className="text-slate-950">{formatMoney(service.value, service.currency, locale.header)}</b></div>
        <form action={saveStaffServicePriceAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="staffId" value={staffId} />
          <input type="hidden" name="providerServiceId" value={service.providerServiceId} />
          <Field label={copy("Currency")}><CurrencySelect name="currency" value={service.currency} locale={locale.header} /></Field>
          <Field label={copy("Price")}><Input name="value" type="number" min="0" step="0.01" defaultValue={service.value} required /></Field>
          <div className="sm:col-span-2"><Button type="submit">{copy("Save price")}</Button></div>
        </form>
      </CardContent>
    </Card>)}</div> : <EmptyState title={copy("No assigned services")} description={copy("The clinic must first assign an active service to your staff profile.")} />}
  </div>;
}
