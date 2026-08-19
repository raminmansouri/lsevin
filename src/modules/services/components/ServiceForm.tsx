import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { MediaPicker } from "@core/ui/MediaPicker";
import { saveProviderServiceAction } from "../actions";
import type { ProviderService, ServiceDefinitionOption } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

export function ServiceForm({ providerId, definitions, service, locale = "en" }: { providerId: string; definitions: ServiceDefinitionOption[]; service?: ProviderService | null; locale?: string }) {
  return localizeReactTree((
    <form action={saveProviderServiceAction}>
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="serviceId" value={service?.id ?? ""} />
      <Card>
        <CardHeader><CardTitle>{service ? "ویرایش خدمت" : "خدمت جدید"}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="تعریف خدمت اصلی">
            <Select name="serviceDefinitionId" defaultValue={service?.serviceDefinitionId ?? ""} required>
              <option value="">انتخاب خدمت</option>
              {definitions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </Select>
          </Field>
          <Field label="ارز"><CurrencySelect name="currency" value={service?.currency ?? "IRR"} /></Field>
          <div className="md:col-span-2"><LocalizedField name="displayName" label="نام نمایشی خدمت" value={service?.displayNameTranslations} requiredLocale="fa-IR" /></div>
          <div className="md:col-span-2"><LocalizedField name="description" label="توضیحات خدمت" value={service?.descriptionTranslations} mode="richtext" /></div>
          <Field label="قیمت"><Input name="value" type="number" step="0.01" defaultValue={service?.value ?? "0"} required /></Field>
          <Field label="مدت زمان (دقیقه)"><Input name="durationMinutes" type="number" defaultValue={service?.durationMinutes ?? 0} /></Field>
          <Field label="فاصله اسلات‌ها"><Input name="slotIntervalMinutes" type="number" defaultValue={service?.slotIntervalMinutes ?? 15} /></Field>
          <div className="md:col-span-2"><MediaPicker name="imageUrl" providerId={providerId} value={service?.imageUrl ?? ""} mediaType="image" label="تصویر خدمت" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={service?.isActive ?? true} /> فعال</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPopular" defaultChecked={service?.isPopular ?? false} /> محبوب</label>
          <div className="md:col-span-2"><Button type="submit">ذخیره خدمت</Button></div>
        </CardContent>
      </Card>
    </form>
  ), locale);
}
