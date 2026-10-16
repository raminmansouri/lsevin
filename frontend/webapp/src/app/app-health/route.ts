// Readiness probe for the mobile apps' domain race (lsevincare.com vs lsevin.ir).
// 204 = this site can serve users right now. Never cached, answers in well under a second, and does not
// render a page. It confirms the backend API behind this site answers (any non-5xx response counts), so a
// site whose API is down loses the race instead of winning it with a page that cannot log anyone in.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store" } as const;

async function apiAnswers(): Promise<boolean> {
  const base = process.env.INTERNAL_API_URL;
  if (!base) return true; // not configured in this environment: do not fail the whole site over it
  try {
    const res = await fetch(new URL("/liveness", base), {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await apiAnswers())) return new NextResponse(null, { status: 503, headers: HEADERS });
  return new NextResponse(null, { status: 204, headers: HEADERS });
}

export const HEAD = GET;
