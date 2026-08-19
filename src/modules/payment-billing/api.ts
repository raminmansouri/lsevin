import { NextResponse } from "next/server";
import { isPaymentGatewayEnabled } from "@core/config/production";
import { verifyGatewayPaymentIntent } from "./repository";

function objectFromUrl(url: URL) {
  return Object.fromEntries(url.searchParams.entries());
}

export async function handleZarinPalCallback({ request }: { request: Request }) {
  if (!isPaymentGatewayEnabled("zarinpal")) {
    return NextResponse.json({ ok: false, error: "ZarinPal is not enabled." }, { status: 503 });
  }
  const url = new URL(request.url);
  const intentId = url.searchParams.get("intentId") || "";
  const authority = url.searchParams.get("Authority") || url.searchParams.get("authority") || undefined;
  const status = url.searchParams.get("Status") || url.searchParams.get("status") || undefined;
  if (!intentId) return NextResponse.json({ ok: false, error: "Missing payment intent id." }, { status: 400 });

  const result = await verifyGatewayPaymentIntent({
    paymentIntentId: intentId,
    gatewayCode: "zarinpal",
    authority,
    status,
    rawPayload: objectFromUrl(url),
  });

  const target = new URL(process.env.PAYMENT_SUCCESS_RETURN_URL || process.env.NEXT_PUBLIC_APP_URL || url.origin);
  target.searchParams.set("paymentIntentId", result.paymentIntentId);
  target.searchParams.set("invoiceId", result.invoiceId);
  target.searchParams.set("status", result.intentStatus);
  return NextResponse.redirect(target);
}

export async function handleIDPayCallback({ request }: { request: Request }) {
  if (!isPaymentGatewayEnabled("idpay")) {
    return NextResponse.json({ ok: false, error: "IDPay is not enabled." }, { status: 503 });
  }
  const url = new URL(request.url);
  const form = request.method === "POST" ? await request.formData().catch(() => null) : null;
  const get = (key: string) => form?.get(key)?.toString() || url.searchParams.get(key) || undefined;
  const intentId = get("intentId") || get("order_id") || "";
  const transactionId = get("id");
  const status = get("status");
  if (!intentId) return NextResponse.json({ ok: false, error: "Missing payment intent id." }, { status: 400 });

  const rawPayload: Record<string, unknown> = { ...objectFromUrl(url) };
  if (form) for (const [key, value] of form.entries()) rawPayload[key] = value.toString();

  const result = await verifyGatewayPaymentIntent({
    paymentIntentId: intentId,
    gatewayCode: "idpay",
    transactionId,
    status,
    rawPayload,
  });

  const target = new URL(process.env.PAYMENT_SUCCESS_RETURN_URL || process.env.NEXT_PUBLIC_APP_URL || url.origin);
  target.searchParams.set("paymentIntentId", result.paymentIntentId);
  target.searchParams.set("invoiceId", result.invoiceId);
  target.searchParams.set("status", result.intentStatus);
  return NextResponse.redirect(target);
}
