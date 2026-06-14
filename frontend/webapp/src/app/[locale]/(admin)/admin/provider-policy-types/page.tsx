import type { Metadata } from "next";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderPolicyTypesList } from "@/features/provider-policy-types/components/provider-policy-types-list";
import { getProviderPolicyTypesServer } from "@/features/provider-policy-types/api/server/get-provider-policy-types";
import type { PageProps } from "@/types/next";

type PageParams = { locale: string };

export const metadata: Metadata = {
  title: "Provider policy types",
  description: "Manage reusable provider policy type definitions.",
};

const ProviderPolicyTypesPage = async ({ params }: PageProps<PageParams>) => {
  const { locale } = await params;
  const result = await getProviderPolicyTypesServer({ locale });

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Provider policy types" description="CRUD for reusable policy types used by provider policies." />
        </CardTitle>
      </CardHeader>
      {result.error ? (
        <div className="p-6 text-sm text-destructive">{result.error.detail || "Provider policy types could not be loaded."}</div>
      ) : (
        <ProviderPolicyTypesList items={result.data || []} />
      )}
    </Card>
  );
};

export default ProviderPolicyTypesPage;
