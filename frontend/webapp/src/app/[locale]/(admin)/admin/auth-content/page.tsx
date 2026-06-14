import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthContentAdminList } from "@/features/auth-content/components/admin/auth-content-admin-list";
import { getAdminAuthContentItems } from "@/features/auth-content/db/auth-content-admin.queries";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Manifest" });

  return {
    title: `Auth content · ${t("name")}`,
  };
}

const AuthContentPage = ({ params }: PageProps) => {
  return (
    <Suspense fallback={<AuthContentListSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const SuspenseBoundary = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  const items = await getAdminAuthContentItems(locale);

  return <AuthContentAdminList items={items} />;
};

function AuthContentListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default AuthContentPage;
