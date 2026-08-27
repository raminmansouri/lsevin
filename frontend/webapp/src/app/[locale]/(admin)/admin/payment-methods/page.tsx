import { PaymentMethodsDashboard } from "@/payment/admin/components/payment-methods-dashboard";
import { listPaymentMethodConfigs } from "@/payment/server/payment-method.repository";

export default async function PaymentMethodsPage() {
  const methods = await listPaymentMethodConfigs();
  return <PaymentMethodsDashboard methods={methods} />;
}
