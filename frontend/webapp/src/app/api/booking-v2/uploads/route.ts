import { NextRequest, NextResponse } from 'next/server';

// Intentionally no `export const runtime = "nodejs";`
// because Next.js 15.6 canary with cacheComponents rejects that route config.

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Wire this to your real storage/media-manager route.
    return NextResponse.json({
      ok: true,
      fileName: file.name,
      size: file.size,
      type: file.type,
      message: 'Replace this placeholder with your real media upload pipeline or picker integration.',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}
