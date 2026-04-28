"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../../constants";

const SEARCH_PARAM_CANDIDATES = [
  "Search",
  "search",
  "q",
  "Query",
  "query",
  "keyword",
  "term",
  "searchTerm",
  "searchValue",
  "globalFilter",
  "filter",
];

function readCurrentSearch(searchParams: URLSearchParams) {
  for (const key of SEARCH_PARAM_CANDIDATES) {
    const value = searchParams.get(key);
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function normalizeListUrlParams(searchParams: URLSearchParams, search: string) {
  const params = new URLSearchParams(searchParams.toString());

  // Remove possible names produced by different DataTable/search utilities and
  // write the canonical key consumed by the Postgres repository.
  for (const key of SEARCH_PARAM_CANDIDATES) {
    params.delete(key);
  }

  const normalizedSearch = search.trim();
  if (normalizedSearch) params.set("Search", normalizedSearch);

  // Reset pagination whenever the main search changes.
  params.delete("PageNumber");
  params.delete("pageNumber");
  params.delete("page");
  params.delete("Page");
  params.delete("offset");

  return params;
}

export const ServiceDefinitionListToolbar = () => {
  const t = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = useMemo(
    () => readCurrentSearch(searchParams),
    [searchParams]
  );

  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const doSearch=()=>{
    if (search.trim() === currentSearch) return;

      const params = normalizeListUrlParams(searchParams, search);
      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() === currentSearch) return;

      const params = normalizeListUrlParams(searchParams, search);
      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 750);

    return () => window.clearTimeout(timer);
  }, [ currentSearch, pathname, router,  searchParams]);

  const handleAddServiceDefinition = () => {
    router.push(`${pathname}/add`);
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onKeyDown={s=>{
            if(s.key==='Enter'){
      doSearch();
            }
          }}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search service definitions..."
          className="h-10 w-full rounded-xl border border-input bg-background px-9 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        />
        {search ? (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <Button onClick={handleAddServiceDefinition} className="shrink-0">
        {t("actions.addServiceDefinition")}
      </Button>
    </div>
  );
};
