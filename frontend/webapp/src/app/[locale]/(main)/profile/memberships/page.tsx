import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { GymMembershipPlansBrowser } from "@/features/gym-memberships/components/customer/gym-membership-plans-browser";
import { GymMembershipsList } from "@/features/gym-memberships/components/customer/gym-memberships-list";
import { getMyMembershipsAction } from "@/features/gym-memberships/server/actions";
import { GYM_MEMBERSHIPS_TRANSLATION_KEY } from "@/features/gym-memberships/types";
import type { LocaleParams } from "@/types/next";

// This route sits under /profile, already gated for signed-in users by the
// middleware's protectedSegments list -- see src/lib/auth/routes.ts.

type Props = {
  params: Promise<LocaleParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: GYM_MEMBERSHIPS_TRANSLATION_KEY });

  return {
    title: t("customer.title"),
  };
}

export default function GymMembershipsCustomerPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={GYM_MEMBERSHIPS_TRANSLATION_KEY}>
        {(t) => (
          <div className="container space-y-6">
            <PageHeader title={t("customer.title")} />

            <Suspense fallback={null}>
              <MyMembershipsBoundary />
            </Suspense>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{t("customer.subscribe.title")}</h2>
              <GymMembershipPlansBrowser />
            </div>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function MyMembershipsBoundary() {
  const result = await getMyMembershipsAction();
  return <GymMembershipsList memberships={result.ok ? result.data || [] : []} />;
}
