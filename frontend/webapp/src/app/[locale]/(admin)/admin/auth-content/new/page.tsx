import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthContentAdminForm } from "@/features/auth-content/components/admin/auth-content-admin-form";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Manifest" });

  return {
    title: `New auth content · ${t("name")}`,
  };
}

const NewAuthContentPage = ({ params }: PageProps) => {
  return (
    <Suspense fallback={<AuthContentFormSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const SuspenseBoundary = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  return <AuthContentAdminForm locale={locale} />;
};

function AuthContentFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-[640px] w-full" />
    </div>
  );
}

export default NewAuthContentPage;
