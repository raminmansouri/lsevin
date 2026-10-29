"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { TOURS_PLATFORM_BASE } from "./paths";

export { TOURS_PLATFORM_BASE };


/**
 * Sections in data-entry order. "setup" sections are numbered: each one needs the
 * previous ones (a tour needs categories and a destination; translations and the
 * landing page need tours). "operations" are the daily work once tours are live.
 */
export const TOURS_PLATFORM_SECTIONS = [
  { key: "dashboard", href: TOURS_PLATFORM_BASE, group: "overview" },
  { key: "settings", href: `${TOURS_PLATFORM_BASE}/settings`, group: "setup" },
  { key: "taxonomy", href: `${TOURS_PLATFORM_BASE}/taxonomy`, group: "setup" },
  { key: "destinations", href: `${TOURS_PLATFORM_BASE}/destinations`, group: "setup" },
  { key: "tours", href: `${TOURS_PLATFORM_BASE}/tours`, group: "setup" },
  { key: "translations", href: `${TOURS_PLATFORM_BASE}/translations`, group: "setup" },
  { key: "editorial", href: `${TOURS_PLATFORM_BASE}/editorial`, group: "setup" },
  { key: "departures", href: `${TOURS_PLATFORM_BASE}/departures`, group: "operations" },
  { key: "bookings", href: `${TOURS_PLATFORM_BASE}/bookings`, group: "operations" },
  { key: "disputes", href: `${TOURS_PLATFORM_BASE}/disputes`, group: "operations" },
  { key: "reviews", href: `${TOURS_PLATFORM_BASE}/reviews`, group: "operations" },
  { key: "incidents", href: `${TOURS_PLATFORM_BASE}/incidents`, group: "operations" },
  { key: "commissions", href: `${TOURS_PLATFORM_BASE}/commissions`, group: "operations" },
  { key: "compliance", href: `${TOURS_PLATFORM_BASE}/compliance`, group: "operations" },
  { key: "reports", href: `${TOURS_PLATFORM_BASE}/reports`, group: "operations" },
  { key: "notifications", href: `${TOURS_PLATFORM_BASE}/notifications`, group: "operations" },
] as const;

const GROUPS = ["overview", "setup", "operations"] as const;

export function ToursPlatformNav() {
  const t = useTranslations("TourAdmin.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const number = new Intl.NumberFormat(locale);
  return (
    <nav aria-label={t("label")} className="-mx-1 overflow-x-auto">
      <div className="flex min-w-max items-end gap-3 px-1 pb-1">
        {GROUPS.map((group) => {
          const sections = TOURS_PLATFORM_SECTIONS.filter((s) => s.group === group);
          return (
            <div key={group} className="space-y-1" data-testid={`nav-group-${group}`}>
              {group !== "overview" ? <p className="text-muted-foreground px-1 text-[11px] font-medium">{t(`groups.${group}`)}</p> : null}
              <ul className="flex gap-1">
                {sections.map((s, i) => {
                  const active = s.href === TOURS_PLATFORM_BASE ? pathname === s.href : pathname === s.href || pathname.startsWith(`${s.href}/`);
                  return (
                    <li key={s.key}>
                      <Link
                        href={s.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
                          active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
                        )}
                      >
                        {group === "setup" ? (
                          <span aria-hidden="true" className={cn("inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold", active ? "bg-primary-foreground/20" : "bg-muted")}>
                            {number.format(i + 1)}
                          </span>
                        ) : null}
                        {t(s.key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
