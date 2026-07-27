import { NextRequest, NextResponse } from "next/server";

import {
  resolveBtcPayWebhookSecret,
  settleBtcPayPayment,
  verifyBtcPayWebhookSignature,
} from "@/payment/server/btcpay.service";

// BTCPay events that should trigger a (re-verified) settlement pass.
const CREDIT_EVENTS = new Set(["InvoiceSettled"]);
const DEAD_EVENTS = new Set(["InvoiceExpired", "InvoiceInvalid"]);

type BtcPayWebhookEvent = {
  type?: string;
  invoiceId?: string;
  storeId?: string;
  data?: { invoiceId?: string } | null;
};

export async function POST(request: NextRequest) {
  // Raw body is required for HMAC verification — do not use request.json().
  const rawBody = await request.text();

  const secret = await resolveBtcPayWebhookSecret();
  if (!verifyBtcPayWebhookSignature(rawBody, request.headers.get("BTCPay-Sig"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: BtcPayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as BtcPayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(event.type || "");
  const invoiceId = String(event.invoiceId || event.data?.invoiceId || "").trim();

  if (invoiceId && (CREDIT_EVENTS.has(type) || DEAD_EVENTS.has(type))) {
    try {
      // Settlement re-reads the invoice from BTCPay before crediting, so the
      // webhook body alone can never mark a booking paid. Idempotent.
      await settleBtcPayPayment({ invoiceId });
    } catch (error) {
      // Return 500 so BTCPay retries transient failures (DB blips, etc.).
      console.error("[btcpay:webhook] settlement failed", { type, invoiceId, error });
      return NextResponse.json({ error: "Settlement failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
