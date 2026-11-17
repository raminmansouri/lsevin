import { notFound } from "next/navigation";
import { PaymentGatewayForm } from "@/payment/admin/components/payment-gateway-form";
import { getPaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";

export default async function PaymentGatewaySettingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  // Masked: the form only shows secrets as placeholders, and a blank field keeps the stored value.
  // The full merchant id / tokens never need to reach the browser.
  const gateway = await getPaymentGatewayConfig({ code, includeSecrets: false });

  if (!gateway) notFound();

  return <PaymentGatewayForm gateway={gateway} />;
}
