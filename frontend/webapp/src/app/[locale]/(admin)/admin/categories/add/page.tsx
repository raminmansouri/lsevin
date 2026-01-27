import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/features/categories/components/category-form";
import { CATEGORY_TRANSLATION_KEY } from "@/features/categories/constants";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: CATEGORY_TRANSLATION_KEY,
  });

  return {
    title: t("add.page.title"),
    description: t("add.page.description"),
  };
}

const AddPersonPage = async ({ params, searchParams }: PageProps) => {
  const { locale } = await params;
  const { parentId } = await searchParams;
  const t = await getTranslations({
    locale,
    namespace: CATEGORY_TRANSLATION_KEY,
  });

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={parentId ? t("add.childTitle") : t("add.title")} />
        </CardTitle>
      </CardHeader>
      <CategoryForm />
    </Card>
  );
};

export default AddPersonPage;
