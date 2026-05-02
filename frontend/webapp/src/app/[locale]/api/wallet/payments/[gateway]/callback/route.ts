import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletTopUpPayment } from '@/app/wallet/payment-callback';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; gateway: string }> }
) {
  const { locale, gateway } = await params;
  const authority = request.nextUrl.searchParams.get('Authority') ?? request.nextUrl.searchParams.get('authority') ?? '';
  const status = request.nextUrl.searchParams.get('Status') ?? request.nextUrl.searchParams.get('status') ?? '';

  const result = await verifyWalletTopUpPayment({ gateway, authority, status });
  const url = new URL(`/${locale}/n/app/mobile/profile/wallet`, request.nextUrl.origin);
  url.searchParams.set('walletPaymentStatus', result.status);
  url.searchParams.set('message', result.message);
  if ('referenceId' in result && result.referenceId) url.searchParams.set('referenceId', String(result.referenceId));

  return NextResponse.redirect(url);
}
