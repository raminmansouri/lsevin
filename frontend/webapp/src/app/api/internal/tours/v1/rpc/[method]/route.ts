import { NextRequest, NextResponse } from "next/server";

import { handleRpc } from "@/features/tours/server/ops/rpc-registry";

/**
 * Internal RPC for lsevin-portal (docs/designs/tours/IMPLEMENTATION.md).
 * Server-to-server only: Bearer TOURS_INTERNAL_API_KEY + X-Acting-User-Id.
 * All rules live in handleRpc(); this file only adapts HTTP.
 */
export const dynamic = "force-dynamic";
// No `export const runtime`: this Next.js canary (cacheComponents/useCache) rejects that
// route config (see src/app/api/booking-v2/uploads/route.ts). Node.js is the default.

const MAX_BODY_BYTES = 512 * 1024;

export async function POST(request: NextRequest, context: { params: Promise<{ method: string }> }) {
  const { method } = await context.params;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: { kind: "validation", code: "body_too_large" } }, { status: 413 });
  }
  let body: unknown = {};
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: { kind: "validation", code: "body_too_large" } }, { status: 413 });
  }
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      body = Symbol.for("invalid");
    }
  }
  const res = await handleRpc({
    method,
    authorization: request.headers.get("authorization"),
    actingUserId: request.headers.get("x-acting-user-id"),
    requestId: request.headers.get("x-request-id"),
    body: typeof body === "symbol" ? { __invalid_json: true } : body,
  });
  return NextResponse.json(res.body, { status: res.status, headers: { "Cache-Control": "no-store", ...(res.headers ?? {}) } });
}

export function GET() {
  return NextResponse.json({ ok: false, error: { kind: "validation", code: "method_not_allowed" } }, { status: 405, headers: { Allow: "POST" } });
}
