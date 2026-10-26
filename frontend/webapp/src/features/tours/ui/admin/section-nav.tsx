"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { TOURS_PLATFORM_BASE } from "./paths";

export { TOURS_PLATFORM_BASE };


export const TOURS_PLATFORM_SECTIONS = [
  { key: "dashboard", href: TOURS_PLATFORM_BASE },
  { key: "tours", href: `${TOURS_PLATFORM_BASE}/tours` },
  { key: "taxonomy", href: `${TOURS_PLATFORM_BASE}/taxonomy` },
  { key: "destinations", href: `${TOURS_PLATFORM_BASE}/destinations` },
  { key: "editorial", href: `${TOURS_PLATFORM_BASE}/editorial` },
  { key: "translations", href: `${TOURS_PLATFORM_BASE}/translations` },
  { key: "settings", href: `${TOURS_PLATFORM_BASE}/settings` },
  { key: "departures", href: `${TOURS_PLATFORM_BASE}/departures` },
  { key: "bookings", href: `${TOURS_PLATFORM_BASE}/bookings` },
  { key: "disputes", href: `${TOURS_PLATFORM_BASE}/disputes` },
  { key: "commissions", href: `${TOURS_PLATFORM_BASE}/commissions` },
  { key: "incidents", href: `${TOURS_PLATFORM_BASE}/incidents` },
  { key: "reviews", href: `${TOURS_PLATFORM_BASE}/reviews` },
  { key: "compliance", href: `${TOURS_PLATFORM_BASE}/compliance` },
  { key: "reports", href: `${TOURS_PLATFORM_BASE}/reports` },
  { key: "notifications", href: `${TOURS_PLATFORM_BASE}/notifications` },
] as const;

export function ToursPlatformNav() {
  const t = useTranslations("TourAdmin.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max gap-1 px-1 pb-1">
        {TOURS_PLATFORM_SECTIONS.map((s) => {
          const active = s.href === TOURS_PLATFORM_BASE ? pathname === s.href : pathname === s.href || pathname.startsWith(`${s.href}/`);
          return (
            <li key={s.key}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-md px-3 text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
                )}
              >
                {t(s.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
