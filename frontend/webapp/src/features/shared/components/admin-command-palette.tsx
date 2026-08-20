"use client";

import * as React from "react";
import { Search, Table2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "@/i18n/navigation";

import type { AdminTableGroup } from "@/lib/admin/table-groups";

import { ADMIN_NAV, isNavGroup } from "../config/admin-nav";

/**
 * With ~50 destinations, browsing a tree is the wrong interaction — this turns
 * it into a search. cmdk is already a dependency (10+ feature selectors use it)
 * and `command.tsx` was sitting unused in the design system.
 */
export function AdminCommandPalette({
  tableGroups = [],
}: {
  tableGroups?: AdminTableGroup[];
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("Admin");

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const label = React.useCallback(
    (key: string) => (t.has(`nav.${key}`) ? t(`nav.${key}`) : key),
    [t]
  );

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const placeholder = t.has("nav.commandPlaceholder")
    ? t("nav.commandPlaceholder")
    : "Search pages…";
  const title = t.has("nav.commandTitle") ? t("nav.commandTitle") : "Navigate";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground h-8 gap-2 px-2 font-normal sm:pe-2 sm:ps-3"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">{placeholder}</span>
        {/* Modifier key is decoration, not instruction — `no-flip` keeps the
            shortcut hint from being mirrored into "K⌘" in RTL. */}
        <kbd
          data-no-flip
          dir="ltr"
          className="bg-muted text-muted-foreground hidden rounded border px-1.5 font-mono text-[10px] sm:inline"
        >
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={placeholder}
      >
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>
            {t.has("nav.noResults") ? t("nav.noResults") : "No matches"}
          </CommandEmpty>
          {ADMIN_NAV.map((entry) =>
            isNavGroup(entry) ? (
              <CommandGroup key={entry.titleKey} heading={label(entry.titleKey)}>
                {entry.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`${label(entry.titleKey)} ${label(item.titleKey)} ${item.href}`}
                      onSelect={() => go(item.href)}
                    >
                      <Icon className="size-4" />
                      <span>{label(item.titleKey)}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : (
              <CommandGroup key={entry.titleKey}>
                <CommandItem
                  value={`${label(entry.titleKey)} ${entry.href}`}
                  onSelect={() => go(entry.href)}
                >
                  <entry.icon className="size-4" />
                  <span>{label(entry.titleKey)}</span>
                </CommandItem>
              </CommandGroup>
            )
          )}
          {/* The 215 database tables, searchable by Persian label or by raw
              schema.table — the fastest path to any of them. */}
          {tableGroups.map((group) => (
            <CommandGroup key={group.schema} heading={group.label}>
              {group.tables.map((table) => (
                <CommandItem
                  key={table.key}
                  value={`${group.label} ${table.label} ${table.qualified}`}
                  onSelect={() => go(table.href)}
                >
                  <Table2 className="size-4" />
                  <span>{table.label}</span>
                  <span className="text-muted-foreground ms-auto text-xs" dir="ltr">
                    {table.qualified}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
