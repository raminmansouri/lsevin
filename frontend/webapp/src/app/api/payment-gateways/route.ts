import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';
import { filterGatewaysForRegion, resolveUserPaymentRegion } from '@/payment/server/gateway-eligibility';
import { listEnabledPaymentGatewayOptions } from '@/payment/server/payment-gateway.repository';

export async function GET(request: NextRequest) {
    try {
        const context = request.nextUrl.searchParams.get('context') === 'wallet_topup'
            ? 'wallet_topup'
            : 'booking_online_card';
        const items = await listEnabledPaymentGatewayOptions({ context });

        // Each customer is shown only the gateway meant for their region (decided by the
        // phone number they registered with), the same rule createBookingPaymentIntent
        // enforces. Without a logged-in user there is nothing to decide by, so the list is
        // returned as before.
        const userId = await resolveCurrentUserId().catch(() => null);
        if (!userId) return NextResponse.json({ items });

        const region = await resolveUserPaymentRegion(userId);
        return NextResponse.json({ items: filterGatewaysForRegion(items, region) });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message ?? 'Unable to load payment gateways.' }, { status: 500 });
    }
}