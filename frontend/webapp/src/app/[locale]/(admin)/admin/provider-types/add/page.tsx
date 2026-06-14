import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderTypeForm } from "@/features/provider-types/components/provider-type-form";
import { PROVIDER_TYPE_TRANSLATION_KEY } from "@/features/provider-types/constants";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: PROVIDER_TYPE_TRANSLATION_KEY,
  });

  return {
    title: t("add.page.title"),
    description: t("add.page.description"),
  };
}

const AddProviderTypePage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: PROVIDER_TYPE_TRANSLATION_KEY,
  });

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={t("add.title")} />
        </CardTitle>
      </CardHeader>
      <ProviderTypeForm />
    </Card>
  );
};

export default AddProviderTypePage;
