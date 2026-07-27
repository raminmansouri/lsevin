import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";

import type { PanelUser } from "@/accounting/server/panel-auth";

import { signOutAction } from "../auth-actions";

const NAV = [
  { href: "/financial", key: "title" },
  { href: "/financial/deposits", key: "depositQueueTitle" },
  { href: "/financial/withdrawals", key: "withdrawalQueueTitle" },
  { href: "/financial/journal", key: "journalTitle" },
  { href: "/financial/reports", key: "reportsTitle" },
  { href: "/financial/statements", key: "statementsTitle" },
  { href: "/financial/ledger", key: "ledgerTitle" },
  { href: "/financial/accounts", key: "accountsTitle" },
  { href: "/financial/audit", key: "auditTitle" },
  // Settings decide how much money moves, so only a finance admin sees the link.
  { href: "/financial/settings", key: "settingsTitle", requires: "finance_admin" as const },
];

export async function PanelShell({ user, children }: PropsWithChildren<{ user: PanelUser }>) {
  const t = await getTranslations("Admin.accounting");
  const nav = NAV.filter((item) => !item.requires || user.role === item.requires);

  return (
    <div dir="rtl" lang="fa" className="bg-background min-h-screen">
      <header className="bg-card sticky top-0 z-10 border-b print:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <span className="font-semibold">{t("panelName")}</span>
          <nav className="flex flex-wrap gap-1 text-xs">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-accent rounded px-2 py-1 transition-colors"
              >
                {t(item.key as never)}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {user.displayName} · {t(`panelRoles.${user.role}` as never)}
            </span>
            <form action={signOutAction}>
              <button className="rounded border px-2 py-1">{t("signOut")}</button>
            </form>
          </div>
        </div>
      </header>

      {user.mustChangePassword && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 print:hidden">
          {t("mustChangePassword")}{" "}
          <Link href="/financial/settings" className="underline">
            {t("settingsTitle")}
          </Link>
        </div>
      )}

      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
