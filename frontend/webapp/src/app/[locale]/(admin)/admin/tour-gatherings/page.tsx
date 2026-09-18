import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { TourGatheringAdminBoard } from "@/features/tours/components/admin/tour-gathering-admin-board";
import { getTourGatheringAdminPageData } from "@/features/tours/server/repository";
import { TOURS_TRANSLATION_KEY } from "@/features/tours/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = {
  params: Promise<LocaleParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: TOURS_TRANSLATION_KEY });

  return {
    title: t("admin.gathering.pageTitle"),
    description: t("admin.gathering.pageDescription"),
  };
}

export default function AdminTourGatheringsPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={TOURS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <div className="space-y-1">
              <PageHeader title={t("admin.gathering.pageTitle")} />
              <p className="text-muted-foreground text-sm">{t("admin.gathering.pageDescription")}</p>
            </div>

            <Suspense fallback={null}>
              <SuspenseBoundary params={params} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function SuspenseBoundary({ params }: { params: Promise<LocaleParams> }) {
  // The (admin) layout and the middleware both gate this URL, but the guard is
  // repeated here so the page cannot become readable by a routing change alone.
  await assertAdmin();

  const { locale } = await params;
  const t = await getTranslations(TOURS_TRANSLATION_KEY);
  const data = await getTourGatheringAdminPageData(locale);

  // Migration 0043 has not run yet. Rendering the board here would query relations
  // that do not exist, so the page explains itself instead.
  if (data.schemaMissing) {
    return (
      <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">{t("admin.gathering.schemaMissing.title")}</p>
          <p className="text-sm">{t("admin.gathering.schemaMissing.body")}</p>
        </div>
      </div>
    );
  }

  return <TourGatheringAdminBoard data={data} />;
}
