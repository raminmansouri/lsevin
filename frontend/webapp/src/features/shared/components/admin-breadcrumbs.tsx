"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, usePathname } from "@/i18n/navigation";

import { ADMIN_NAV, ADMIN_NAV_LEAVES, isNavGroup } from "../config/admin-nav";
import { resolveActiveHref } from "./sidebar-item";

/**
 * Admin routes go four levels deep — /admin/commercial/payment-policies/[id]/edit,
 * /admin/provider-services/[serviceId]/addons — and the header offered no trail
 * back up and no indication of which section you were in. `breadcrumb.tsx`
 * shipped in the design system with zero usages anywhere in the codebase.
 *
 * The trail is built from the nav tree rather than from raw path segments, so
 * every crumb carries a translated label instead of a slug, and the section
 * crumb is the group heading the page actually belongs to.
 */
export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("Admin");

  const label = React.useCallback(
    (key: string) => (t.has(`nav.${key}`) ? t(`nav.${key}`) : key),
    [t]
  );

  const crumbs = React.useMemo(() => {
    const activeHref = resolveActiveHref(
      pathname,
      ADMIN_NAV_LEAVES.map((leaf) => leaf.href)
    );
    if (!activeHref) return [];

    const leaf = ADMIN_NAV_LEAVES.find((entry) => entry.href === activeHref);
    if (!leaf) return [];

    const group = leaf.groupKey
      ? ADMIN_NAV.find(
          (entry) => isNavGroup(entry) && entry.titleKey === leaf.groupKey
        )
      : undefined;

    const trail: Array<{ key: string; label: string; href?: string }> = [];

    // A group is a heading, not a page — it gets no href on purpose.
    if (group) {
      trail.push({ key: group.titleKey, label: label(group.titleKey) });
    }
    trail.push({
      key: leaf.titleKey,
      label: label(leaf.titleKey),
      href: leaf.href,
    });

    // Anything past the matched leaf is a record id or a sub-action
    // (/42/update, /addons). Show it as one trailing crumb so a detail page does
    // not claim to *be* the list it was opened from.
    const rest = pathname
      .replace(/\/+$/, "")
      .slice(leaf.href.replace(/\/+$/, "").length)
      .split("/")
      .filter(Boolean);

    if (rest.length) {
      const tail = rest[rest.length - 1];
      trail.push({
        key: `tail-${tail}`,
        label: t.has(`nav.${tail}`) ? t(`nav.${tail}`) : humanize(tail),
      });
    }

    return trail;
  }, [pathname, label, t]);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <React.Fragment key={crumb.key}>
              <BreadcrumbItem
                className={
                  index === 0 && crumbs.length > 1 ? "hidden md:flex" : undefined
                }
              >
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator
                  className={index === 0 ? "hidden md:block" : undefined}
                />
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function humanize(segment: string) {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}
