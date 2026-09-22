import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { PatientsAdminBoard } from "@/features/patients/components/admin/patients-admin-board";
import { patientSchemaExists, searchPatients } from "@/features/patients/server/repository";
import { PATIENTS_TRANSLATION_KEY } from "@/features/patients/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = {
  params: Promise<LocaleParams>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: PATIENTS_TRANSLATION_KEY });
  return { title: t("admin.title"), description: t("admin.description") };
}

export default function AdminPatientsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={PATIENTS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <PageHeader title={t("admin.title")} description={t("admin.description")} />
            <Suspense fallback={null}>
              <SuspenseBoundary searchParams={searchParams} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function SuspenseBoundary({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // The (admin) layout and the middleware both gate this URL, but the guard is
  // repeated here so the page cannot become readable by a routing change alone.
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

  const { q } = await searchParams;
  const results = q ? await searchPatients(q, 50) : [];
  return <PatientsAdminBoard initialQuery={q ?? ""} results={results} />;
}
