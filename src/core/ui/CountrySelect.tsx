"use client";
import { SearchableReferenceSelect } from "@core/ui/SearchableReferenceSelect";
import { translatePortalText } from "@core/i18n/translate";
export function CountrySelect({ name = "country", value = "", locale, required = false }: { name?: string; value?: string; locale?: string; required?: boolean }) {
  const current = locale || (typeof document !== "undefined" ? document.documentElement.lang : "fa");
  return <SearchableReferenceSelect name={name} type="country" value={value} locale={locale} required={required} placeholder={translatePortalText(current, "Select country")} searchPlaceholder={translatePortalText(current, "Search country")} />;
}
