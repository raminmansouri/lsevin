import { getTranslations } from "next-intl/server";

import { canAccounting } from "@/accounting/server/access";
import { listAccounts } from "@/accounting/server/accounts-admin";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AccountsTree } from "./accounts-tree";

export default async function ChartOfAccountsPage() {
  const t = await getTranslations("Admin.accounting");
  const [accounts, canManage] = await Promise.all([listAccounts(), canAccounting("accounts.manage")]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <PageHeader title={t("accountsTitle")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-4 text-sm text-muted-foreground">
          <p>کد هر حساب از کد حساب بالایی‌اش و چند رقم خودش ساخته می‌شود: گروه ← کل ← معین ← تفصیلی ← …</p>
          <p className="text-xs">
            سند فقط روی حساب‌هایی ثبت می‌شود که زیرحساب ندارند. حساب‌های «سیستمی» را سایت خودکار استفاده می‌کند؛
            اسم و کدشان قابل تغییر است ولی حذف نمی‌شوند. حسابی که سند خورده، به‌جای حذف، غیرفعال می‌شود.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <AccountsTree
            canManage={canManage}
            accounts={accounts.map((account) => ({
              id: account.id,
              code: account.code,
              parentId: account.parentId,
              level: account.level,
              nameFa: account.nameTranslations?.["fa-IR"] ?? account.code,
              nameEn: account.nameTranslations?.["en-US"] ?? "",
              isActive: account.isActive,
              isSystem: account.isSystem,
              isPostable: account.isPostable,
              hasPostings: account.hasPostings,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}