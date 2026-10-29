import { NextRequest, NextResponse } from 'next/server';
import { getUserPhoneCountryCode } from '@/features/finance/lib/server/currency-queries';
import { timeZoneForCountry } from '@/features/booking-pro/lib/country-timezones';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

/** The customer's default booking time zone, taken from their phone number's country. */
export async function GET(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  const country = await getUserPhoneCountryCode(userId).catch(() => null);
  const browserTimeZone = request.nextUrl.searchParams.get('browserTimeZone');
  return NextResponse.json({ country, timeZone: timeZoneForCountry(country, browserTimeZone) });
}
