import { notFound } from "next/navigation";
import { PaymentMethodForm } from "@/payment/admin/components/payment-method-form";
import { getPaymentMethodConfig, MANUAL_PAYMENT_METHOD_CODES } from "@/payment/server/payment-method.repository";

export default async function PaymentMethodSettingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!MANUAL_PAYMENT_METHOD_CODES.includes(code as (typeof MANUAL_PAYMENT_METHOD_CODES)[number])) {
    notFound();
  }

  const method = await getPaymentMethodConfig(code);
  if (!method) notFound();

  return <PaymentMethodForm method={method} />;
}
