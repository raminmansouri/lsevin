"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { BadgeCheck, Check, Clock, Globe, ListOrdered, MapPin, Star, X } from "lucide-react";

import LazySearchableSelect from "./LazySearchableSelect";
import PriceRangeFilter from "./PriceRangeFilter";
import {
  getExploreCityOptionAction,
  getExploreCountryOptionAction,
  searchExploreCityOptionsAction,
  searchExploreCountryOptionsAction,
} from "./explore-location.actions";
import type {
  ExploreCurrencyOption,
  ExploreFiltersInput,
  ExploreLanguageOption,
  ExploreResponseTime,
  ExploreSort,
} from "./explore.data";

/** What the panel edits. 0 / null / "any" mean "not filtered". */
export type ExploreFilterValues = {
  countryCode: string | null;
  cityCode: string | null;
  currencyCode: string | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  verifiedOnly: boolean;
  responseTime: ExploreResponseTime;
  languages: string[];
  sort: ExploreSort;
};

export const EMPTY_FILTER_VALUES: ExploreFilterValues = {
  countryCode: null,
  cityCode: null,
  currencyCode: null,
  minPrice: 0,
  maxPrice: 0,
  minRating: 0,
  verifiedOnly: false,
  responseTime: "any",
  languages: [],
  sort: "recommended",
};

export function filterValuesFrom(filters: ExploreFiltersInput): ExploreFilterValues {
  return {
    countryCode: filters.countryCode,
    cityCode: filters.cityCode,
    currencyCode: filters.currencyCode,
    minPrice: filters.minPrice > 0 ? filters.minPrice : 0,
    // 5000 was the old mobile slider's "no limit" value.
    maxPrice: filters.maxPrice > 0 && filters.maxPrice !== 5000 ? filters.maxPrice : 0,
    minRating: filters.minRating > 0 ? filters.minRating : 0,
    verifiedOnly: filters.verifiedOnly,
    responseTime: filters.responseTime,
    languages: filters.languages,
    sort: filters.sort,
  };
}

/** How many panel filters are on, for the badge on the filter button. */
export function countActiveFilterValues(values: ExploreFilterValues): number {
  let count = 0;
  if (values.countryCode) count += 1;
  if (values.cityCode) count += 1;
  if (values.minPrice > 0 || values.maxPrice > 0) count += 1;
  if (values.minRating > 0) count += 1;
  if (values.verifiedOnly) count += 1;
  if (values.languages.length > 0) count += 1;
  if (values.responseTime !== "any") count += 1;
  if (values.sort !== "recommended") count += 1;
  return count;
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** "sheet" slides up from the bottom (phones); "dialog" is centred (desktop). */
  variant: "sheet" | "dialog";
  filters: ExploreFiltersInput;
  availableLanguages: ExploreLanguageOption[];
  availableCurrencies: ExploreCurrencyOption[];
  locale: string;
  onApply: (values: ExploreFilterValues) => void;
  onClear: () => void;
};

/**
 * The advanced filter panel, shared by the phone and desktop explore pages so
 * both offer the same filters: location, currency + price range, rating,
 * response time, verified only, languages and sort.
 */
export default function ExploreFilterPanel({
  open,
  onClose,
  variant,
  filters,
  availableLanguages,
  availableCurrencies,
  locale,
  onApply,
  onClear,
}: Props) {
  const t = useTranslations("Explore");
  const tBooking = useTranslations("Booking");
  const [mounted, setMounted] = useState(false);

  const initialValues = useMemo(() => filterValuesFrom(filters), [filters]);
  const form = useForm<ExploreFilterValues>({ defaultValues: initialValues });

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

  const values = form.watch();
  const set = <K extends keyof ExploreFilterValues>(key: K, value: ExploreFilterValues[K]) =>
    form.setValue(key, value as never, { shouldDirty: true });

  const loadCountryOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) => searchExploreCountryOptionsAction({ locale, ...args }),
    [locale],
  );
  const loadSelectedCountry = useCallback((value: string) => getExploreCountryOptionAction({ locale, value }), [locale]);
  const loadCityOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) =>
      searchExploreCityOptionsAction({ locale, countryCode: values.countryCode, ...args }),
    [locale, values.countryCode],
  );
  const loadSelectedCity = useCallback(
    (value: string) => getExploreCityOptionAction({ locale, countryCode: values.countryCode, value }),
    [locale, values.countryCode],
  );

  const languageLabel = useMemo(
    () => new Map(availableLanguages.map((language) => [language.value, language.label])),
    [availableLanguages],
  );

  if (!open || !mounted) return null;

  const chip = (active: boolean) =>
    `h-12 rounded-xl font-semibold transition-all ${
      active ? "bg-[#083f30] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;
  const selectClass =
    "h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10";
  const panel = (
    <form
      onSubmit={form.handleSubmit((submitted) => {
        onClose();
        onApply(submitted);
      })}
      role="dialog"
      aria-modal="true"
      aria-label={t("filters.title")}
      className={
        variant === "sheet"
          ? "relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white animate-in slide-in-from-bottom duration-300"
          : "relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
      }
    >
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t("filters.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tBooking("close")}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          >
            <X size={20} className="text-gray-600" aria-hidden="true" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{t("filters.subtitle")}</p>
      </div>

      <div className="space-y-6 px-5 py-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <MapPin size={20} className="text-[#083f30]" />
            <h3 className="font-sans font-bold text-gray-900">{t("filters.location")}</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LazySearchableSelect
              label={t("filters.country")}
              value={values.countryCode}
              placeholder={t("filters.selectCountry")}
              searchPlaceholder={t("filters.searchCountries")}
              emptyText={t("filters.noCountries")}
              loadOptions={loadCountryOptions}
              loadByValue={loadSelectedCountry}
              onChange={(value) => {
                set("countryCode", value);
                set("cityCode", null);
              }}
            />
            <LazySearchableSelect
              key={values.countryCode ?? "no-country"}
              label={t("filters.city")}
              value={values.cityCode}
              disabled={!values.countryCode}
              placeholder={values.countryCode ? t("filters.selectCity") : t("filters.selectCountryFirst")}
              searchPlaceholder={t("filters.searchCities")}
              emptyText={t("filters.noCitiesForCountry")}
              loadOptions={loadCityOptions}
              loadByValue={loadSelectedCity}
              onChange={(value) => set("cityCode", value)}
            />
          </div>
        </section>

        <PriceRangeFilter
          currencies={availableCurrencies}
          value={{ currencyCode: values.currencyCode, minPrice: values.minPrice, maxPrice: values.maxPrice }}
          onChange={(next) => {
            set("currencyCode", next.currencyCode);
            set("minPrice", next.minPrice);
            set("maxPrice", next.maxPrice);
          }}
          locale={locale}
          labels={{
            title: t("filters.priceRange"),
            currency: t("filters.currency"),
            min: t("filters.minPrice"),
            max: t("filters.maxPrice"),
          }}
        />

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Star size={20} className="text-[#083f30]" />
            <h3 className="font-sans font-bold text-gray-900">{t("filters.minimumRating")}</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[0, 3, 3.5, 4, 4.5].map((rating) => (
              <button
                type="button"
                key={rating}
                onClick={() => set("minRating", rating)}
                className={`${chip(values.minRating === rating)} flex flex-col items-center justify-center`}
              >
                <span className="text-sm">{rating === 0 ? t("filters.any") : `${rating}+`}</span>
                {rating > 0 ? <Star size={12} className="fill-current" /> : null}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock size={20} className="text-[#083f30]" />
            <h3 className="font-sans font-bold text-gray-900">{t("filters.responseTime")}</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "any" as const, label: t("filters.response.any") },
              { value: "fast" as const, label: t("filters.response.fast") },
              { value: "instant" as const, label: t("filters.response.instant") },
            ].map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => set("responseTime", option.value)}
                className={chip(values.responseTime === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <button
            type="button"
            onClick={() => set("verifiedOnly", !values.verifiedOnly)}
            className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
              values.verifiedOnly ? "border-green-200 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  values.verifiedOnly ? "bg-green-600" : "bg-gray-100"
                }`}
              >
                <BadgeCheck size={24} className={values.verifiedOnly ? "text-white" : "text-gray-400"} />
              </div>
              <div className="text-start">
                <h3 className="font-sans font-bold text-gray-900">{t("filters.verifiedOnly")}</h3>
                <p className="text-sm text-gray-600">{t("filters.verifiedOnlyDescription")}</p>
              </div>
            </div>
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                values.verifiedOnly ? "bg-green-600" : "bg-gray-200"
              }`}
            >
              {values.verifiedOnly ? <Check size={16} className="text-white" /> : null}
            </div>
          </button>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Globe size={20} className="text-[#083f30]" />
            <h3 className="font-sans font-bold text-gray-900">{t("filters.languagesSpoken")}</h3>
          </div>
          <select
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (value && !values.languages.includes(value)) set("languages", [...values.languages, value]);
            }}
            className={selectClass}
          >
            <option value="">{t("filters.selectLanguage")}</option>
            {availableLanguages
              .filter((language) => !values.languages.includes(language.value))
              .map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label} ({language.count.toLocaleString(locale)})
                </option>
              ))}
          </select>
          {values.languages.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {values.languages.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("languages", values.languages.filter((item) => item !== value))}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#083f30] px-3 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  {languageLabel.get(value) ?? value}
                  <X size={14} />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <ListOrdered size={20} className="text-[#083f30]" />
            <h3 className="font-sans font-bold text-gray-900">{t("sort.title")}</h3>
          </div>
          <select
            value={values.sort}
            onChange={(event) => set("sort", event.target.value as ExploreSort)}
            className={selectClass}
          >
            <option value="recommended">{t("sort.recommended")}</option>
            <option value="price_low">{t("sort.priceLow")}</option>
            <option value="price_high">{t("sort.priceHigh")}</option>
            <option value="rating">{t("sort.rating")}</option>
            <option value="newest">{t("sort.newest")}</option>
          </select>
        </section>
      </div>

      <div
        className={`sticky bottom-0 z-20 border-t border-gray-200 bg-white px-5 pt-4 ${
          variant === "sheet" ? "pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "pb-4"
        }`}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              form.reset(EMPTY_FILTER_VALUES);
              onClose();
              onClear();
            }}
            className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-gray-900 transition-colors hover:bg-gray-200"
          >
            {t("actions.clearAll")}
          </button>
          <button
            type="submit"
            className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] font-bold text-white transition-all hover:shadow-lg"
          >
            {t("actions.applyFilters")}
          </button>
        </div>
      </div>
    </form>
  );

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex bg-black/50 animate-in fade-in duration-200 ${
        variant === "sheet" ? "items-end" : "items-center justify-center p-6"
      }`}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      {panel}
    </div>,
    document.body,
  );
}
