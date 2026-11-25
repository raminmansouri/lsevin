"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";

import ExploreFilterPanel, {
  EMPTY_FILTER_VALUES,
  countActiveFilterValues,
  filterValuesFrom,
  type ExploreFilterValues,
} from "./ExploreFilterPanel";
import { buildExploreQuery } from "./ExploreClient";
import type { ExploreCurrencyOption, ExploreFiltersInput, ExploreLanguageOption } from "./explore.data";
import type { ListingSlugs } from "@/lib/routes/filter-paths";

type ExploreFiltersProps = {
  filters: ExploreFiltersInput;
  availableLanguages: ExploreLanguageOption[];
  availableCurrencies: ExploreCurrencyOption[];
  locale: string;
  /** Category and type slugs, so the filtered URL keeps the canonical listing path. */
  slugs: ListingSlugs;
  /** Navigates to the filtered listing (the page shows its own pending state). */
  onNavigate: (href: string) => void;
};

/** The desktop explore toolbar's filter button and its panel (the same panel as the phone layout). */
export default function ExploreFilters({
  filters,
  availableLanguages,
  availableCurrencies,
  locale,
  slugs,
  onNavigate,
}: ExploreFiltersProps) {
  const t = useTranslations("Explore");
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const activeCount = countActiveFilterValues(filterValuesFrom(filters));

  // The category, provider type and search text have their own controls and stay as they are.
  const go = (values: ExploreFilterValues) => onNavigate(buildExploreQuery(slugs, { ...filters, ...values }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-12 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
        {t("filtersPanel.title")}
        {activeCount > 0 ? (
          <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-neutral-950">
            {activeCount.toLocaleString(locale)}
          </span>
        ) : null}
      </button>

      <ExploreFilterPanel
        open={open}
        onClose={close}
        variant="dialog"
        filters={filters}
        availableLanguages={availableLanguages}
        availableCurrencies={availableCurrencies}
        locale={locale}
        onApply={go}
        onClear={() => go(EMPTY_FILTER_VALUES)}
      />
    </>
  );
}
