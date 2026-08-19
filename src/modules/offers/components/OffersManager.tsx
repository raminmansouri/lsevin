import { Trash2 } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { formatDateTime } from "@core/lib/format";
import { translatedPortalValue } from "@core/i18n/config";
import { localizeReactTree } from "@core/i18n/localize-tree";

import { createOfferAction, deleteOfferAction } from "../actions";
import type { OfferServiceOption, ProviderOffer } from "../types";

const label = (service: OfferServiceOption, locale: string) => translatedPortalValue(service.displayNameTranslations, locale, service.serviceDefinitionName);

export function OffersManager({ providerId, offers, services, locale = "fa-IR", timeZone = "Asia/Tehran" }: { providerId: string; offers: ProviderOffer[]; services: OfferServiceOption[]; locale?: string; timeZone?: string }) {
  return localizeReactTree((
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Offers</CardTitle></CardHeader>
        <div className="divide-y divide-border">
          {offers.length ? offers.map((offer) => (
            <div key={offer.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <div className="font-bold text-slate-950" data-user-content>{offer.title}</div>
                <div className="text-sm text-muted-foreground"><span data-user-content>{offer.serviceName}</span> · {offer.discountPercent}% · valid until {formatDateTime(offer.validUntil, locale, timeZone)}</div>
              </div>
              <Badge variant={offer.isActive ? "success" : "warning"}>{offer.isActive ? "Active" : "Inactive"}</Badge>
              <form action={deleteOfferAction}>
                <input type="hidden" name="providerId" value={providerId} />
                <input type="hidden" name="offerId" value={offer.id} />
                <Button type="submit" variant="ghost" className="text-red-600"><Trash2 size={15} /></Button>
              </form>
            </div>
          )) : <div className="p-5 text-sm text-muted-foreground">No offers yet.</div>}
        </div>
      </Card>
      <form action={createOfferAction}>
        <input type="hidden" name="providerId" value={providerId} />
        <Card>
          <CardHeader><CardTitle>Create offer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Service"><Select name="providerServiceId" required><option value="">Select service</option>{services.map((service) => <option key={service.id} value={service.id} data-user-content>{label(service, locale)}</option>)}</Select></Field>
            <Field label="Title"><Input name="title" required /></Field>
            <Field label="Subtitle"><Input name="subtitle" /></Field>
            <Field label="Discount percent"><Input name="discountPercent" type="number" step="0.01" min="0" required /></Field>
            <Field label="Valid until"><LocalizedDateInput name="validUntil" locale={locale} timeZone={timeZone} dateTime dateTimeStorage="local" required /></Field>
            <Field label="Code"><Input name="code" /></Field>
            <Field label="Usage limit"><Input name="usageLimit" type="number" min="1" /></Field>
            <LocalizedField name="description" label="Description" mode="textarea" requiredLocale={null} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" /> Featured</label>
            <Button type="submit">Create offer</Button>
          </CardContent>
        </Card>
      </form>
    </div>
    ), locale);
}
