import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";

import type { PanelUser } from "@/accounting/server/panel-auth";

import { signOutAction } from "../auth-actions";
import { NavLink } from "./nav-link";

/**
 * The financial panel's shell.
 *
 * Laid out to match the prototype: a dark green sidebar grouped into three
 * sections, and a topbar carrying the current page's title and subtitle. The
 * grouping is the point — twelve flat links is a list, four groups of three is a
 * map of the product, and an accountant navigating this all day needs the map.
 */
const NAV_GROUPS: {
  section: string;
  items: { href: string; key: string; requires?: "finance_admin" }[];
}[] = [
  {
    section: "اصلی",
    items: [
      { href: "/financial", key: "title" },
      { href: "/financial/entries", key: "entriesTitle" },
      { href: "/financial/journal", key: "journalTitle" },
      { href: "/financial/accounts", key: "accountsTitle" },
    ],
  },
  {
    section: "عملیات و گزارش",
    items: [
      { href: "/financial/deposits", key: "depositQueueTitle" },
      { href: "/financial/withdrawals", key: "withdrawalQueueTitle" },
      { href: "/financial/reports", key: "reportsTitle" },
      { href: "/financial/analytics", key: "analyticsTitle" },
      { href: "/financial/statements", key: "statementsTitle" },
      { href: "/financial/ledger", key: "ledgerTitle" },
    ],
  },
  {
    section: "کنترل و حاکمیت",
    items: [
      { href: "/financial/dimensions", key: "dimensionsTitle", requires: "finance_admin" },
      { href: "/financial/templates", key: "templatesTitle" },
      { href: "/financial/audit", key: "auditTitle" },
      { href: "/financial/settings", key: "settingsTitle", requires: "finance_admin" },
    ],
  },
];

export async function PanelShell({ user, children }: PropsWithChildren<{ user: PanelUser }>) {
  const t = await getTranslations("Admin.accounting");

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.requires || user.role === item.requires),
  })).filter((group) => group.items.length > 0);

  return (
    <div dir="rtl" lang="fa" className="min-h-screen bg-[#f4f7fa] dark:bg-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-screen overflow-auto bg-gradient-to-b from-[#073d30] to-[#0b5d46] p-4 text-white lg:block print:hidden">
          <div className="mb-3 flex items-center gap-3 border-b border-white/10 px-2 pb-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#d6af5a] to-[#f4d98c] font-black text-[#063d2f]">
              LS
            </div>
            <div>
              <p className="text-base font-semibold leading-tight">{t("panelName")}</p>
              <p className="text-xs text-white/70">{t(`panelRoles.${user.role}` as never)}</p>
            </div>
          </div>

          <nav>
            {groups.map((group) => (
              <div key={group.section}>
                <div className="mx-2 mb-2 mt-4 text-[11px] text-white/60">{group.section}</div>
                {group.items.map((item) => (
                  <NavLink key={item.href} href={item.href} label={t(item.key as never)} />
                ))}
              </div>
            ))}
          </nav>

          <form action={signOutAction} className="mt-6 px-2">
            <button className="w-full rounded-xl border border-white/15 px-3 py-2 text-sm text-white/90 transition hover:bg-white/10">
              {t("signOut")}
            </button>
          </form>
        </aside>

        <div className="min-w-0">
          {/* Horizontal nav on narrow screens, where a 280px rail is not affordable. */}
          <div className="bg-gradient-to-b from-[#073d30] to-[#0b5d46] p-3 lg:hidden print:hidden">
            <div className="mb-2 flex items-center justify-between gap-2 text-white">
              <span className="font-semibold">{t("panelName")}</span>
              <form action={signOutAction}>
                <button className="rounded-lg border border-white/15 px-2 py-1 text-xs">
                  {t("signOut")}
                </button>
              </form>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {groups.flatMap((g) => g.items).map((item) => (
                <NavLink key={item.href} href={item.href} label={t(item.key as never)} compact />
              ))}
            </div>
          </div>

          <main className="p-4">
            {user.mustChangePassword && (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
                {t("mustChangePassword")}{" "}
                <Link href="/financial/settings" className="underline">
                  {t("settingsTitle")}
                </Link>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
