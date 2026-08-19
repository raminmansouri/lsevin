"use client";

import { useState } from "react";
import { Field } from "@core/ui/Field";
import { SearchableReferenceSelect } from "@core/ui/SearchableReferenceSelect";
import { translatePortalText } from "@core/i18n/translate";

export function CountryCitySelect({ countryName = "country", cityName = "city", countryValue = "", cityValue = "", locale, required = true }: { countryName?: string; cityName?: string; countryValue?: string; cityValue?: string; locale?: string; required?: boolean }) {
  const [country, setCountry] = useState(countryValue);
  const [city, setCity] = useState(cityValue);
  const copy = (source: string) => translatePortalText(locale || (typeof document !== "undefined" ? document.documentElement.lang : "fa"), source);
  return <>
    <Field label={copy("Country")}><SearchableReferenceSelect name={countryName} type="country" value={country} locale={locale} required={required} placeholder={copy("Select country")} searchPlaceholder={copy("Search country")} onValueChange={(next) => { setCountry(next); setCity(""); }} /></Field>
    <Field label={copy("City")}><SearchableReferenceSelect name={cityName} type="city" value={city} locale={locale} parentCode={country} required={required} placeholder={country ? copy("Select city") : copy("Select a country first")} searchPlaceholder={copy("Search city")} onValueChange={setCity} /></Field>
  </>;
}
