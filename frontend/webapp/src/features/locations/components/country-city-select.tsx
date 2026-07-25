"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { LocationSingleSelect } from "./location-single-select";
import {
  LOCATION_TYPE_CITY,
  LOCATION_TYPE_COUNTRY,
  LOCATION_TYPE_PROVINCE,
} from "../location-select.types";

type Props = {
  countryId: string | null | undefined;
  provinceId?: string | null | undefined;
  cityId: string | null | undefined;

  onCountryChange: (value: string | null) => void;
  onProvinceChange?: (value: string | null) => void;
  onCityChange: (value: string | null) => void;

  locale?: string;
  fallbackLocale?: string;
  disabled?: boolean;
  className?: string;

  countryLabel?: string;
  provinceLabel?: string;
  cityLabel?: string;

  /**
   * Render the province tier between country and city. Off by default so the
   * existing two-field callers keep their layout; the home location picker and
   * the admin forms opt in.
   */
  showProvince?: boolean;
};

export function CountryCitySelect({
  countryId,
  provinceId,
  cityId,
  onCountryChange,
  onProvinceChange,
  onCityChange,
  locale = "en",
  fallbackLocale = "en",
  disabled = false,
  className,
  countryLabel,
  provinceLabel,
  cityLabel,
  showProvince = false,
}: Props) {
  const t = useTranslations("Common.Location");

  useEffect(() => {
    if (!countryId && cityId) {
      onCityChange(null);
    }
  }, [countryId, cityId, onCityChange]);

  useEffect(() => {
    if (!countryId && provinceId) {
      onProvinceChange?.(null);
    }
  }, [countryId, provinceId, onProvinceChange]);

  // With the province tier shown, the city list is scoped to the province once one
  // is picked; before that it stays scoped to the country, so countries without
  // subdivisions (and any city still parented directly to a country) remain
  // reachable without forcing a province choice.
  const cityParentId = (showProvince ? provinceId : null) ?? countryId ?? null;

  const gridClassName =
    className ??
    (showProvince ? "grid gap-4 md:grid-cols-3" : "grid gap-4 md:grid-cols-2");

  return (
    <div className={gridClassName}>
      <LocationSingleSelect
        value={countryId}
        onChange={(nextCountryId) => {
          const changed = nextCountryId !== (countryId ?? null);
          onCountryChange(nextCountryId);

          if (changed) {
            onProvinceChange?.(null);
            onCityChange(null);
          }
        }}
        locationTypeId={LOCATION_TYPE_COUNTRY}
        locale={locale}
        fallbackLocale={fallbackLocale}
        label={countryLabel ?? t("country")}
        disabled={disabled}
      />

      {showProvince ? (
        <LocationSingleSelect
          key={`province-${countryId ?? "no-country"}`}
          value={provinceId}
          onChange={(nextProvinceId) => {
            const changed = nextProvinceId !== (provinceId ?? null);
            onProvinceChange?.(nextProvinceId);

            if (changed) {
              onCityChange(null);
            }
          }}
          locationTypeId={LOCATION_TYPE_PROVINCE}
          parentId={countryId ?? null}
          locale={locale}
          fallbackLocale={fallbackLocale}
          label={provinceLabel ?? t("province")}
          placeholder={countryId ? undefined : t("noProvinceSelected")}
          disabled={disabled || !countryId}
        />
      ) : null}

      <LocationSingleSelect
        key={`city-${cityParentId ?? "no-parent"}`}
        value={cityId}
        onChange={onCityChange}
        locationTypeId={LOCATION_TYPE_CITY}
        parentId={cityParentId}
        locale={locale}
        fallbackLocale={fallbackLocale}
        label={cityLabel ?? t("city")}
        placeholder={countryId ? undefined : t("noCountrySelected")}
        disabled={disabled || !countryId}
      />
    </div>
  );
}
