import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { TransferRoutesAdminBoard } from "@/features/transfers/components/admin/transfer-routes-admin-board";
import { getTransferRoutesAdminPageData } from "@/features/transfers/server/repository";
import { TRANSFERS_TRANSLATION_KEY } from "@/features/transfers/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = {
  params: Promise<LocaleParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: TRANSFERS_TRANSLATION_KEY });

  return {
    title: t("admin.title"),
    description: t("admin.description"),
  };
}

export default function AdminTransferRoutesPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSFERS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <div className="space-y-1">
              <PageHeader title={t("admin.title")} />
              <p className="text-muted-foreground text-sm">{t("admin.description")}</p>
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
  const t = await getTranslations(TRANSFERS_TRANSLATION_KEY);
  const data = await getTransferRoutesAdminPageData(locale);

  // Migration 0040 has not run yet. Rendering the board here would query relations
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

  return <TransferRoutesAdminBoard data={data} />;
}
