"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter as useI18nRouter } from "@/i18n/navigation";

export function PickedLocationListToolbar() {
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

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search city, country, code, image, or coordinates..."
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

      <Button onClick={() => router.push("/admin/picked-locations/add")}> 
        <MapPin className="mr-2 h-4 w-4" />
        Add picked location
      </Button>
    </div>
  );
}
