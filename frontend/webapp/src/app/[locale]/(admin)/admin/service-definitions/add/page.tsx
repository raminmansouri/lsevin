import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ServiceDefinitionForm,
  ServiceDefinitionFormSkeleton,
} from "@/features/service-definitions/components/service-definition-form";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "@/features/service-definitions/constants";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: SERVICE_DEFINITION_TRANSLATION_KEY,
  });

  return {
    title: t("add.page.title"),
    description: t("add.page.description"),
  };
}

const AddServiceDefinitionPage = async ({ params }: PageProps) => {
  return (
    <Suspense fallback={<AddServiceDefinitionPageSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const AddServiceDefinitionPageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex-between">
        <CardTitle>
          <ServiceDefinitionFormSkeleton />
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

const SuspenseBoundary = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  return (
    <LocaleBoundary
      params={params}
      tanslationNameSpace={SERVICE_DEFINITION_TRANSLATION_KEY}
    >
      {(t) => (
        <Card>
          <CardHeader className="flex-between border-b">
            <CardTitle>
              <PageHeader title={t("add.title")} />
            </CardTitle>
          </CardHeader>
          <ServiceDefinitionForm />
        </Card>
      )}
    </LocaleBoundary>
  );
};

export default AddServiceDefinitionPage;
