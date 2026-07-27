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
  provinceName?: FieldPath<TFieldValues>;
  cityName: FieldPath<TFieldValues>;
  locale?: string;
  fallbackLocale?: string;
  disabled?: boolean;
  className?: string;
  countryLabel?: string;
  provinceLabel?: string;
  cityLabel?: string;
  showProvince?: boolean;
};

export function RHFCountryCitySelect<TFieldValues extends FieldValues>({
  control,
  countryName,
  provinceName,
  cityName,
  locale = "en",
  fallbackLocale = "en",
  disabled,
  className,
  countryLabel,
  provinceLabel,
  cityLabel,
  showProvince = false,
}: Props<TFieldValues>) {
  const country = useController({
    control,
    name: countryName,
  });

  const city = useController({
    control,
    name: cityName,
  });

  // useController must run unconditionally, so fall back to the city field name
  // when no province field exists; the province tier is not rendered in that case.
  const province = useController({
    control,
    name: provinceName ?? cityName,
  });

  const hasProvinceField = Boolean(provinceName);
  const renderProvince = showProvince && hasProvinceField;

  return (
    <CountryCitySelect
      className={className}
      locale={locale}
      fallbackLocale={fallbackLocale}
      disabled={disabled}
      showProvince={renderProvince}
      countryLabel={countryLabel}
      provinceLabel={provinceLabel}
      cityLabel={cityLabel}
      countryId={(country.field.value as string | null | undefined) ?? null}
      provinceId={
        renderProvince
          ? ((province.field.value as string | null | undefined) ?? null)
          : null
      }
      cityId={(city.field.value as string | null | undefined) ?? null}
      onCountryChange={(nextCountryId) => {
        const previousCountryId =
          (country.field.value as string | null | undefined) ?? null;

        country.field.onChange(nextCountryId);

        if (previousCountryId !== nextCountryId) {
          if (renderProvince) province.field.onChange(null);
          city.field.onChange(null);
        }
      }}
      onProvinceChange={
        renderProvince
          ? (nextProvinceId) => {
              const previousProvinceId =
                (province.field.value as string | null | undefined) ?? null;

              province.field.onChange(nextProvinceId);

              if (previousProvinceId !== nextProvinceId) {
                city.field.onChange(null);
              }
            }
          : undefined
      }
      onCityChange={(nextCityId) => {
        city.field.onChange(nextCityId);
      }}
    />
  );
}
