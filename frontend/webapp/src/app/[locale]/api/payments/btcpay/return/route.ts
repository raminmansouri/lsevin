import { NextRequest, NextResponse } from "next/server";

import { settleBtcPayPayment } from "@/payment/server/btcpay.service";
import { getGatewayPaymentById } from "@/payment/server/payment.repository";

/**
 * Browser return after BTCPay's hosted checkout. Read-only with respect to
 * failure: it re-checks the invoice (so a fast Lightning payment shows "paid"
 * immediately) but a still-pending crypto payment redirects as "pending" and is
 * never marked failed here — the webhook remains the source of truth.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const paymentId = request.nextUrl.searchParams.get("paymentId") ?? "";

  const url = new URL(`/${locale}/n/app/mobile/booking`, request.nextUrl.origin);
  url.searchParams.set("gateway", "btcpay");

  const payment = paymentId ? await getGatewayPaymentById(paymentId) : null;
  if (!payment || !payment.externalReference) {
    url.searchParams.set("paymentStatus", "pending");
    if (payment?.bookingId) url.searchParams.set("bookingId", payment.bookingId);
    return NextResponse.redirect(url);
  }

  const result = await settleBtcPayPayment({ invoiceId: payment.externalReference });

  url.searchParams.set("paymentStatus", result.status);
  if (result.bookingId) url.searchParams.set("bookingId", result.bookingId);
  if (result.paymentId) url.searchParams.set("paymentId", result.paymentId);
  if (result.referenceId) url.searchParams.set("referenceId", String(result.referenceId));
  if (result.message) url.searchParams.set("message", result.message);

  return NextResponse.redirect(url);
}
