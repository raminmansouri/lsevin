"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type LookupOption = {
  id: string;
  label: string;
  parentId?: string | null;
};

type LookupResponse = {
  items: LookupOption[];
  hasMore: boolean;
  page: number;
  pageSize: number;
};

type Props = {
  /** Keep this aligned with the server-side list query. */
  queryKey?: string;
  title?: string;
  pageSize?: number;
};

function mergeOptions(current: LookupOption[], incoming: LookupOption[]) {
  const map = new Map<string, LookupOption>();
  for (const item of current) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

export function ServiceDefinitionCategoryFilter({
  queryKey = "categoryId",
  title = "Category",
  pageSize = 30,
}: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedCategoryId = searchParams.get(queryKey) || "";
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LookupOption[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedCategory = useMemo(
    () => items.find((item) => item.id === selectedCategoryId),
    [items, selectedCategoryId],
  );

  const loadCategories = async (nextPage: number, nextSearch: string, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: "categories",
        locale,
        q: nextSearch,
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      const response = await fetch(`/api/admin/service-provider-lookups?${params.toString()}`, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) return;

      const data = (await response.json()) as LookupResponse;
      setItems((current) => (replace ? data.items : mergeOptions(current, data.items)));
      setHasMore(Boolean(data.hasMore));
      setPage(data.page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open && items.length > 0) return;
    void loadCategories(1, search, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, open]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    void loadCategories(1, value.trim(), true);
  }, 250);

  const updateCategory = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categoryId) params.set(queryKey, categoryId);
    else params.delete(queryKey);

    // Reset common pagination keys used across the admin datatables.
    params.delete("page");
    params.delete("pageNumber");

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    void loadCategories(page + 1, search.trim(), false);
  };

  const selectedLabel = selectedCategory?.label || (selectedCategoryId ? "Selected category" : title);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <ChevronsUpDown className="mr-2 size-4" />
          {title}
          {selectedCategoryId ? (
            <Badge variant="secondary" className="ml-2 max-w-[160px] truncate rounded-sm px-1 font-normal">
              {selectedLabel}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>{loading ? "Loading..." : "No categories found."}</CommandEmpty>
            <CommandGroup>
              {selectedCategoryId ? (
                <CommandItem
                  value="__clear"
                  onSelect={() => {
                    updateCategory(null);
                    setOpen(false);
                  }}
                >
                  <X className="mr-2 size-4" />
                  Clear category filter
                </CommandItem>
              ) : null}

              {items.map((item) => {
                const isSelected = item.id === selectedCategoryId;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      updateCategory(isSelected ? null : item.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {hasMore ? (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Load more
                </Button>
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
