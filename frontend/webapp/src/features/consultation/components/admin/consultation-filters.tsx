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

import {
  CONSULTATION_STATUSES,
  CONSULTATION_TRANSLATION_KEY,
  CONSULTATION_URGENCIES,
  type ConsultationListFilters,
} from "../../types";

/**
 * Filters live in the URL so a filtered view can be shared, reloaded and paged
 * through — the same contract the rest of the admin tables use. `usePathname` from
 * next/navigation already carries the locale prefix, so nothing here has to know
 * which locale is active.
 */
export function ConsultationFilters({
  filters,
}: {
  filters: ConsultationListFilters;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.search ?? "");
  const [status, setStatus] = useState<string>(filters.status ?? "all");
  const [urgency, setUrgency] = useState<string>(filters.urgency ?? "all");

  // Back/forward navigation changes the props without remounting the component.
  useEffect(() => {
    setSearch(filters.search ?? "");
    setStatus(filters.status ?? "all");
    setUrgency(filters.urgency ?? "all");
  }, [filters.search, filters.status, filters.urgency]);

  const push = (next: { search: string; status: string; urgency: string }) => {
    const params = new URLSearchParams();
    if (next.search.trim()) params.set("search", next.search.trim());
    if (next.status && next.status !== "all") params.set("status", next.status);
    if (next.urgency && next.urgency !== "all") params.set("urgency", next.urgency);
    if (filters.pageSize && filters.pageSize !== 20) {
      params.set("pageSize", String(filters.pageSize));
    }
    // Any filter change invalidates the current offset.
    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const apply = () => push({ search, status, urgency });

  const reset = () => {
    setSearch("");
    setStatus("all");
    setUrgency("all");
    push({ search: "", status: "all", urgency: "all" });
  };

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
          placeholder={t("admin.filters.search")}
          className="h-9 ps-9"
          aria-label={t("admin.filters.search")}
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => {
          setStatus(value);
          push({ search, status: value, urgency });
        }}
      >
        <SelectTrigger className="h-9 w-full sm:w-[170px]">
          <SelectValue placeholder={t("admin.filters.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.filters.all")}</SelectItem>
          {CONSULTATION_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`admin.status.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={urgency}
        onValueChange={(value) => {
          setUrgency(value);
          push({ search, status, urgency: value });
        }}
      >
        <SelectTrigger className="h-9 w-full sm:w-[170px]">
          <SelectValue placeholder={t("admin.filters.urgency")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.filters.all")}</SelectItem>
          {CONSULTATION_URGENCIES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`urgency.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="h-9" disabled={isPending}>
          {t("admin.filters.apply")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9"
          onClick={reset}
          disabled={isPending}
        >
          {t("admin.filters.reset")}
        </Button>
      </div>
    </form>
  );
}
