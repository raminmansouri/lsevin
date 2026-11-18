import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { CustomerSearch } from "@/features/customers-admin/components/customer-search";
import { UserListSortSelect } from "@/features/customers-admin/components/user-list-sort-select";
import {
  buildUserListHref,
  formatSignupDate,
  USER_LIST_PAGE_SIZE,
  USER_LIST_SORTS,
  type UserListParams,
} from "@/features/customers-admin/lib/user-list-params";

export const USER_LISTS_NAMESPACE = "AdminUserLists";

export type UserListRow = {
  id: string;
  href: string;
  name: string;
  meta: ReactNode;
  signedUpAt: string | Date | null | undefined;
};

/**
 * Shared body of the admin "all customers" and "users" pages: search box, sort
 * dropdown, result count, rows with the signup date, and previous/next paging.
 */
export async function UserList({
  locale,
  kind,
  params,
  rows,
  total,
}: {
  locale: string;
  kind: "customers" | "users";
  params: UserListParams;
  rows: UserListRow[];
  total: number;
}) {
  const t = await getTranslations({ locale, namespace: USER_LISTS_NAMESPACE });
  const pages = Math.max(1, Math.ceil(total / USER_LIST_PAGE_SIZE));
  const isRtl = locale === "fa" || locale === "ar";
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const sortLabels = {
    newest: t("sort.newest"),
    oldest: t("sort.oldest"),
    name_asc: t("sort.nameAsc"),
    name_desc: t("sort.nameDesc"),
  } as const;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <CustomerSearch initialQuery={params.q} placeholder={t(`${kind}.searchPlaceholder`)} />
        </div>
        <UserListSortSelect
          value={params.sort}
          label={t("sort.label")}
          options={USER_LIST_SORTS.map((value) => ({ value, label: sortLabels[value] }))}
        />
      </div>

      {total > 0 && <div className="text-xs text-muted-foreground">{t("total", { count: total })}</div>}

      {rows.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {params.q ? t(`${kind}.emptySearch`) : t(`${kind}.empty`)}
        </div>
      )}

      {rows.map((row) => {
        const signedUp = formatSignupDate(row.signedUpAt, locale);
        return (
          <a
            key={row.id}
            href={row.href}
            className="flex flex-col gap-2 rounded-md border p-4 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="font-medium">{row.name}</div>
              <div className="truncate text-sm text-muted-foreground">{row.meta}</div>
            </div>
            <div
              className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
              title={t("signedUp")}
            >
              <CalendarClock className="size-3.5" aria-hidden />
              <span>{t("signedUp")}:</span>
              <span className="font-medium text-foreground/80">{signedUp ?? t("unknownDate")}</span>
            </div>
          </a>
        );
      })}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2 text-sm">
          {params.page > 1 ? (
            <a
              href={buildUserListHref(params, { page: params.page - 1 })}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-muted/40"
            >
              <PrevIcon className="size-4" aria-hidden />
              {t("pager.previous")}
            </a>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">{t("pager.page", { page: params.page, pages })}</span>
          {params.page < pages ? (
            <a
              href={buildUserListHref(params, { page: params.page + 1 })}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-muted/40"
            >
              {t("pager.next")}
              <NextIcon className="size-4" aria-hidden />
            </a>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
