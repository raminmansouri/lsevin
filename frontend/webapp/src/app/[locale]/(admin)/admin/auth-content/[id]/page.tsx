import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthContentAdminForm } from "@/features/auth-content/components/admin/auth-content-admin-form";
import { getAdminAuthContentItem } from "@/features/auth-content/db/auth-content-admin.queries";

type AuthContentEditPageParams = {
  locale: string;
  id: string;
};

type AuthContentEditPageProps = {
  params: Promise<AuthContentEditPageParams>;
};

export async function generateMetadata(
  props: AuthContentEditPageProps,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Manifest" });

  return {
    title: `Edit auth content · ${t("name")}`,
  };
}

const EditAuthContentPage = ({ params }: AuthContentEditPageProps) => {
  return (
    <Suspense fallback={<AuthContentFormSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const SuspenseBoundary = async ({ params }: AuthContentEditPageProps) => {
  const { locale, id } = await params;
  const item = await getAdminAuthContentItem(id);
  if (!item) notFound();

  return <AuthContentAdminForm item={item} locale={locale} />;
};

function AuthContentFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-[640px] w-full" />
    </div>
  );
}

export default EditAuthContentPage;
