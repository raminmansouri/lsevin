import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { CountryCitySelect } from "@core/ui/CountryCitySelect";
import { PhoneCountryCodeSelect } from "@core/ui/PhoneCountryCodeSelect";
import { MediaPicker } from "@core/ui/MediaPicker";
import { updateProviderProfileAction } from "../actions";
import type { ProviderProfile } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

export function ProfileForm({ profile, locale = "en" }: { profile: ProviderProfile; locale?: string }) {
  return localizeReactTree((
    <form action={updateProviderProfileAction}>
      <input type="hidden" name="providerId" value={profile.id} />
      <Card>
        <CardHeader><CardTitle>پروفایل ارائه‌دهنده</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><LocalizedField name="name" label="نام ارائه‌دهنده" value={profile.nameTranslations} requiredLocale="fa-IR" /></div>
          <div className="md:col-span-2"><LocalizedField name="description" label="توضیحات" value={profile.descriptionTranslations} mode="richtext" help="برای هر زبان محتوای مستقل و قالب‌بندی‌شده وارد کنید." /></div>
          <Field label="ایمیل"><Input name="email" type="email" defaultValue={profile.email} required /></Field>
          <div className="grid grid-cols-[minmax(170px,0.8fr)_1.2fr] gap-2"><Field label="پیش‌شماره"><PhoneCountryCodeSelect name="phoneNumberCountryCode" value={profile.phoneNumberCountryCode} locale={locale} /></Field><Field label="تلفن"><Input name="phoneNumber" defaultValue={profile.phoneNumber} dir="ltr" inputMode="tel" autoComplete="tel-national" className="text-left font-mono tabular-nums" /></Field></div>
          <CountryCitySelect countryValue={profile.country} cityValue={profile.city} />
          <Field label="کد پستی"><Input name="zipCode" defaultValue={profile.zipCode ?? ""} /></Field>
          <Field label="منطقه زمانی"><Input name="timezoneId" defaultValue={profile.timezoneId ?? "Asia/Tehran"} /></Field>
          <Field label="عرض جغرافیایی"><Input name="latitude" defaultValue={profile.latitude ?? ""} /></Field>
          <Field label="طول جغرافیایی"><Input name="longitude" defaultValue={profile.longitude ?? ""} /></Field>
          <div className="md:col-span-2"><MediaPicker name="imageUrl" providerId={profile.id} value={profile.imageUrl ?? ""} mediaType="image" label="تصویر اصلی پروفایل" /></div>
          <Field label="زبان‌های ارائه خدمت" help="با کاما جدا کنید"><Input name="languages" defaultValue={(profile.languages ?? []).join(", ")} /></Field>
          <Field label="تخصص‌ها" help="با کاما جدا کنید"><Input name="specialties" defaultValue={(profile.specialties ?? []).join(", ")} /></Field>
          <div className="md:col-span-2"><Button type="submit">ذخیره پروفایل</Button></div>
        </CardContent>
      </Card>
    </form>
  ), locale);
}
