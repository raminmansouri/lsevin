import { notFound } from "next/navigation";
import { PaymentGatewayForm } from "@/payment/admin/components/payment-gateway-form";
import { getPaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";

export default async function PaymentGatewaySettingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const gateway = await getPaymentGatewayConfig({ code, includeSecrets: true });

  if (!gateway) notFound();

  return <PaymentGatewayForm gateway={gateway} />;
}
