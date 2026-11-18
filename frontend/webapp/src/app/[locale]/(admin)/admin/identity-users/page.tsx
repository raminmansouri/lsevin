import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { UserList, USER_LISTS_NAMESPACE } from "@/features/customers-admin/components/user-list";
import { parseUserListParams, type UserListSearchParams } from "@/features/customers-admin/lib/user-list-params";
import { getIdentityUsers } from "@/features/identity-users-admin/server/repository";
import type { LocaleParams } from "@/types/next";

type Props = { params: Promise<LocaleParams>; searchParams: Promise<UserListSearchParams> };

export default async function IdentityUsersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const listParams = parseUserListParams(await searchParams);
  const [{ items, total }, t] = await Promise.all([
    getIdentityUsers(listParams),
    getTranslations({ locale, namespace: USER_LISTS_NAMESPACE }),
  ]);
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={t("users.title")} description={t("users.description")} /></CardTitle></CardHeader>
      <CardContent>
        <UserList
          locale={locale}
          kind="users"
          params={listParams}
          total={total}
          rows={items.map((item) => ({
            id: item.id,
            href: `/admin/identity-users/${item.id}/update`,
            name: [item.first_name, item.last_name].filter(Boolean).join(" ") || item.user_name || "—",
            meta: [item.email, item.user_name, item.user_state].filter(Boolean).join(" · "),
            signedUpAt: item.created_at,
          }))}
        />
      </CardContent>
    </Card>
  );
}
