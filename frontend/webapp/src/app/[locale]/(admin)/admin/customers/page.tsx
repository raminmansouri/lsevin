import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { UserList, USER_LISTS_NAMESPACE } from "@/features/customers-admin/components/user-list";
import { parseUserListParams, type UserListSearchParams } from "@/features/customers-admin/lib/user-list-params";
import { getCustomers } from "@/features/customers-admin/server/repository";
import type { LocaleParams } from "@/types/next";

type Props = { params: Promise<LocaleParams>; searchParams: Promise<UserListSearchParams> };

export default async function CustomersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const listParams = parseUserListParams(await searchParams);
  const [{ items, total }, t] = await Promise.all([
    getCustomers(listParams),
    getTranslations({ locale, namespace: USER_LISTS_NAMESPACE }),
  ]);
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={t("customers.title")} description={t("customers.description")} /></CardTitle></CardHeader>
      <CardContent>
        <UserList
          locale={locale}
          kind="customers"
          params={listParams}
          total={total}
          rows={items.map((item) => ({
            id: item.id,
            href: `/admin/customers/${item.id}/update`,
            name: [item.first_name, item.last_name].filter(Boolean).join(" ") || "—",
            meta: [item.email, [item.phone_number_country_code, item.phone_number].filter(Boolean).join(" ")].filter(Boolean).join(" · "),
            signedUpAt: item.create_date,
          }))}
        />
      </CardContent>
    </Card>
  );
}
