import { NextRequest, NextResponse } from "next/server";

import { verifyVideoSessionPayment } from "@/features/consultation/server/video-payment";
import { seoOrigin } from "@/lib/seo/origin";
import { readGatewayReturn } from "@/payment/gateways";
import { gatewayReturnOrigin } from "@/payment/server/return-origin";

/**
 * Gateway return for video consultations. Zarinpal sends the patient back with
 * `?Authority=...&Status=OK|NOK`; verification happens server to server and
 * settling is idempotent, so a refresh or a retried callback is safe.
 */
async function handle(req: NextRequest, gateway: string, locale: string) {
  const url = new URL(req.url);
  const { authority, status } = readGatewayReturn(gateway, url.searchParams);
  const safeLocale = locale || "fa";

  let result: Awaited<ReturnType<typeof verifyVideoSessionPayment>>;
  try {
    result = await verifyVideoSessionPayment({ gateway, authority, status, locale: safeLocale });
  } catch (error) {
    console.error("[consultation] payment callback failed", error);
    result = { sessionId: null, outcome: "failed" };
  }

  // Public origin, not url.origin (the internal 0.0.0.0:3000 behind the proxy).
  const target = result.sessionId
    ? `/${safeLocale}/n/app/mobile/consultation/sessions/${result.sessionId}?payment=${result.outcome}`
    : `/${safeLocale}/account/bookings?payment=failed`;
  const origin = gateway === "zibal" ? await gatewayReturnOrigin(gateway) : seoOrigin();
  return NextResponse.redirect(new URL(target, origin));
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ locale: string; gateway: string }> }) {
  const { locale, gateway } = await ctx.params;
  return handle(req, gateway, locale);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ locale: string; gateway: string }> }) {
  const { locale, gateway } = await ctx.params;
  return handle(req, gateway, locale);
}
