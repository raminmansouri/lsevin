import { NextRequest, NextResponse } from "next/server";

import { verifyWalletTopUpPayment } from "@/app/wallet/payment-callback";

function getAppBaseUrl(request: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  if (configured) return configured.replace(/\/$/, "");

  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}

function buildWalletRedirect(request: NextRequest, locale: string, status: string, message?: string | null) {
  const url = new URL(`/${locale}/app/wallet`, getAppBaseUrl(request));
  url.searchParams.set("payment", status);
  if (message) url.searchParams.set("message", message);
  return url;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> | { locale: string } }
) {
  const params = await context.params;
  const locale = params.locale || "en";
  const authority =
    request.nextUrl.searchParams.get("Authority") ||
    request.nextUrl.searchParams.get("authority") ||
    "";
  const status =
    request.nextUrl.searchParams.get("Status") ||
    request.nextUrl.searchParams.get("status") ||
    "";

  const result = await verifyWalletTopUpPayment({
    gateway: "zarinpal",
    authority,
    status,
  });

  return NextResponse.redirect(buildWalletRedirect(request, locale, result.status, result.message));
}
