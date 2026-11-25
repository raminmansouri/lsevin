"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Award, BadgeCheck, Check, Globe, MapPin, Star, X } from "lucide-react";

import { AsyncSearchableSingleSelect } from "@/components/admin/forms/extensions/async-searchable-single-select";
import PriceRangeFilter from "../explore/PriceRangeFilter";
import { SpecialtyMultiSelect } from "./SpecialtyMultiSelect";
import {
  loadMapDiscoveryLocationByValue,
  loadMapDiscoveryLocationOptions,
} from "./location-options.actions";
import {
  DEFAULT_DISTANCE_KM,
  MAX_DISTANCE_KM,
  MIN_DISTANCE_KM,
  isUnlimitedDistance,
  languageLabel,
} from "./nearby-filters";
import type { NearbyCurrencyOption, NearbyFiltersInput } from "./nearby.data";

/** What the map / list "advanced filters" panel edits. 0 / null mean "not filtered". */
export type NearbyFilterValues = {
  countryCode: string | null;
  cityCode: string | null;
  minPrice: number;
  maxPrice: number;
  currencyCode: string | null;
  distanceKm: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  specialties: string[];
};

export function nearbyFilterValuesFrom(filters: NearbyFiltersInput | null): NearbyFilterValues {
  return {
    countryCode: filters?.countryCode ?? null,
    cityCode: filters?.cityCode ?? null,
    minPrice: filters?.minPrice || 0,
    // 5000 was the old slider's "no limit" value.
    maxPrice: filters && filters.maxPrice !== 5000 ? filters.maxPrice || 0 : 0,
    currencyCode: filters?.currencyCode ?? null,
    distanceKm: filters?.distanceKm || DEFAULT_DISTANCE_KM,
    minRating: filters?.minRating || 0,
    verifiedOnly: filters?.verifiedOnly ?? false,
    languages: filters?.languages ?? [],
    specialties: filters?.specialties ?? [],
  };
}

/** How many panel filters are on, for the badge on the filter button. */
export function countNearbyFilterValues(values: NearbyFilterValues): number {
  let count = 0;
  if (values.countryCode) count += 1;
  if (values.cityCode) count += 1;
  if (values.minPrice > 0 || values.maxPrice > 0) count += 1;
  if (values.distanceKm !== DEFAULT_DISTANCE_KM) count += 1;
  if (values.minRating > 0) count += 1;
  if (values.verifiedOnly) count += 1;
  if (values.languages.length > 0) count += 1;
  if (values.specialties.length > 0) count += 1;
  return count;
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** "sheet" slides up from the bottom (phones); "dialog" is centred (desktop). */
  variant: "sheet" | "dialog";
  filters: NearbyFiltersInput;
  locale: string;
  availableLanguages: string[];
  availableSpecialties: string[];
  availableCurrencies: NearbyCurrencyOption[];
  onApply: (values: NearbyFilterValues) => void;
  onClear: () => void;
};

/**
 * The map / provider-list "advanced filters" panel (location, price, distance,
 * rating, verified, languages, specialties), shared by the phone screen and the
 * desktop view so both offer the same search.
 */
export default function NearbyFilterPanel({
  open,
  onClose,
  variant,
  filters,
  locale,
  availableLanguages,
  availableSpecialties,
  availableCurrencies,
  onApply,
  onClear,
}: Props) {
  const t = useTranslations("MapDiscovery");
  const tExplore = useTranslations("Explore");
  const [mounted, setMounted] = useState(false);
  const initialValues = useMemo(() => nearbyFilterValuesFrom(filters), [filters]);
  const form = useForm<NearbyFilterValues>({ defaultValues: initialValues });

  useEffect(() => setMounted(true), []);

  // Every time the panel opens it starts from the filters in the URL.
  useEffect(() => {
    if (open) form.reset(initialValues);
  }, [open, initialValues, form]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const activeFilters = form.watch();
  const selectedCountryCode = activeFilters.countryCode ?? null;

  const loadCountryOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) =>
      loadMapDiscoveryLocationOptions({ kind: "country", locale, search: args.search, page: args.page, pageSize: args.pageSize }),
    [locale],
  );
  const loadCountryByValue = useCallback(
    (value: string) => loadMapDiscoveryLocationByValue({ kind: "country", locale, value }),
    [locale],
  );
  const loadCityOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) =>
      loadMapDiscoveryLocationOptions({
        kind: "city",
        locale,
        countryCode: selectedCountryCode,
        search: args.search,
        page: args.page,
        pageSize: args.pageSize,
      }),
    [locale, selectedCountryCode],
  );
  const loadCityByValue = useCallback(
    (value: string) => loadMapDiscoveryLocationByValue({ kind: "city", locale, value, countryCode: selectedCountryCode }),
    [locale, selectedCountryCode],
  );

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex bg-black/50 animate-in fade-in duration-200 ${
        variant === "sheet" ? "items-end" : "items-center justify-center p-6"
      }`}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={form.handleSubmit((values) => {
          onClose();
          onApply(values);
        })}
        role="dialog"
        aria-modal="true"
        aria-label={t("advancedFilters")}
        className={
          variant === "sheet"
            ? "relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
            : "relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
        }
      >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {t("advancedFilters")}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {t("refineSearchResults")}
              </p>
            </div>

            <div className="px-5 py-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.location")}
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AsyncSearchableSingleSelect
                    label={t("filters.country")}
                    value={activeFilters.countryCode}
                    placeholder={t("filters.selectCountry")}
                    searchPlaceholder={t("filters.searchCountries")}
                    emptyText={t("filters.noCountriesFound")}
                    loadOptions={loadCountryOptions}
                    loadByValue={loadCountryByValue}
                    onChange={(value) => {
                      form.setValue("countryCode", value, {
                        shouldDirty: true,
                      });
                      form.setValue("cityCode", null, { shouldDirty: true });
                    }}
                  />

                  <AsyncSearchableSingleSelect
                    label={t("filters.city")}
                    value={activeFilters.cityCode}
                    disabled={!activeFilters.countryCode}
                    placeholder={
                      activeFilters.countryCode
                        ? t("filters.selectCity")
                        : t("filters.selectCountryFirst")
                    }
                    searchPlaceholder={t("filters.searchCities")}
                    emptyText={
                      activeFilters.countryCode
                        ? t("filters.noCitiesFound")
                        : t("filters.selectCountryFirst")
                    }
                    loadOptions={loadCityOptions}
                    loadByValue={loadCityByValue}
                    onChange={(value) =>
                      form.setValue("cityCode", value, { shouldDirty: true })
                    }
                  />
                </div>
              </div>

              <PriceRangeFilter
                currencies={availableCurrencies}
                value={{
                  currencyCode: activeFilters.currencyCode,
                  minPrice: activeFilters.minPrice,
                  maxPrice: activeFilters.maxPrice,
                }}
                onChange={(next) => {
                  form.setValue("currencyCode", next.currencyCode, { shouldDirty: true });
                  form.setValue("minPrice", next.minPrice, { shouldDirty: true });
                  form.setValue("maxPrice", next.maxPrice, { shouldDirty: true });
                }}
                locale={locale}
                labels={{
                  title: t("filters.priceRange"),
                  currency: t("filters.currency"),
                  min: tExplore("filters.minPrice"),
                  max: tExplore("filters.maxPrice"),
                }}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">
                      {t("filters.distance")}
                    </h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    {isUnlimitedDistance(activeFilters.distanceKm)
                      ? t("filters.unlimited")
                      : `${activeFilters.distanceKm} km`}
                  </span>
                </div>
                {/* Follows the page direction like the price slider: in Persian
                    1 km is on the right and "unlimited" on the left, and the
                    filled part grows from the right with the thumb. */}
                <div className="space-y-2">
                  <div className="relative h-6">
                    <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
                    <div
                      className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#083f30]"
                      style={{
                        insetInlineStart: 0,
                        insetInlineEnd: `${100 - ((activeFilters.distanceKm - MIN_DISTANCE_KM) / (MAX_DISTANCE_KM - MIN_DISTANCE_KM)) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      aria-label={t("filters.distance")}
                      min={MIN_DISTANCE_KM}
                      max={MAX_DISTANCE_KM}
                      value={activeFilters.distanceKm}
                      onChange={(e) =>
                        form.setValue("distanceKm", Number(e.target.value), {
                          shouldDirty: true,
                        })
                      }
                      className="absolute inset-x-0 top-0 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#083f30] [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#083f30]"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{t("filters.oneKm")}</span>
                    <span>{t("filters.unlimited")}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t("filters.distanceCaption")}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.minimumRating")}
                  </h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 3.0, 3.5, 4.0, 4.5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      onClick={() =>
                        form.setValue("minRating", rating, {
                          shouldDirty: true,
                        })
                      }
                      className={`h-12 rounded-xl flex flex-col items-center justify-center font-semibold transition-all ${activeFilters.minRating === rating ? "bg-[#083f30] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      <span className="text-sm">
                        {rating === 0 ? t("filters.any") : `${rating}+`}
                      </span>
                      {rating > 0 && (
                        <Star size={12} className="fill-current" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("verifiedOnly", !activeFilters.verifiedOnly, {
                      shouldDirty: true,
                    })
                  }
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${activeFilters.verifiedOnly ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeFilters.verifiedOnly ? "bg-green-600" : "bg-gray-100"}`}
                    >
                      <BadgeCheck
                        size={24}
                        className={
                          activeFilters.verifiedOnly
                            ? "text-white"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">
                        {t("filters.verifiedProvidersOnly")}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t("filters.showOnlyAccreditedProviders")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${activeFilters.verifiedOnly ? "bg-green-600" : "bg-gray-200"}`}
                  >
                    {activeFilters.verifiedOnly && (
                      <Check size={16} className="text-white" />
                    )}
                  </div>
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.languagesSpoken")}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => {
                        const current = activeFilters.languages;
                        const next = current.includes(lang)
                          ? current.filter((item) => item !== lang)
                          : [...current, lang];
                        form.setValue("languages", next, { shouldDirty: true });
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${activeFilters.languages.includes(lang) ? "bg-[#083f30] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {languageLabel(lang, locale)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.specialties")}
                  </h3>
                </div>
                <SpecialtyMultiSelect
                  values={activeFilters.specialties}
                  options={availableSpecialties}
                  onChange={(next) =>
                    form.setValue("specialties", next, { shouldDirty: true })
                  }
                  placeholder={t("filters.selectSpecialties")}
                  searchPlaceholder={t("filters.searchSpecialties")}
                  emptyText={t("filters.noSpecialtiesFound")}
                  selectedCountLabel={(count) =>
                    t("filters.specialtiesSelected", { count })
                  }
                />
              </div>
            </div>

            <div className={`sticky bottom-0 z-20 bg-white border-t border-gray-200 px-5 pt-4 ${variant === "sheet" ? "pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "pb-4"}`}>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    form.reset(nearbyFilterValuesFrom(null));
                    onClose();
                    onClear();
                  }}
                  className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
                >
                  {t("clearAll")}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white font-bold hover:shadow-lg transition-all"
                >
                  {t("applyFilters")}
                </button>
              </div>
            </div>
      </form>
    </div>,
    document.body,
  );
}
