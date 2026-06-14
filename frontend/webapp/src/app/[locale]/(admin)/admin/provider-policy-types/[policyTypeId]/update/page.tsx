import type { Metadata } from "next";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getProviderPolicyTypeByIdServer } from "@/features/provider-policy-types/api/server/get-provider-policy-type-by-id";
import { ProviderPolicyTypeForm } from "@/features/provider-policy-types/components/provider-policy-type-form";
import type { PageProps } from "@/types/next";

type PageParams = { locale: string; policyTypeId: string };

export const metadata: Metadata = {
  title: "Update provider policy type",
  description: "Edit a provider policy type.",
};

const UpdateProviderPolicyTypePage = async ({ params }: PageProps<PageParams>) => {
  const { locale, policyTypeId } = await params;
  const result = await getProviderPolicyTypeByIdServer(policyTypeId, { locale });

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Update provider policy type" description="Edit code, translations, status, and display order." />
        </CardTitle>
      </CardHeader>
      {result.error ? (
        <div className="p-6 text-sm text-destructive">{result.error.detail || "Provider policy type could not be loaded."}</div>
      ) : result.data ? (
        <ProviderPolicyTypeForm key={result.data.id} item={result.data} />
      ) : (
        <div className="p-6 text-sm text-muted-foreground">Provider policy type was not found.</div>
      )}
    </Card>
  );
};

export default UpdateProviderPolicyTypePage;
