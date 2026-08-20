"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInput,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "@/i18n/navigation";

import {
  ADMIN_NAV,
  ADMIN_NAV_LEAVES,
  type AdminNavEntry,
  isNavGroup,
} from "../config/admin-nav";
import type { AdminTableGroup } from "@/lib/admin/table-groups";

import {
  AdminSidebarItem,
  AdminTableGroupRow,
  resolveActiveHref,
} from "./sidebar-item";

export function AdminSidebar({
  tableGroups = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & { tableGroups?: AdminTableGroup[] }) {
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const [query, setQuery] = React.useState("");

  // Resolved once for the whole tree so exactly one row can win. Computing it
  // per-item is what previously highlighted two or three rows at a time.
  const activeHref = React.useMemo(
    () =>
      resolveActiveHref(pathname, [
        ...ADMIN_NAV_LEAVES.map((leaf) => leaf.href),
        ...tableGroups.flatMap((group) => group.tables.map((t) => t.href)),
      ]),
    [pathname, tableGroups]
  );

  const label = React.useCallback(
    (key: string) => (t.has(`nav.${key}`) ? t(`nav.${key}`) : key),
    [t]
  );

  // Filtering against the *translated* label, so a Persian admin searching
  // "رزرو" finds the bookings group. Groups survive if they match themselves or
  // if any child matches, and a surviving group keeps only its matching children.
  const entries = React.useMemo<AdminNavEntry[]>(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return ADMIN_NAV;

    const matches = (key: string) =>
      label(key).toLocaleLowerCase().includes(needle);

    return ADMIN_NAV.flatMap<AdminNavEntry>((entry) => {
      if (!isNavGroup(entry)) return matches(entry.titleKey) ? [entry] : [];
      if (matches(entry.titleKey)) return [entry];
      const items = entry.items.filter((item) => matches(item.titleKey));
      return items.length ? [{ ...entry, items }] : [];
    });
  }, [query, label]);

  // Tables match on their Persian label AND on the raw `schema.table`, so an
  // admin who knows the database can type "provider_services" and land on it.
  const filteredTableGroups = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return tableGroups;

    return tableGroups.flatMap((group) => {
      if (group.label.toLocaleLowerCase().includes(needle)) return [group];
      const tables = group.tables.filter(
        (table) =>
          table.label.toLocaleLowerCase().includes(needle) ||
          table.qualified.toLocaleLowerCase().includes(needle)
      );
      return tables.length ? [{ ...group, tables }] : [];
    });
  }, [query, tableGroups]);

  const searchLabel = t.has("nav.searchPlaceholder")
    ? t("nav.searchPlaceholder")
    : "Search";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 p-4 group-data-[collapsible=icon]:px-2">
        <Logo />
        <div className="relative group-data-[collapsible=icon]:hidden">
          <Search className="text-muted-foreground pointer-events-none absolute start-2 top-1/2 size-4 -translate-y-1/2" />
          <SidebarInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="ps-8"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {entries.map((entry) => (
          <AdminSidebarItem
            key={entry.titleKey}
            item={entry}
            activeHref={activeHref}
          />
        ))}
        {filteredTableGroups.length > 0 && (
          <>
            <SidebarSeparator className="my-2" />
            <p className="text-muted-foreground px-4 pb-1 text-xs font-medium group-data-[collapsible=icon]:hidden">
              {t.has("nav.databaseTables") ? t("nav.databaseTables") : "Database tables"}
            </p>
            {filteredTableGroups.map((group) => (
              <AdminTableGroupRow
                key={group.schema}
                group={group}
                activeHref={activeHref}
              />
            ))}
          </>
        )}

        {entries.length === 0 && filteredTableGroups.length === 0 && (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm group-data-[collapsible=icon]:hidden">
            {t.has("nav.noResults") ? t("nav.noResults") : "No matches"}
          </p>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

/**
 * Shape-matched to the real sidebar: same width, same header block, and the
 * logical `border-e` rather than a physical `border-r` that landed on the wrong
 * edge in RTL. The old skeleton also gated on `lg:` while `Sidebar` shows at
 * `md:`, so between 768px and 1024px it rendered nothing and the nav popped in.
 */
export const AdminSidebarSkeleton = () => {
  return (
    <div className="bg-sidebar hidden w-(--sidebar-width) shrink-0 border-e md:block">
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="space-y-1 px-2">
        {Array.from({ length: 11 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
};
