"use client";
import { SearchableReferenceSelect } from "@core/ui/SearchableReferenceSelect";
import { translatePortalText } from "@core/i18n/translate";
export function CurrencySelect({ name = "currencyCode", value = "IRR", locale, required = true }: { name?: string; value?: string; locale?: string; required?: boolean }) {
  const current = locale || (typeof document !== "undefined" ? document.documentElement.lang : "fa");
  return <SearchableReferenceSelect name={name} type="currency" value={value} locale={locale} required={required} placeholder={translatePortalText(current, "Select currency")} searchPlaceholder={translatePortalText(current, "Search currency name or code")} />;
}
