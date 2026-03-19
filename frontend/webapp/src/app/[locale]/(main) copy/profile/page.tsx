import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import MultiServerFetchResult from "@/components/fetcher/multi-fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { TRANSLATION_KEY } from "@/features/profile/actions/update-additional-info/types";
import {
  ProfileTabs,
  ProfileTabsSkeleton,
} from "@/features/profile/components/profile-tabs";
import { getAllCountries } from "@/features/shared/api/server/get-all-countries";
import { getCurrentUser } from "@/features/shared/api/server/get-current-user";
import { getUserDocuments } from "@/features/shared/api/server/get-user-documents";
import { ILocationCountry } from "@/features/shared/types/location";
import { ICurrentUser, IUserDocuments } from "@/features/shared/types/user";
import { LocalePageProps, LocaleParams } from "@/types/next";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  return {
    title: t("page.title"),
  };
}

const ProfilePage = ({ params }: { params: Promise<LocaleParams> }) => {
  return (
    <Suspense fallback={<ProfileTabsSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {(t) => (
          <div className="container">
            <PageHeader title={t("page.title")} />
            <Suspense fallback={<ProfileTabsSkeleton />}>
              <SuspenseBoundary />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
};

const SuspenseBoundary = async () => {
  const currentUserPromise = withBaseHeaders((locale, token) =>
    getCurrentUser({ locale, token })
  );
  const userDocumentsPromise = withBaseHeaders((locale, token, userId) =>
    getUserDocuments({ locale, token, userId })
  );
  const countriesPromise = withBaseHeaders((locale, token) =>
    getAllCountries({ locale, token })
  );

  const [currentUser, userDocuments, countries] = await Promise.all([
    currentUserPromise,
    userDocumentsPromise,
    countriesPromise,
  ]);

  return (
    <MultiServerFetchResult<
      [ICurrentUser, IUserDocuments[], ILocationCountry[]]
    >
      results={[currentUser, userDocuments, countries]}
    >
      {([userData, documentsData, countriesData]) => (
        <ProfileTabs
          user={userData}
          documents={documentsData}
          countries={countriesData}
        />
      )}
    </MultiServerFetchResult>
  );
};

export default ProfilePage;
