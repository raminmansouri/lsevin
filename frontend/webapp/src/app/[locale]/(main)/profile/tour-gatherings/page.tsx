import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { GatheringCampaignsBrowser } from "@/features/tours/components/customer/gathering-campaigns-browser";
import { MyGatheringParticipationsList } from "@/features/tours/components/customer/my-gathering-participations-list";
import { getMyGatheringParticipationsAction } from "@/features/tours/server/actions";
import { TOURS_TRANSLATION_KEY } from "@/features/tours/types";
import type { LocaleParams } from "@/types/next";

// This route sits under /profile, already gated for signed-in users by the
// middleware's protectedSegments list -- see src/lib/auth/routes.ts.

type Props = {
  params: Promise<LocaleParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: TOURS_TRANSLATION_KEY });

  return {
    title: t("customer.pageTitle"),
  };
}

export default function TourGatheringsCustomerPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={TOURS_TRANSLATION_KEY}>
        {(t) => (
          <div className="container space-y-6">
            <PageHeader title={t("customer.pageTitle")} />

            <Suspense fallback={null}>
              <MyParticipationsBoundary />
            </Suspense>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{t("customer.browseTitle")}</h2>
              <GatheringCampaignsBrowser />
            </div>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function MyParticipationsBoundary() {
  const result = await getMyGatheringParticipationsAction();
  return <MyGatheringParticipationsList participations={result.ok ? result.data || [] : []} />;
}
