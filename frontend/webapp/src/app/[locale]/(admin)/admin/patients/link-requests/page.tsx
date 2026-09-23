import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { LinkRequestsPanel } from "@/features/patients/components/admin/link-requests-panel";
import { listPendingRequestsWithMatch } from "@/features/patients/server/link-request-repository";
import { patientSchemaExists } from "@/features/patients/server/repository";
import { PATIENTS_TRANSLATION_KEY } from "@/features/patients/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = { params: Promise<LocaleParams> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: PATIENTS_TRANSLATION_KEY });
  return { title: t("admin.linkRequests.title"), description: t("admin.linkRequests.description") };
}

export default function AdminPatientLinkRequestsPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={PATIENTS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <PageHeader title={t("admin.linkRequests.title")} description={t("admin.linkRequests.description")} />
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
  await assertAdmin();

  const t = await getTranslations(PATIENTS_TRANSLATION_KEY);
  const schemaExists = await patientSchemaExists();
  if (!schemaExists) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <p className="font-semibold">{t("admin.schemaMissing.title")}</p>
        <p className="text-sm">{t("admin.schemaMissing.body")}</p>
      </div>
    );
  }

  const requests = await listPendingRequestsWithMatch();
  return <LinkRequestsPanel requests={requests} />;
}
