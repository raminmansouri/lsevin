import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { OperationsDashboard } from "@/features/patients/components/admin/operations-dashboard";
import {
  getCaseFunnelMetrics,
  getCaseSegmentation,
  getCaseTimingMetrics,
  getDataQualityMetrics,
  getFollowUpCompletionMetrics,
  getOverdueFollowUps,
} from "@/features/patients/server/analytics-repository";
import { listFollowupScheduleRules } from "@/features/patients/server/followup-automation-repository";
import { patientSchemaExists } from "@/features/patients/server/repository";
import { PATIENTS_TRANSLATION_KEY } from "@/features/patients/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = {
  params: Promise<LocaleParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: PATIENTS_TRANSLATION_KEY });
  return { title: t("admin.operations.title"), description: t("admin.operations.description") };
}

export default function AdminPatientOperationsPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={PATIENTS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <PageHeader title={t("admin.operations.title")} description={t("admin.operations.description")} />
            <Suspense fallback={null}>
              <SuspenseBoundary />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function SuspenseBoundary() {
  // The (admin) layout and the middleware both gate this URL, but the guard is
  // repeated here so the page cannot become readable by a routing change alone.
  await assertAdmin();

  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const schemaExists = await patientSchemaExists();
  if (!schemaExists) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <p className="font-semibold">{t("admin.operations.schemaMissing.title")}</p>
        <p className="text-sm">{t("admin.operations.schemaMissing.body")}</p>
      </div>
    );
  }

  const [funnel, timing, segmentation, followUpCompletion, overdueFollowUps, dataQuality, scheduleRules] = await Promise.all([
    getCaseFunnelMetrics(),
    getCaseTimingMetrics(),
    getCaseSegmentation(),
    getFollowUpCompletionMetrics(),
    getOverdueFollowUps(),
    getDataQualityMetrics(),
    listFollowupScheduleRules(),
  ]);

  return (
    <OperationsDashboard
      funnel={funnel}
      timing={timing}
      segmentation={segmentation}
      followUpCompletion={followUpCompletion}
      overdueFollowUps={overdueFollowUps}
      dataQuality={dataQuality}
      scheduleRules={scheduleRules}
    />
  );
}
