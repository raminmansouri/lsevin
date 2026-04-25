import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";
import { CustomerForm } from "@/features/customers-admin/components/customer-form";

export default function AddCustomerPage() {
  return (
    <Card>
      <CardHeader className="flex-between border-b"><CardTitle><PageHeader title="Create customer" /></CardTitle></CardHeader>
      <CustomerForm />
    </Card>
  );
}
