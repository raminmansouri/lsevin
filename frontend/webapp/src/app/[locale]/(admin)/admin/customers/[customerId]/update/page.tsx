import { notFound } from "next/navigation";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { CustomerDetailCard } from "@/features/customers-admin/components/customer-detail-card";
import { CustomerForm } from "@/features/customers-admin/components/customer-form";
import { getCustomerById } from "@/features/customers-admin/server/repository";

export default async function UpdateCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);
  if (!customer) return notFound();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-between border-b"><CardTitle><PageHeader title={`Update customer ${customer.first_name} ${customer.last_name}`} /></CardTitle></CardHeader>
        <CustomerForm customer={customer} />
      </Card>
      <CustomerDetailCard customer={customer} />
    </div>
  );
}
