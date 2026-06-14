import type { Metadata } from "next";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderPolicyTypeForm } from "@/features/provider-policy-types/components/provider-policy-type-form";

export const metadata: Metadata = {
  title: "Add provider policy type",
  description: "Create a provider policy type.",
};

const AddProviderPolicyTypePage = () => (
  <Card className="border-gray-200 shadow-sm">
    <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
      <CardTitle>
        <PageHeader title="Add provider policy type" description="Create a reusable policy type such as cancellation, refund, reschedule, or check-in." />
      </CardTitle>
    </CardHeader>
    <ProviderPolicyTypeForm />
  </Card>
);

export default AddProviderPolicyTypePage;
