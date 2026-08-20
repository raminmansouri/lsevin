"use client";

import * as React from "react";
import { ChevronRight, Table2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";

import {
  type AdminNavEntry,
  type AdminNavGroup,
  type AdminNavLeaf,
  isNavGroup,
} from "../config/admin-nav";

/**
 * Resolves the one row that should read as "you are here".
 *
 * The previous implementation prefix-matched every entry independently, so
 * /admin/support/settings lit up both "Inbox" (/admin/support) and "Settings",
 * and /admin/loyalty/coupons lit up "Loyalty" too — two or three highlighted
 * rows at once, which reads as noise rather than as location.
 *
 * Longest-prefix-wins gives exactly one winner: a detail route like
 * /admin/bookings/42/update still resolves to /admin/bookings, but
 * /admin/support/settings resolves to /admin/support/settings because it is the
 * longer match. `/admin` is only ever an exact match — as a prefix it would
 * out-rank nothing and win everything.
 *
 * `pathname` comes from next-intl's `usePathname`, which has already stripped
 * the locale prefix.
 */
export function resolveActiveHref(
  pathname: string,
  hrefs: string[]
): string | null {
  const path = normalize(pathname);
  let best: string | null = null;

  for (const href of hrefs) {
    const candidate = normalize(href);
    const matches =
      candidate === "/admin"
        ? path === "/admin"
        : path === candidate || path.startsWith(`${candidate}/`);

    if (matches && (best === null || candidate.length > best.length)) {
      best = candidate;
    }
  }

  return best;
}

function normalize(url: string) {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function useNavLabel() {
  const t = useTranslations("Admin");
  // next-intl does not throw on a missing key — it reports through `onError` and
  // returns the joined key path — so the old try/catch here never fired and the
  // sidebar rendered the literal string "Admin.booking-calendar". `t.has` is the
  // supported check.
  return React.useCallback(
    (key: string) => {
      const scoped = `nav.${key}`;
      if (t.has(scoped)) return t(scoped);
      if (t.has(key)) return t(key);
      return humanize(key);
    },
    [t]
  );
}

function humanize(key: string) {
  return key
    .replace(/[-_]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

/**
 * The database table browser, as one collapsed section per schema.
 *
 * There are ~215 tables. They belong in the nav — they were previously reachable
 * only by first landing on /admin — but pasted in flat they would rebuild exactly
 * the wall this redesign removed. So: one closed disclosure per schema, opened by
 * the route you are on, and reachable in two keystrokes through the sidebar
 * filter and the ⌘K palette, both of which search table labels too.
 */
export function AdminTableGroupRow({
  group,
  activeHref,
}: {
  group: {
    schema: string;
    label: string;
    tables: Array<{ key: string; href: string; label: string; qualified: string }>;
  };
  activeHref: string | null;
}) {
  const hasActiveChild = group.tables.some(
    (table) => normalize(table.href) === activeHref
  );
  const [open, setOpen] = React.useState(hasActiveChild);
  React.useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup className="py-0.5">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-md transition-colors">
            <Table2 className="size-4 shrink-0" />
            <span className="truncate">{group.label}</span>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {group.tables.length}
            </span>
            <ChevronRight className="ms-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenuSub>
              {group.tables.map((table) => {
                const isActive = normalize(table.href) === activeHref;
                return (
                  <SidebarMenuSubItem key={table.key}>
                    <SidebarMenuSubButton asChild isActive={isActive}>
                      <Link
                        href={table.href}
                        title={table.qualified}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="truncate">{table.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AdminSidebarItem({
  item,
  activeHref,
}: {
  item: AdminNavEntry;
  activeHref: string | null;
}) {
  return isNavGroup(item) ? (
    <AdminNavGroupRow group={item} activeHref={activeHref} />
  ) : (
    <AdminNavLeafRow leaf={item} activeHref={activeHref} />
  );
}

function AdminNavLeafRow({
  leaf,
  activeHref,
}: {
  leaf: AdminNavLeaf;
  activeHref: string | null;
}) {
  const label = useNavLabel()(leaf.titleKey);
  const Icon = leaf.icon;
  const isActive = normalize(leaf.href) === activeHref;

  return (
    <SidebarGroup className="py-1">
      <SidebarMenu>
        <SidebarMenuItem>
          {/* `asChild` puts the <a> in the button's place. Wrapping a
              SidebarMenuButton in a Link instead produced <a><button></button></a>:
              invalid nesting, two tab stops per row, "link, button" in screen
              readers, and no aria-current anywhere in the nav. */}
          <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
            <Link href={leaf.href} aria-current={isActive ? "page" : undefined}>
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function AdminNavGroupRow({
  group,
  activeHref,
}: {
  group: AdminNavGroup;
  activeHref: string | null;
}) {
  const label = useNavLabel();
  const GroupIcon = group.icon;
  const hasActiveChild = group.items.some(
    (item) => normalize(item.href) === activeHref
  );

  // Controlled rather than `defaultOpen`: a client-side navigation into another
  // section must close the section you left and open the one you landed in,
  // which an uncontrolled Collapsible cannot do after first mount. `open` is
  // still user-overridable through `onOpenChange` until the route changes again.
  const [open, setOpen] = React.useState(hasActiveChild);
  React.useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger
            className="hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-md transition-colors"
            data-has-active={hasActiveChild || undefined}
          >
            <GroupIcon className="size-4 shrink-0" />
            <span className="truncate">{label(group.titleKey)}</span>
            {/* One chevron, always ChevronRight. The RTL block in globals.css
                mirrors `.lucide-chevron-right` for us; hand-swapping to
                ChevronLeft in RTL double-flipped it and — because that rule is
                unlayered and beats Tailwind's layered rotate — killed the
                open/closed animation, the only disclosure affordance here. */}
            <ChevronRight className="ms-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupContent>
            {/* SidebarMenuSub brings the indent, the connector rail and the h-7
                type scale. The old code rendered children with the top-level
                SidebarMenuButton, so an expanded group added nine rows that
                looked exactly like top-level destinations. */}
            <SidebarMenuSub>
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = normalize(item.href) === activeHref;

                return (
                  <SidebarMenuSubItem key={item.titleKey}>
                    <SidebarMenuSubButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <ItemIcon className="size-4 shrink-0" />
                        <span className="truncate">{label(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
