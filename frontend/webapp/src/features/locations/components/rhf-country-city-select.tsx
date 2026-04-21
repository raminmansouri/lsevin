"use client";

import {
  type Control,
  type FieldPath,
  type FieldValues,
  useController,
} from "react-hook-form";
import { CountryCitySelect } from "./country-city-select";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  countryName: FieldPath<TFieldValues>;
  cityName: FieldPath<TFieldValues>;
  locale?: string;
  fallbackLocale?: string;
  disabled?: boolean;
  className?: string;
  countryLabel?: string;
  cityLabel?: string;
};

export function RHFCountryCitySelect<TFieldValues extends FieldValues>({
  control,
  countryName,
  cityName,
  locale = "en",
  fallbackLocale = "en",
  disabled,
  className,
  countryLabel,
  cityLabel,
}: Props<TFieldValues>) {
  const country = useController({
    control,
    name: countryName,
  });

  const city = useController({
    control,
    name: cityName,
  });

  return (
    <CountryCitySelect
      className={className}
      locale={locale}
      fallbackLocale={fallbackLocale}
      disabled={disabled}
      countryLabel={countryLabel}
      cityLabel={cityLabel}
      countryId={(country.field.value as string | null | undefined) ?? null}
      cityId={(city.field.value as string | null | undefined) ?? null}
      onCountryChange={(nextCountryId) => {
        const previousCountryId =
          (country.field.value as string | null | undefined) ?? null;

        country.field.onChange(nextCountryId);

        if (previousCountryId !== nextCountryId) {
          city.field.onChange(null);
        }
      }}
      onCityChange={(nextCityId) => {
        city.field.onChange(nextCityId);
      }}
    />
  );
}