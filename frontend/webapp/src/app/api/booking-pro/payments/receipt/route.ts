
import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';
import { storeBugReportFiles } from '@/features/bug-reports/server/upload';
import db from '@/config/database/db';

const MAX_RECEIPT_BYTES = 15 * 1024 * 1024;
const ALLOWED_PREFIXES = ['image/'];
const ALLOWED_TYPES = new Set(['application/pdf']);

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const bookingId = String(formData.get('bookingId') || '').trim();
    if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });

    // The receipt belongs to a specific booking; refuse to attach it to someone else's.
    const [booking] = await db<any[]>`
      select id from booking.bookings where id = ${bookingId} and user_id = ${userId} limit 1
    `;
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const receipt = formData.get('receipt');
    if (!(receipt instanceof File) || receipt.size === 0) {
      return NextResponse.json({ error: 'A receipt file is required.' }, { status: 400 });
    }

    const mimeType = receipt.type || 'application/octet-stream';
    const isAllowed = ALLOWED_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) || ALLOWED_TYPES.has(mimeType);
    if (!isAllowed) {
      return NextResponse.json({ error: 'The receipt must be an image or a PDF file.' }, { status: 400 });
    }
    if (receipt.size > MAX_RECEIPT_BYTES) {
      return NextResponse.json({ error: 'The receipt file must be 15MB or smaller.' }, { status: 400 });
    }

    const [attachment] = await storeBugReportFiles({ files: [receipt], createdByUserId: userId });
    if (!attachment?.fileUrl) {
      return NextResponse.json({ error: 'Unable to store the receipt.' }, { status: 500 });
    }

    return NextResponse.json({
      fileUrl: attachment.fileUrl,
      mediaId: attachment.mediaId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to upload receipt' }, { status: 500 });
  }
}
