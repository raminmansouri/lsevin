import { NextRequest, NextResponse } from 'next/server';

import { priceItemsForViewer, type ViewerPriceRequest } from '@/features/finance/lib/server/viewer-pricing';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ITEMS = 100;

export async function POST(request: NextRequest) {
    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!Array.isArray(body?.items)) {
        return NextResponse.json({ error: 'items is required' }, { status: 400 });
    }

    const items: ViewerPriceRequest[] = body.items.slice(0, MAX_ITEMS).map((item: any) => {
        const toman = item?.valueToman == null ? null : Number(item.valueToman);
        return {
            amount: Number(item?.amount),
            sourceCurrencyCode: String(item?.sourceCurrencyCode || '').trim().toUpperCase(),
            providerId: typeof item?.providerId === 'string' && UUID_RE.test(item.providerId) ? item.providerId : null,
            valueToman: toman != null && Number.isFinite(toman) ? toman : null,
        };
    });

    const results = await priceItemsForViewer(items);

    // Per-visitor answer: must never be cached or shared.
    return NextResponse.json({ items: results }, { headers: { 'Cache-Control': 'private, no-store' } });
}