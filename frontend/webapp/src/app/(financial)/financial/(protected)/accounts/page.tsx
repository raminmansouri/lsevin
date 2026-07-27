import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { listAccounts, listPostableParents } from "@/accounting/server/accounts-admin";
import { listActiveCurrencies } from "@/accounting/server/settings-admin";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createAccountAction, renameAccountAction, toggleAccountActiveAction } from "../config-actions";

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t("addAccount")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Only a leaf under an existing subsidiary account. Type and normal side are
              inherited from the parent, so the panel cannot create an account that
              breaks the roll-up by account type. */}
          <form action={createAccountAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs">
              <span className="text-muted-foreground">{t("parentAccount")}</span>
              <select name="parentId" required className="mt-1 h-9 w-full rounded border px-2">
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {pickName(p.name, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">{t("accountCode")}</span>
              <input name="code" dir="ltr" required className="mt-1 h-9 w-full rounded border px-2" />
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">{t("nameFa")}</span>
              <input name="nameFa" required className="mt-1 h-9 w-full rounded border px-2" />
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">{t("nameEn")}</span>
              <input name="nameEn" dir="ltr" className="mt-1 h-9 w-full rounded border px-2" />
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">{t("currencyOptional")}</span>
              <select name="currencyCode" className="mt-1 h-9 w-full rounded border px-2">
                <option value="">{t("anyCurrency")}</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 lg:col-span-5">
              <button className="bg-primary text-primary-foreground h-9 rounded px-4 text-xs font-semibold">
                {t("addAccount")}
              </button>
            </div>
          </form>
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
                  <th className="p-2 text-start">{t("accountName")}</th>
                  <th className="p-2 text-start">{t("accountType")}</th>
                  <th className="p-2 text-start">{t("normalBalance")}</th>
                  <th className="p-2 text-start">{t("postable")}</th>
                  <th className="p-2 text-start">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className={account.isActive ? "border-b last:border-0" : "border-b opacity-50 last:border-0"}>
                    <td className="p-2 font-mono" dir="ltr" style={{ paddingInlineStart: `${account.level * 0.75}rem` }}>
                      {account.code}
                    </td>
                    <td className="p-2">
                      <form action={renameAccountAction} className="flex items-center gap-1">
                        <input type="hidden" name="accountId" value={account.id} />
                        <input
                          name="nameFa"
                          defaultValue={account.nameTranslations?.["fa-IR"] ?? ""}
                          className="h-8 w-44 rounded border px-2 text-xs"
                        />
                        <input
                          name="nameEn"
                          dir="ltr"
                          defaultValue={account.nameTranslations?.["en-US"] ?? ""}
                          className="h-8 w-40 rounded border px-2 text-xs"
                        />
                        <button className="rounded border px-2 py-1 text-xs">{t("save")}</button>
                      </form>
                    </td>
                    <td className="p-2 text-xs">{t(`accountTypes.${account.accountType}` as never)}</td>
                    <td className="p-2 text-xs">{t(`sides.${account.normalBalance}` as never)}</td>
                    <td className="p-2 text-xs">{account.isPostable ? "✓" : "—"}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2 text-xs">
                        {account.isSystem && (
                          <span className="text-muted-foreground" title={t("systemAccountHint")}>
                            {t("systemAccount")}
                          </span>
                        )}
                        {account.hasPostings && (
                          <span className="text-muted-foreground">{t("hasPostings")}</span>
                        )}
                        {!account.isSystem && (
                          <form action={toggleAccountActiveAction}>
                            <input type="hidden" name="accountId" value={account.id} />
                            <input type="hidden" name="isActive" value={account.isActive ? "false" : "true"} />
                            <button className="rounded border px-2 py-1">
                              {account.isActive ? t("deactivate") : t("activate")}
                            </button>
                          </form>
                        )}
                      </div>
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
