import { NextRequest, NextResponse } from "next/server";

import { verifyGatewayCallback } from "@/features/shop/server/shop-payment.service";

/**
 * Gateway return / webhook endpoint for Shop orders. Verification is
 * server-to-server via the provider adapter and settlement is idempotent, so a
 * replayed callback (customer refresh, provider retry) is safe
 * (SHP-V01-019, SHP-NFR-004, SHP-PAY-006).
 *
 * Zarinpal returns the customer with `?Authority=...&Status=OK|NOK` on GET.
 */
async function handle(req: NextRequest, gateway: string, locale: string) {
  const url = new URL(req.url);
  let authority =
    url.searchParams.get("Authority") ||
    url.searchParams.get("authority") ||
    url.searchParams.get("token") ||
    "";
  let status = url.searchParams.get("Status") || url.searchParams.get("status") || "";

  if (!authority && req.method === "POST") {
    try {
      const body = await req.json();
      authority = body.authority || body.Authority || body.invoiceId || authority;
      status = body.status || body.Status || status;
    } catch {
      /* ignore non-JSON bodies */
    }
  }

  const result = await verifyGatewayCallback({ gateway, authority, status });

  const base = `/${locale || "fa"}/n/app/mobile/shop`;
  if (!result.orderNumber) {
    return NextResponse.redirect(new URL(`${base}/cart?payment=failed`, url.origin));
  }
  const q = result.status === "succeeded" ? "paid" : result.status;
  return NextResponse.redirect(new URL(`${base}/order/${result.orderNumber}?payment=${q}`, url.origin));
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ locale: string; gateway: string }> }) {
  const { locale, gateway } = await ctx.params;
  return handle(req, gateway, locale);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ locale: string; gateway: string }> }) {
  const { locale, gateway } = await ctx.params;
  return handle(req, gateway, locale);
}
