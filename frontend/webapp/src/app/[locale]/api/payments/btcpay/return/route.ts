import { NextRequest, NextResponse } from "next/server";

import { seoOrigin } from "@/lib/seo/origin";
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

  // Back to the customer's reservations (that booking's page when known), on the public
  // origin (NEXT_PUBLIC_URL): request.nextUrl.origin is the internal 0.0.0.0:3000 behind the proxy.
  const bookingsUrl = (bookingId?: string | null) =>
    new URL(bookingId ? `/${locale}/n/app/mobile/bookings/${bookingId}` : `/${locale}/n/app/mobile/bookings`, seoOrigin());

  const payment = paymentId ? await getGatewayPaymentById(paymentId) : null;
  if (!payment || !payment.externalReference) {
    const url = bookingsUrl(payment?.bookingId);
    url.searchParams.set("payment", "pending");
    return NextResponse.redirect(url);
  }

  const result = await settleBtcPayPayment({ invoiceId: payment.externalReference });

  const url = bookingsUrl(result.bookingId ?? payment.bookingId);
  url.searchParams.set("payment", result.status);
  if (result.referenceId) url.searchParams.set("ref", String(result.referenceId));
  if (result.message) url.searchParams.set("message", result.message);

  return NextResponse.redirect(url);
}
