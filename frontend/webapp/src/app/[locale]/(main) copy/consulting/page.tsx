import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import MultiServerFetchResult from "@/components/fetcher/multi-fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { withBaseHeaders } from "@/config/http/http-service.server";
import {
  ConsultingForm,
  ConsultingFormSkeleton,
} from "@/features/consulting/components/consulting-form";
import { TRANSLATION_KEY } from "@/features/consulting/types/constants";
import { getUserDocuments } from "@/features/shared/api/server/get-user-documents";
import { IUserDocuments } from "@/features/shared/types/user";
import { LocalePageProps, LocaleParams } from "@/types/next";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

const ConsultingPage = ({ params }: { params: Promise<LocaleParams> }) => {
  return (
    <Suspense fallback={<ConsultingFormSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {(_) => (
          <div className="container">
            <Suspense fallback={<ConsultingFormSkeleton />}>
              <SuspenseBoundary />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
};

const SuspenseBoundary = async () => {
  const userDocumentsPromise = withBaseHeaders((locale, token, userId) =>
    getUserDocuments({ locale, token, userId })
  );

  const [userDocuments] = await Promise.all([userDocumentsPromise]);

  return (
    <MultiServerFetchResult<[IUserDocuments[]]> results={[userDocuments]}>
      {([documentsData]) => <ConsultingForm documents={documentsData} />}
    </MultiServerFetchResult>
  );
};

export default ConsultingPage;
