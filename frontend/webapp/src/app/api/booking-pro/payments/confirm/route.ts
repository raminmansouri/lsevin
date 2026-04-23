
import { NextRequest, NextResponse } from 'next/server';
import { confirmBookingPayment } from '@/features/booking-pro/server/payment-repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await confirmBookingPayment(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to confirm payment' }, { status: 500 });
  }
}
