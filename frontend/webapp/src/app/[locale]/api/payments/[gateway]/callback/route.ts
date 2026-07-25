import { NextRequest, NextResponse } from 'next/server';
import { verifyGatewayPayment } from '@/payment/server/payment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; gateway: string }> }
) {
  const { locale, gateway } = await params;

  // BTCPay must never come through here. This handler marks the attempt Failed
  // whenever verification is not an immediate success, which for an async crypto
  // invoice means "not confirmed yet" — it would kill payments still in flight.
  // BTCPay redirects to /api/payments/btcpay/return, which is settle-only.
  if (String(gateway).trim().toLowerCase() === 'btcpay') {
    const returnUrl = new URL(`/${locale}/api/payments/btcpay/return`, request.nextUrl.origin);
    returnUrl.search = request.nextUrl.search;
    return NextResponse.redirect(returnUrl);
  }

  const authority = request.nextUrl.searchParams.get('Authority') ?? request.nextUrl.searchParams.get('authority') ?? '';
  const status = request.nextUrl.searchParams.get('Status') ?? request.nextUrl.searchParams.get('status') ?? '';

  const result = await verifyGatewayPayment({ gateway: gateway as any, authority, status });
  const url = new URL(`/${locale}/n/app/mobile/booking`, request.nextUrl.origin);
  url.searchParams.set('paymentStatus', result.status);
  if (result.bookingId) url.searchParams.set('bookingId', result.bookingId);
  if (result.paymentId) url.searchParams.set('paymentId', result.paymentId);
  if (result.referenceId) url.searchParams.set('referenceId', String(result.referenceId));
  if (result.message) url.searchParams.set('message', result.message);

  return NextResponse.redirect(url);
}
