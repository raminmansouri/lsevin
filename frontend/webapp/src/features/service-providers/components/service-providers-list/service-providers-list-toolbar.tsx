"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter as useI18nRouter } from "@/i18n/navigation";

import { TRANSLATION_KEY } from "../../types/constants";
import { ProviderTypeFacetedFilter } from "./provider-type-faceted-filter";

export const ServiceProvidersListToolbar = () => {
  const t = useTranslations(TRANSLATION_KEY);
  const router = useI18nRouter();
  const nextRouter = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("filters") || "");

  useEffect(() => {
    setSearch(searchParams.get("filters") || "");
  }, [searchParams]);

  const commitSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = value.trim();

    if (normalized) {
      params.set("filters", normalized);
    } else {
      params.delete("filters");
      params.delete("search");
      params.delete("q");
      params.delete("query");
    }

    params.delete("pageNumber");
    params.delete("page");

    startTransition(() => {
      const query = params.toString();
      nextRouter.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }, 350);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    commitSearch(value);
  };

  const handleClearSearch = () => {
    setSearch("");
    commitSearch("");
  };

  const handleAddServiceProvider = () => {
    router.push("/admin/service-providers/add");
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search providers, services, staff, city, country..."
            className="h-8 pl-9 pr-9"
          />
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          ) : null}
        </div>
        <ProviderTypeFacetedFilter title={t("table.filters.providerType")} />
      </div>
      <Button onClick={handleAddServiceProvider}>{t("actions.addServiceProvider")}</Button>
    </div>
  );
};
