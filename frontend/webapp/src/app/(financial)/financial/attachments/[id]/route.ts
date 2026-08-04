import { NextResponse } from "next/server";

import { readAttachment } from "@/accounting/server/attachments.service";

/**
 * Serves one attachment's bytes.
 *
 * Sits outside the (protected) route group because a route handler has no
 * layout, so the layout's auth gate would never run for it. readAttachment()
 * calls assertAccounting("read") itself, which is what actually guards this — a
 * URL that streams invoices must not rely on where its file happens to live.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  let file;
  try {
    file = await readAttachment(id);
  } catch {
    // assertAccounting throws for anyone without panel access. Answer 404 rather
    // than 403 so an unauthenticated probe cannot enumerate which ids exist.
    return new NextResponse(null, { status: 404 });
  }

  if (!file) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      // `attachment` rather than `inline`: a PDF or SVG rendered in the panel's
      // own origin could script against the session that fetched it.
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Content-Length": String(file.bytes.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
