import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getStaffById } from "@/features/staff/api/server/get-staff-by-id";
import {
  StaffForm,
  StaffFormSkeleton,
} from "@/features/staff/components/staff-form";
import { STAFF_TRANSLATION_KEY } from "@/features/staff/constants";
import { StaffDetails } from "@/features/staff/types";
import { PageParams, PageProps } from "@/types/next";

interface UpdateStaffPageProps extends PageParams {
  staffId: string;
}

export async function generateMetadata(
  props: PageProps<UpdateStaffPageProps>
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: STAFF_TRANSLATION_KEY,
  });

  return {
    title: t("update.page.title"),
    description: t("update.page.description"),
  };
}

const UpdateStaffPage = async ({ params }: PageProps<UpdateStaffPageProps>) => {
  return (
    <Suspense fallback={<UpdateStaffPageSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const UpdateStaffPageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex-between">
        <CardTitle>
          <Skeleton className="h-10 w-32" />
        </CardTitle>
      </CardHeader>
      <StaffFormSkeleton />
    </Card>
  );
};

const SuspenseBoundary = async ({
  params,
}: {
  params: Promise<{ locale: string; staffId: string }>;
}) => {
  const { staffId } = await params;

  const result = await withBaseHeaders((locale, token) => {
    return getStaffById(staffId, { locale, token });
  });

  return (
    <LocaleBoundary params={params} tanslationNameSpace={STAFF_TRANSLATION_KEY}>
      {(t) => (
        <Card>
          <CardHeader className="flex-between border-b">
            <CardTitle>
              <PageHeader title={t("update.title")} />
            </CardTitle>
          </CardHeader>
          <ServerFetchResult<StaffDetails> singleData result={result}>
            {(staff) => <StaffForm staff={staff} />}
          </ServerFetchResult>
        </Card>
      )}
    </LocaleBoundary>
  );
};

export default UpdateStaffPage;
