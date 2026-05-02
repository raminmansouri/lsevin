import { NextRequest, NextResponse } from 'next/server';
import { listEnabledPaymentGatewayOptions } from '@/payment/server/payment-gateway.repository';

export async function GET(request: NextRequest) {
  try {
    const context = request.nextUrl.searchParams.get('context') === 'wallet_topup'
      ? 'wallet_topup'
      : 'booking_online_card';
    const items = await listEnabledPaymentGatewayOptions({ context });
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to load payment gateways.' }, { status: 500 });
  }
}
