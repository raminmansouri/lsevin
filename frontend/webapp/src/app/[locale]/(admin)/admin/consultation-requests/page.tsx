import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { ConsultationAdminBoard } from "@/features/consultation/components/admin/consultation-admin-board";
import { ConsultationAdminSkeleton } from "@/features/consultation/components/admin/consultation-admin-skeleton";
import { getConsultationAdminPageData } from "@/features/consultation/server/repository";
import {
  CONSULTATION_STATUSES,
  CONSULTATION_TRANSLATION_KEY,
  CONSULTATION_URGENCIES,
  type ConsultationListFilters,
} from "@/features/consultation/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type RawSearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<LocaleParams>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: CONSULTATION_TRANSLATION_KEY,
  });

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
 * searchParams is attacker-controlled, so status and urgency are checked against
 * the enums rather than cast. The repository binds them as parameters either way,
 * but an unrecognised value should mean "no filter", not an empty table.
 */
function toFilters(searchParams: RawSearchParams): ConsultationListFilters {
  const status = firstValue(searchParams.status);
  const urgency = firstValue(searchParams.urgency);

  return {
    status: (CONSULTATION_STATUSES as readonly string[]).includes(status)
      ? (status as ConsultationListFilters["status"])
      : "all",
    urgency: (CONSULTATION_URGENCIES as readonly string[]).includes(urgency)
      ? (urgency as ConsultationListFilters["urgency"])
      : "all",
    search:
      firstValue(searchParams.search) ||
      firstValue(searchParams.filters) ||
      firstValue(searchParams.q),
    pageNumber: toPositiveInt(firstValue(searchParams.pageNumber), 1, 100000),
    pageSize: toPositiveInt(firstValue(searchParams.pageSize), 20, 100),
  };
}

export default function AdminConsultationRequestsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<ConsultationAdminSkeleton />}>
      <LocaleBoundary
        params={params}
        tanslationNameSpace={CONSULTATION_TRANSLATION_KEY}
      >
        {(t) => (
          <div className="space-y-5">
            <div className="space-y-1">
              <PageHeader title={t("admin.title")} />
              <p className="text-muted-foreground text-sm">
                {t("admin.description")}
              </p>
            </div>

            <Suspense fallback={<ConsultationAdminSkeleton />}>
              <SuspenseBoundary searchParams={searchParams} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function SuspenseBoundary({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  // The (admin) layout and the middleware both gate this URL, but the guard is
  // repeated here so the page cannot become readable by a routing change alone.
  await assertAdmin();

  const resolved = await searchParams;
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  const data = await getConsultationAdminPageData(toFilters(resolved));

  // Migration 0019 has not run yet. Rendering the board here would query relations
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

  return <ConsultationAdminBoard data={data} />;
}
