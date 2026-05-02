import { notFound } from "next/navigation";
import { PaymentGatewayForm } from "@/payment/admin/components/payment-gateway-form";
import { getPaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";

export default async function PaymentGatewaySettingsPage({
  params,
}: {
  params: Promise<{ gateway: string }>;
}) {
  const { gateway: gatewayCode } = await params;
  const gateway = await getPaymentGatewayConfig({ code: gatewayCode, includeSecrets: true });

  if (!gateway) notFound();

  return <PaymentGatewayForm gateway={gateway} />;
}
