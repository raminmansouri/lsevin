import { PaymentGatewaysDashboard } from "@/payment/admin/components/payment-gateways-dashboard";
import { listPaymentGatewayConfigs } from "@/payment/server/payment-gateway.repository";

export default async function PaymentGatewaysPage() {
  const gateways = await listPaymentGatewayConfigs();
  return <PaymentGatewaysDashboard gateways={gateways} />;
}
