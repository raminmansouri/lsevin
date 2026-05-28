import { NextRequest, NextResponse } from 'next/server';

import { convertMoney } from '@/features/finance/lib/server/currency-queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amount = Number(searchParams.get('amount') || 0);
  const from = searchParams.get('from') || 'USD';
  const to = searchParams.get('to') || 'USD';
  const marginProfile = searchParams.get('marginProfile') || 'standard';

  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
  }

  try {
    const data = await convertMoney({ amount, sourceCurrencyCode: from, targetCurrencyCode: to, marginProfile });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed.' },
      { status: 400 }
    );
  }
}
