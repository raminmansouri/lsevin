"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  BadgeCheck,
  Check,
  Clock,
  DollarSign,
  SlidersHorizontal,
  Star,
  Globe,
  X,
} from "lucide-react";

import type {
  ExploreFiltersInput,
  ExploreResponseTime,
  ExploreSort,
} from "./explore.data";

type LanguageOption = {
  value: string;
  label: string;
  count: number;
};

type ExploreFiltersProps = {
  filters: ExploreFiltersInput;
  availableLanguages: LanguageOption[];
};

type ExploreFiltersFormValues = {
  minPrice: string;
  maxPrice: string;
  currencyCode: string;
  minRating: string;
  verifiedOnly: boolean;
  responseTime: ExploreResponseTime;
  sort: ExploreSort;
  languages: string[];
};

export default function ExploreFilters({
  filters,
  availableLanguages,
}: ExploreFiltersProps) {
  const t = useTranslations("Explore");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<ExploreFiltersFormValues>({
    defaultValues: {
      minPrice: filters.minPrice?.toString() ?? "",
      maxPrice: filters.maxPrice?.toString() ?? "",
      currencyCode: filters.currencyCode ?? "",
      minRating: filters.minRating?.toString() ?? "",
      verifiedOnly: filters.verifiedOnly,
      responseTime: filters.responseTime,
      sort: filters.sort,
      languages: filters.languages,
    },
  });

  const selectedLanguages = form.watch("languages");
  const selectedRating = form.watch("minRating");
  const verifiedOnly = form.watch("verifiedOnly");
  const responseTime = form.watch("responseTime");

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice != null) count += 1;
    if (filters.maxPrice != null) count += 1;
    if (filters.currencyCode) count += 1;
    if (filters.minRating != null) count += 1;
    if (filters.verifiedOnly) count += 1;
    if (filters.languages.length > 0) count += 1;
    if (filters.countryCode) count += 1;
    if (filters.cityCode) count += 1;
    if (filters.responseTime !== "any") count += 1;
    if (filters.sort !== "recommended") count += 1;
    return count;
  }, [filters]);

  function applyFilters(values: ExploreFiltersFormValues) {
    const params = new URLSearchParams(searchParams.toString());

    setOrDelete(params, "minPrice", values.minPrice.trim());
    setOrDelete(params, "maxPrice", values.maxPrice.trim());
    setOrDelete(params, "currency", values.currencyCode.trim().toUpperCase());
    setOrDelete(params, "minRating", values.minRating.trim());
    setOrDelete(params, "verified", values.verifiedOnly ? "1" : "");
    setOrDelete(
      params,
      "responseTime",
      values.responseTime !== "any" ? values.responseTime : "",
    );
    setOrDelete(
      params,
      "languages",
      values.languages.length > 0 ? values.languages.join(",") : "",
    );
    setOrDelete(
      params,
      "sort",
      values.sort !== "recommended" ? values.sort : "",
    );

    startTransition(() => {
      router.push(`?${params.toString()}`);
      setOpen(false);
    });
  }

  function clearFilters() {
    form.reset({
      minPrice: "",
      maxPrice: "",
      currencyCode: "",
      minRating: "",
      verifiedOnly: false,
      responseTime: "any",
      sort: "recommended",
      languages: [],
    });

    const params = new URLSearchParams(searchParams.toString());
    [
      "minPrice",
      "maxPrice",
      "currency",
      "currencyCode",
      "minRating",
      "verified",
      "responseTime",
      "languages",
      "country",
      "countryCode",
      "city",
      "cityCode",
      "sort",
    ].forEach((key) => params.delete(key));

    startTransition(() => {
      router.push(`?${params.toString()}`);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800 text-white transition hover:bg-emerald-700"
      >
        <SlidersHorizontal size={18} />
        {activeFilterCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 px-1 text-[10px] font-bold text-neutral-950">
            {activeFilterCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-neutral-950">{t("filtersPanel.title")}</h2>
                  <p className="text-sm text-neutral-600">
                    {t("filtersPanel.subtitle")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form
              onSubmit={form.handleSubmit(applyFilters)}
              className="space-y-6 px-5 py-6"
            >
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-800" />
                  <h3 className="font-bold text-neutral-950">{t("filters.priceRange")}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    {...form.register("minPrice")}
                    inputMode="numeric"
                    placeholder={t("filters.minPrice")}
                    className="h-12 rounded-2xl border border-neutral-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                  />
                  <input
                    {...form.register("maxPrice")}
                    inputMode="numeric"
                    placeholder={t("filters.maxPrice")}
                    className="h-12 rounded-2xl border border-neutral-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                  />
                </div>

                <input
                  {...form.register("currencyCode")}
                  placeholder={t("filters.currencyPlaceholder")}
                  className="h-12 w-full rounded-2xl border border-neutral-200 px-4 text-sm uppercase outline-none transition focus:border-emerald-700"
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-emerald-800" />
                  <h3 className="font-bold text-neutral-950">{t("filters.minimumRating")}</h3>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {["", "3", "3.5", "4", "4.5"].map((value) => (
                    <button
                      key={value || "any"}
                      type="button"
                      onClick={() => form.setValue("minRating", value)}
                      className={[
                        "flex h-12 items-center justify-center rounded-2xl text-sm font-semibold transition",
                        selectedRating === value
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                      ].join(" ")}
                    >
                      {value ? `${value}+` : t("filters.any")}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-emerald-800" />
                  <h3 className="font-bold text-neutral-950">{t("filters.responseTime")}</h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "any", label: t("filters.response.any") },
                    { value: "fast", label: t("filters.response.fast") },
                    { value: "instant", label: t("filters.response.instant") },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "responseTime",
                          option.value as ExploreResponseTime,
                        )
                      }
                      className={[
                        "flex h-12 items-center justify-center rounded-2xl text-sm font-semibold transition",
                        responseTime === option.value
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("verifiedOnly", !form.getValues("verifiedOnly"))
                  }
                  className={[
                    "flex w-full items-center justify-between rounded-3xl border-2 p-4 transition",
                    verifiedOnly
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-neutral-200 bg-white hover:border-neutral-300",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div
                      className={[
                        "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                        verifiedOnly
                          ? "bg-emerald-700 text-white"
                          : "bg-neutral-100 text-neutral-500",
                      ].join(" ")}
                    >
                      <BadgeCheck size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-neutral-950">
                        {t("filters.verifiedOnly")}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {t("filtersPanel.verifiedOnlyDescription")}
                      </p>
                    </div>
                  </div>

                  <div
                    className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-full transition",
                      verifiedOnly
                        ? "bg-emerald-700 text-white"
                        : "bg-neutral-200 text-transparent",
                    ].join(" ")}
                  >
                    <Check size={14} />
                  </div>
                </button>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-emerald-800" />
                  <h3 className="font-bold text-neutral-950">{t("filters.languages")}</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((language) => {
                    const isSelected = selectedLanguages.includes(language.value);

                    return (
                      <button
                        key={language.value}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? selectedLanguages.filter(
                                (value) => value !== language.value,
                              )
                            : [...selectedLanguages, language.value];

                          form.setValue("languages", next);
                        }}
                        className={[
                          "rounded-2xl px-4 py-2 text-sm font-medium transition",
                          isSelected
                            ? "bg-neutral-950 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                        ].join(" ")}
                      >
                        {language.label}{" "}
                        <span className="opacity-70">({language.count})</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-neutral-950">{t("sort.title")}</h3>

                <select
                  {...form.register("sort")}
                  className="h-12 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none transition focus:border-emerald-700"
                >
                  <option value="recommended">{t("sort.recommended")}</option>
                  <option value="price_low">{t("sort.priceLow")}</option>
                  <option value="price_high">{t("sort.priceHigh")}</option>
                  <option value="rating">{t("sort.rating")}</option>
                  <option value="newest">{t("sort.newest")}</option>
                </select>
              </section>

              <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-neutral-200 bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-neutral-100 text-sm font-bold text-neutral-900 transition hover:bg-neutral-200"
                >
                  {t("actions.clearAll")}
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-800 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? t("actions.applying") : t("actions.applyFilters")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}
