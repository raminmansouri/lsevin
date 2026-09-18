import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { GymMembershipsAdminBoard } from "@/features/gym-memberships/components/admin/gym-memberships-admin-board";
import { getGymMembershipsAdminPageData } from "@/features/gym-memberships/server/repository";
import {
  GYM_MEMBERSHIPS_TRANSLATION_KEY,
  MEMBERSHIP_MONTH_STATUSES,
  type GymMembershipMonthListFilters,
} from "@/features/gym-memberships/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type RawSearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<LocaleParams>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: GYM_MEMBERSHIPS_TRANSLATION_KEY });

  return {
    title: t("admin.title"),
    description: t("admin.description"),
  };
}

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function toPositiveInt(value: string, fallback: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

/**
 * searchParams is attacker-controlled, so status is checked against the enum rather
 * than cast -- same discipline consultation-requests/page.tsx documents for itself.
 */
function toFilters(searchParams: RawSearchParams): GymMembershipMonthListFilters {
  const status = firstValue(searchParams.status);

  return {
    status: (MEMBERSHIP_MONTH_STATUSES as readonly string[]).includes(status)
      ? (status as GymMembershipMonthListFilters["status"])
      : "all",
    search: firstValue(searchParams.search),
    pageNumber: toPositiveInt(firstValue(searchParams.pageNumber), 1, 100000),
    pageSize: toPositiveInt(firstValue(searchParams.pageSize), 20, 100),
  };
}

export default function AdminGymMembershipsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={GYM_MEMBERSHIPS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <div className="space-y-1">
              <PageHeader title={t("admin.title")} />
              <p className="text-muted-foreground text-sm">{t("admin.description")}</p>
            </div>

            <Suspense fallback={null}>
              <SuspenseBoundary params={params} searchParams={searchParams} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function SuspenseBoundary({
  params,
  searchParams,
}: {
  params: Promise<LocaleParams>;
  searchParams: Promise<RawSearchParams>;
}) {
  // The (admin) layout and the middleware both gate this URL, but the guard is
  // repeated here so the page cannot become readable by a routing change alone.
  await assertAdmin();

  const { locale } = await params;
  const resolved = await searchParams;
  const t = await getTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const data = await getGymMembershipsAdminPageData(toFilters(resolved), locale);

  // Migration 0039 has not run yet. Rendering the board here would query relations
  // that do not exist, so the page explains itself instead.
  if (data.schemaMissing) {
    return (
      <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">{t("admin.schemaMissing.title")}</p>
          <p className="text-sm">{t("admin.schemaMissing.body")}</p>
        </div>
      </div>
    );
  }

  return <GymMembershipsAdminBoard data={data} />;
}
