import Link from "next/link";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { CountryCitySelect } from "@core/ui/CountryCitySelect";
import { PhoneCountryCodeSelect } from "@core/ui/PhoneCountryCodeSelect";
import { createApplicationAction } from "../actions";
import type { ProviderTypeOption } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

type ApplicationMode = "provider" | "staff";

export function ApplicationForm({ providerTypes, mode = "provider", locale = "en" }: { providerTypes: ProviderTypeOption[]; mode?: ApplicationMode; locale?: string }) {
  const isStaff = mode === "staff";
  return localizeReactTree((
    <form action={createApplicationAction}>
      <input type="hidden" name="applicationAudience" value={mode} />
      <Card>
        <CardHeader><CardTitle>{isStaff ? "درخواست مالکیت پروفایل کارمند" : "درخواست همکاری ارائه‌دهنده"}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={isStaff ? "نوع مرکز مرتبط" : "نوع ارائه‌دهنده"}><Select name="providerTypeId" required><option value="">انتخاب نوع</option>{providerTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</Select></Field>
          <Field label={isStaff ? "نام مرکز یا کلینیک" : "نام قانونی"}><Input name="legalName" required /></Field>
          <div className="md:col-span-2"><LocalizedField name="displayName" label={isStaff ? "نام نمایشی کارمند" : "نام نمایشی ارائه‌دهنده"} requiredLocale="fa-IR" /></div>
          {isStaff ? <><Field label="عنوان حرفه‌ای"><Input name="staffTitle" required /></Field><Field label="تخصص یا نقش"><Input name="staffSpecialty" required /></Field><Field label="لینک یا شناسه پروفایل موجود"><Input name="existingProfileReference" /></Field><Field label="مسئول تماس مرکز"><Input name="contactPerson" /></Field></> : <Field label="شخص رابط"><Input name="contactPerson" /></Field>}
          <Field label="ایمیل"><Input name="email" type="email" required /></Field>
          <div className="grid grid-cols-[minmax(170px,0.8fr)_1.2fr] gap-2"><Field label="پیش‌شماره"><PhoneCountryCodeSelect name="phoneCountryCode" value="+98" locale={locale} required /></Field><Field label="تلفن"><Input name="phoneNumber" required dir="ltr" inputMode="tel" autoComplete="tel-national" className="text-left font-mono tabular-nums" /></Field></div>
          <Field label={isStaff ? "صفحه حرفه‌ای" : "وب‌سایت"}><Input name="websiteUrl" placeholder="https://" /></Field>
          <CountryCitySelect />
          <div className="md:col-span-2"><Field label={isStaff ? "نشانی مرکز" : "نشانی"}><Textarea name="addressText" required /></Field></div>
          <div className="md:col-span-2"><Field label={isStaff ? "مدارک و توضیحات" : "توضیحات تکمیلی"}><Textarea name="notes" /></Field></div>
          {isStaff ? <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">فعال‌سازی مالکیت پس از تأیید مرکز، بررسی السوین و در صورت نیاز پرداخت صورتحساب انجام می‌شود.</div> : null}
          <div className="md:col-span-2 flex flex-wrap items-center gap-3"><Button type="submit">{isStaff ? "ارسال درخواست کارمند" : "ارسال درخواست"}</Button>{isStaff ? <Link href="/become-provider" className="text-sm font-bold text-primary hover:underline">ثبت مرکز یا ارائه‌دهنده</Link> : <Link href="/become-staff" className="text-sm font-bold text-primary hover:underline">درخواست مالکیت صفحه کارمند</Link>}</div>
        </CardContent>
      </Card>
    </form>
  ), locale);
}
