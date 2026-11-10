import { NextRequest, NextResponse } from "next/server";

import { manualMethodAllowed } from "@/features/consultation/server/video-foreign-payment";
import { submitReceipt } from "@/features/consultation/server/session-changes-repository";
import { storeBugReportFiles } from "@/features/bug-reports/server/upload";
import { getSession } from "@/lib/auth/session";

const MAX_RECEIPT_BYTES = 15 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A foreign patient pays a video consultation with a manual method from the payment settings
 * (a bank receipt, or any other method an admin added for international patients). The payment
 * waits for an admin in the consultation payments queue, exactly like the receipt flow before.
 * Answers with an error code the session page translates (Consultation.booking.errors.*).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const session = await getSession({ redirectToLogin: false, adminRequired: false });
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signIn" }, { status: 401 });
  if (!UUID.test(sessionId)) return NextResponse.json({ error: "notFound" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const methodCode = String(formData.get("methodCode") || "").trim().toLowerCase();
  // The code comes from the browser: it must be a manual method this patient is offered.
  if (!(await manualMethodAllowed(userId, methodCode))) {
    return NextResponse.json({ error: "paymentUnavailable" }, { status: 400 });
  }

  const file = formData.get("receipt");
  const hasFile = file instanceof File && file.size > 0;
  // A bank receipt needs the transfer slip; another manual method may come without one.
  if (methodCode === "bank_receipt" && !hasFile) return NextResponse.json({ error: "receiptMissing" }, { status: 400 });

  let mediaId: string | null = null;
  if (hasFile) {
    const mimeType = file.type || "application/octet-stream";
    if (!(mimeType.startsWith("image/") || mimeType === "application/pdf") || file.size > MAX_RECEIPT_BYTES) {
      return NextResponse.json({ error: "receiptMissing" }, { status: 400 });
    }
    try {
      const [stored] = await storeBugReportFiles({ files: [file], createdByUserId: userId });
      mediaId = stored?.mediaId ? String(stored.mediaId) : null;
    } catch (error) {
      console.error("[consultation] receipt upload failed", error);
      return NextResponse.json({ error: "loadFailed" }, { status: 500 });
    }
    if (!mediaId) return NextResponse.json({ error: "loadFailed" }, { status: 500 });
  }

  try {
    const result = await submitReceipt({ userId, sessionId, mediaId, methodCode });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[consultation] manual payment failed", error);
    return NextResponse.json({ error: "loadFailed" }, { status: 500 });
  }
}
