"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { GYM_MEMBERSHIPS_TRANSLATION_KEY, MEMBERSHIP_MONTH_STATUSES, type GymMembershipMonthListFilters } from "../../types";

/** Filters live in the URL so a filtered view can be shared, reloaded and paged through --
 * mirrors consultation-filters.tsx's contract exactly. */
export function GymMembershipMonthFilters({ filters }: { filters: GymMembershipMonthListFilters }) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.search ?? "");
  const [status, setStatus] = useState<string>(filters.status ?? "all");

  useEffect(() => {
    setSearch(filters.search ?? "");
    setStatus(filters.status ?? "all");
  }, [filters.search, filters.status]);

  const push = (next: { search: string; status: string }) => {
    const params = new URLSearchParams();
    if (next.search.trim()) params.set("search", next.search.trim());
    if (next.status && next.status !== "all") params.set("status", next.status);
    if (filters.pageSize && filters.pageSize !== 20) {
      params.set("pageSize", String(filters.pageSize));
    }
    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const apply = () => push({ search, status });

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <div className="relative w-full sm:max-w-xs">
        <Search className="text-muted-foreground pointer-events-none absolute inset-y-0 start-3 my-auto size-4" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("admin.months.filters.search")}
          className="h-9 ps-9"
          aria-label={t("admin.months.filters.search")}
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => {
          setStatus(value);
          push({ search, status: value });
        }}
      >
        <SelectTrigger className="h-9 w-full sm:w-[170px]">
          <SelectValue placeholder={t("admin.months.filters.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.months.filters.all")}</SelectItem>
          {MEMBERSHIP_MONTH_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`admin.months.status.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" size="sm" className="h-9" disabled={isPending}>
        {t("admin.months.filters.apply")}
      </Button>
    </form>
  );
}
