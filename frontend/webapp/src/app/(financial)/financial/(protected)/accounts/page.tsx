import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { listAccounts, listPostableParents } from "@/accounting/server/accounts-admin";
import { listActiveCurrencies } from "@/accounting/server/settings-admin";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AccountRowActions } from "./account-row-actions";
import { NewAccountForm } from "./new-account-form";

function pickName(name: Record<string, string> | null, locale: string): string {
  if (!name) return "—";
  return name[locale.startsWith("fa") ? "fa-IR" : "en-US"] ?? Object.values(name)[0] ?? "—";
}

export default async function ChartOfAccountsPage() {
  const locale = PANEL_LOCALE;
  const t = await getTranslations("Admin.accounting");
  const [accounts, parents, currencies] = await Promise.all([
    listAccounts(),
    listPostableParents(),
    listActiveCurrencies(),
  ]);

  // Which accounts have children, worked out once here rather than per row: a parent
  // cannot be deleted, and the delete button should not be offered where it cannot work.
  const parentIds = new Set(accounts.map((a) => a.parentId).filter(Boolean) as string[]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <PageHeader title={t("accountsTitle")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-sm">{t("accountsDescription")}</p>
          <p className="text-muted-foreground mt-1 text-xs">{t("accountsEditHint")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("addAccount")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <NewAccountForm
            parents={parents.map((p) => ({ id: p.id, label: `${p.code} — ${pickName(p.name, locale)}` }))}
            currencies={currencies.map((c) => ({ code: c.code }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("accountsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th className="p-2 text-start">{t("accountCode")}</th>
                  <th className="p-2 text-start">{t("accountType")}</th>
                  <th className="p-2 text-start">{t("normalBalance")}</th>
                  <th className="p-2 text-start">{t("postable")}</th>
                  <th className="p-2 text-start">{t("accountName")}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className={
                      account.isActive ? "border-b last:border-0" : "border-b opacity-50 last:border-0"
                    }
                  >
                    <td
                      className="p-2 font-mono"
                      dir="ltr"
                      style={{ paddingInlineStart: `${account.level * 0.75}rem` }}
                    >
                      {account.code}
                    </td>
                    <td className="p-2 text-xs">{t(`accountTypes.${account.accountType}` as never)}</td>
                    <td className="p-2 text-xs">{t(`sides.${account.normalBalance}` as never)}</td>
                    <td className="p-2 text-xs">{account.isPostable ? "✓" : "—"}</td>
                    <td className="p-2">
                      <AccountRowActions
                        accountId={account.id}
                        code={account.code}
                        nameFa={account.nameTranslations?.["fa-IR"] ?? ""}
                        nameEn={account.nameTranslations?.["en-US"] ?? ""}
                        isActive={account.isActive}
                        isSystem={account.isSystem}
                        hasPostings={account.hasPostings}
                        deletable={
                          !account.isSystem && !account.hasPostings && !parentIds.has(account.id)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
