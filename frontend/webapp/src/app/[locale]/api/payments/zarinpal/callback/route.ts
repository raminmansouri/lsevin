import { NextRequest, NextResponse } from "next/server";

import { seoOrigin } from "@/lib/seo/origin";
import { verifyGatewayPayment } from "@/payment/server/payment.service";

type RouteContext = {
  params: Promise<{ locale: string }> | { locale: string };
};

async function getLocale(context: RouteContext): Promise<string> {
  const params = await Promise.resolve(context.params);
  return String(params?.locale || "fa").trim() || "fa";
}

export async function GET(request: NextRequest, context: RouteContext) {
  const locale = await getLocale(context);
  const authority = request.nextUrl.searchParams.get("Authority") || request.nextUrl.searchParams.get("authority") || "";
  const status = request.nextUrl.searchParams.get("Status") || request.nextUrl.searchParams.get("status") || "";

  const result = await verifyGatewayPayment({
    gateway: "zarinpal",
    authority,
    status,
  });

  const bookingPath = result.bookingId
    ? `/${locale}/n/app/mobile/bookings/${result.bookingId}`
    : `/${locale}/n/app/mobile/bookings`;

  // Public site origin (NEXT_PUBLIC_URL), not request.url: behind the proxy the server
  // listens on 0.0.0.0:3000, so request.url would send the customer there after paying.
  const redirectUrl = new URL(bookingPath, seoOrigin());
  redirectUrl.searchParams.set("payment", result.status);
  if (result.referenceId) redirectUrl.searchParams.set("ref", String(result.referenceId));
  if (result.message) redirectUrl.searchParams.set("message", result.message);

  return NextResponse.redirect(redirectUrl);
}
