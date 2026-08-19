import "server-only";
import { createHash } from "node:crypto";
import { sql } from "@core/db/client";
import type { IssueInvoicePayload } from "@core/modules/contracts";
import type {
  CreatePaymentIntentPayload,
  CreatePaymentIntentResult,
  IssuedInvoiceResult,
  ReconcileBankStatementPayload,
  UploadReceiptPayload,
  VerifyReceiptPayload,
} from "./contracts";
import { idPayCallbackUrl, startIDPayPayment, verifyIDPayPayment } from "./gateways/IDPay/adapter";
import { startZarinPalPayment, verifyZarinPalPayment, zarinPalCallbackUrl } from "./gateways/ZarinPal/adapter";
import { isPaymentGatewayEnabled } from "@core/config/production";

export type ModuleRecord = {
  id: string;
  status?: string | null;
  type?: string | null;
  createdAt?: string | null;
};

export type BillingInvoiceListItem = {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  billToEntityType: string;
  billToEntityId: string;
  sourceModule: string | null;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  issueDate: string;
  dueDate: string | null;
  currencyCode: string;
  subtotalAmount: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  paymentUrl: string;
  createdAt: string;
};

export type PaymentMethodListItem = {
  code: string;
  title: string;
  methodKind: string;
  isEnabled: boolean;
};

export async function getModuleSummary(providerId?: string) {
  const [records, totals] = await Promise.all([listRecentRecords(providerId), getInvoiceTotals(providerId)]);
  return {
    recordCount: records.length,
    providerId: providerId ?? null,
    ...totals,
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      const rows = await sql<ModuleRecord[]>`
        select id::text as id, status, invoice_type as type, created_at::text as "createdAt"
        from payment_billing.invoices
        where bill_to_entity_id = ${providerId}::uuid
           or source_entity_id = ${providerId}::uuid
           or snapshot->'billTo'->>'entityId' = ${providerId}
        order by created_at desc
        limit 10
      `;
      return rows;
    }

    const rows = await sql<ModuleRecord[]>`
      select id::text as id, status, invoice_type as type, created_at::text as "createdAt"
      from payment_billing.invoices
      order by created_at desc
      limit 10
    `;
    return rows;
  } catch {
    return [];
  }
}

export async function getInvoiceTotals(providerId?: string) {
  try {
    if (providerId) {
      const rows = await sql<{ issuedCount: number; openCount: number; paidCount: number; outstandingAmount: string; currencyCode: string }[]>`
        select
          count(*)::int as "issuedCount",
          count(*) filter (where status in ('issued','sent','partially_paid','overdue'))::int as "openCount",
          count(*) filter (where status = 'paid')::int as "paidCount",
          coalesce(sum(greatest(total_amount - paid_amount, 0)), 0)::text as "outstandingAmount",
          coalesce(max(currency_code), 'IRR') as "currencyCode"
        from payment_billing.invoices
        where bill_to_entity_id = ${providerId}::uuid
           or source_entity_id = ${providerId}::uuid
           or snapshot->'billTo'->>'entityId' = ${providerId}
      `;
      return rows[0] ?? { issuedCount: 0, openCount: 0, paidCount: 0, outstandingAmount: "0", currencyCode: "IRR" };
    }

    const rows = await sql<{ issuedCount: number; openCount: number; paidCount: number; outstandingAmount: string; currencyCode: string }[]>`
      select
        count(*)::int as "issuedCount",
        count(*) filter (where status in ('issued','sent','partially_paid','overdue'))::int as "openCount",
        count(*) filter (where status = 'paid')::int as "paidCount",
        coalesce(sum(greatest(total_amount - paid_amount, 0)), 0)::text as "outstandingAmount",
        coalesce(max(currency_code), 'IRR') as "currencyCode"
      from payment_billing.invoices
    `;
    return rows[0] ?? { issuedCount: 0, openCount: 0, paidCount: 0, outstandingAmount: "0", currencyCode: "IRR" };
  } catch {
    return { issuedCount: 0, openCount: 0, paidCount: 0, outstandingAmount: "0", currencyCode: "IRR" };
  }
}

export async function listInvoices(providerId?: string, limit = 50): Promise<BillingInvoiceListItem[]> {
  try {
    if (providerId) {
      return sql<BillingInvoiceListItem[]>`
        select
          id::text,
          invoice_number as "invoiceNumber",
          invoice_type as "invoiceType",
          status,
          bill_to_entity_type as "billToEntityType",
          bill_to_entity_id::text as "billToEntityId",
          source_module as "sourceModule",
          source_entity_type as "sourceEntityType",
          source_entity_id::text as "sourceEntityId",
          issue_date::text as "issueDate",
          due_date::text as "dueDate",
          currency_code as "currencyCode",
          subtotal_amount::text as "subtotalAmount",
          tax_amount::text as "taxAmount",
          total_amount::text as "totalAmount",
          paid_amount::text as "paidAmount",
          concat('/providers/', ${providerId}::text, '/billing?invoiceId=', id::text) as "paymentUrl",
          created_at::text as "createdAt"
        from payment_billing.invoices
        where bill_to_entity_id = ${providerId}::uuid
           or source_entity_id = ${providerId}::uuid
           or snapshot->'billTo'->>'entityId' = ${providerId}
        order by created_at desc
        limit ${limit}
      `;
    }

    return sql<BillingInvoiceListItem[]>`
      select
        id::text,
        invoice_number as "invoiceNumber",
        invoice_type as "invoiceType",
        status,
        bill_to_entity_type as "billToEntityType",
        bill_to_entity_id::text as "billToEntityId",
        source_module as "sourceModule",
        source_entity_type as "sourceEntityType",
        source_entity_id::text as "sourceEntityId",
        issue_date::text as "issueDate",
        due_date::text as "dueDate",
        currency_code as "currencyCode",
        subtotal_amount::text as "subtotalAmount",
        tax_amount::text as "taxAmount",
        total_amount::text as "totalAmount",
        paid_amount::text as "paidAmount",
        concat('/admin/billing?invoiceId=', id::text) as "paymentUrl",
        created_at::text as "createdAt"
      from payment_billing.invoices
      order by created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function listPaymentMethods(): Promise<PaymentMethodListItem[]> {
  try {
    const methods = await sql<PaymentMethodListItem[]>`
      select code, title, method_kind as "methodKind", is_enabled as "isEnabled"
      from payment_billing.payment_methods
      order by method_kind, code
    `;
    return methods.map((method) => ({
      ...method,
      isEnabled: method.isEnabled && (method.methodKind !== "gateway" || isPaymentGatewayEnabled(method.code)),
    }));
  } catch {
    return [];
  }
}

function normalizeInvoiceType(invoiceType: IssueInvoicePayload["invoiceType"]) {
  if (invoiceType === "tax_ir") return "tax_ir";
  return invoiceType;
}

function sumInvoiceAmounts(payload: IssueInvoicePayload) {
  return payload.lines.reduce(
    (acc, line) => {
      const quantity = Number.isFinite(line.quantity) ? line.quantity : 1;
      const unitAmount = Number.isFinite(line.unitAmount) ? line.unitAmount : 0;
      const taxPercent = Number.isFinite(line.taxPercent ?? 0) ? line.taxPercent ?? 0 : 0;
      const lineSubtotal = quantity * unitAmount;
      const lineTax = lineSubtotal * (taxPercent / 100);
      acc.subtotal += lineSubtotal;
      acc.tax += lineTax;
      return acc;
    },
    { subtotal: 0, tax: 0 }
  );
}

export async function issueInvoice(payload: IssueInvoicePayload): Promise<IssuedInvoiceResult> {
  const totals = sumInvoiceAmounts(payload);
  const total = totals.subtotal + totals.tax;
  const invoiceType = normalizeInvoiceType(payload.invoiceType);
  const currencyCode = payload.currencyCode.toUpperCase();

  const invoiceRows = await sql<{ id: string; invoiceNumber: string; status: string; totalAmount: string; currencyCode: string }[]>`
    with seq as (
      select nextval('payment_billing.invoice_number_seq') as value
    )
    insert into payment_billing.invoices (
      invoice_number,
      invoice_type,
      status,
      bill_to_entity_type,
      bill_to_entity_id,
      source_module,
      source_entity_type,
      source_entity_id,
      due_date,
      currency_code,
      subtotal_amount,
      tax_amount,
      total_amount,
      snapshot
    )
    select
      concat('LSV-', to_char(now(), 'YYYYMMDD'), '-', lpad(seq.value::text, 6, '0')),
      ${invoiceType},
      'issued',
      ${payload.billTo.entityType},
      ${payload.billTo.entityId}::uuid,
      ${payload.sourceDocument.moduleCode},
      ${payload.sourceDocument.entityType},
      ${payload.sourceDocument.entityId}::uuid,
      ${payload.dueDate ?? null}::date,
      ${currencyCode},
      ${totals.subtotal},
      ${totals.tax},
      ${total},
      ${JSON.stringify({ title: payload.title, locale: payload.locale ?? "fa-IR", billTo: payload.billTo, sourceDocument: payload.sourceDocument, metadata: payload.metadata ?? {} })}::jsonb
    from seq
    returning id::text, invoice_number as "invoiceNumber", status, total_amount::text as "totalAmount", currency_code as "currencyCode"
  `;

  const invoice = invoiceRows[0];
  if (!invoice) throw new Error("Invoice was not created.");

  for (let index = 0; index < payload.lines.length; index += 1) {
    const line = payload.lines[index];
    const quantity = Number.isFinite(line.quantity) ? line.quantity : 1;
    const unitAmount = Number.isFinite(line.unitAmount) ? line.unitAmount : 0;
    const taxPercent = Number.isFinite(line.taxPercent ?? 0) ? line.taxPercent ?? 0 : 0;
    const lineTotal = quantity * unitAmount * (1 + taxPercent / 100);
    await sql`
      insert into payment_billing.invoice_lines (invoice_id, line_no, description, quantity, unit_amount, tax_percent, line_total, metadata)
      values (${invoice.id}::uuid, ${index + 1}, ${line.description}, ${quantity}, ${unitAmount}, ${taxPercent}, ${lineTotal}, ${JSON.stringify(line.metadata ?? {})}::jsonb)
    `;
  }

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    totalAmount: invoice.totalAmount,
    currencyCode: invoice.currencyCode,
    paymentUrl: `/billing/pay/${invoice.id}`,
  };
}

export async function createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<CreatePaymentIntentResult> {
  const methodCode = payload.methodCode || "card_to_card";
  const authorizedProviderId = payload.authorizedProviderId?.trim() || "";
  const prepared = await sql.begin(async (tx) => {
    const invoiceRows = await tx<{
      id: string;
      invoiceNumber: string;
      status: string;
      totalAmount: string;
      paidAmount: string;
      currencyCode: string;
      title: string | null;
      methodKind: string | null;
      methodEnabled: boolean | null;
    }[]>`
      select i.id::text, i.invoice_number as "invoiceNumber", i.status,
        i.total_amount::text as "totalAmount", i.paid_amount::text as "paidAmount",
        i.currency_code as "currencyCode", i.snapshot->>'title' as title,
        pm.method_kind as "methodKind", pm.is_enabled as "methodEnabled"
      from payment_billing.invoices i
      left join payment_billing.payment_methods pm on pm.code = ${methodCode}
      where i.id = ${payload.invoiceId}::uuid
        and (
          nullif(${authorizedProviderId}, '') is null
          or i.bill_to_entity_id = nullif(${authorizedProviderId}, '')::uuid
          or i.source_entity_id = nullif(${authorizedProviderId}, '')::uuid
          or i.snapshot->'billTo'->>'entityId' = ${authorizedProviderId}
        )
      for update of i
    `;
    const invoice = invoiceRows[0];
    if (!invoice) throw new Error("Invoice was not found for the authorized provider.");
    if (!invoice.methodKind || invoice.methodEnabled === false) throw new Error(`Payment method is disabled or unknown: ${methodCode}.`);
    if (invoice.methodKind === "gateway" && !isPaymentGatewayEnabled(methodCode)) {
      throw new Error(`Payment gateway is not enabled by PAYMENT_GATEWAYS_ENABLED: ${methodCode}.`);
    }
    if (["paid", "cancelled", "void"].includes(invoice.status)) throw new Error(`Invoice ${invoice.invoiceNumber} is not payable in status ${invoice.status}.`);

    const amount = Math.max(Number(invoice.totalAmount) - Number(invoice.paidAmount), 0);
    const currencyCode = invoice.currencyCode.toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invoice has no outstanding amount to pay.");
    if (payload.amount !== undefined && Number(payload.amount) !== amount) throw new Error("Payment amount must equal the invoice outstanding amount.");
    if (payload.currencyCode && payload.currencyCode.toUpperCase() !== currencyCode) throw new Error("Payment currency must match the invoice currency.");

    const existingRows = await tx<CreatePaymentIntentResult[]>`
      select id::text as "paymentIntentId", invoice_id::text as "invoiceId", method_code as "methodCode",
        status, amount::text, currency_code as "currencyCode", redirect_url as "redirectUrl", gateway_reference as "gatewayReference"
      from payment_billing.payment_intents
      where invoice_id = ${invoice.id}::uuid and method_code = ${methodCode}
        and status in ('pending','processing','requires_action')
      order by created_at desc
      limit 1
    `;
    if (existingRows[0]) return { intent: existingRows[0], invoice, isGateway: invoice.methodKind === "gateway", reused: true };

    const intentRows = await tx<{
    paymentIntentId: string;
    invoiceId: string;
    methodCode: string;
    status: string;
    amount: string;
    currencyCode: string;
    redirectUrl: string | null;
    gatewayReference: string | null;
    }[]>`
      insert into payment_billing.payment_intents (
      invoice_id,
      method_code,
      amount,
      currency_code,
      return_url,
      status,
      metadata
    ) values (
      ${payload.invoiceId}::uuid,
      ${methodCode},
      ${amount},
      ${currencyCode},
      ${payload.returnUrl ?? null},
      ${invoice.methodKind === "gateway" ? "processing" : "pending"},
      ${JSON.stringify(payload.metadata ?? {})}::jsonb
    ) returning
      id::text as "paymentIntentId",
      invoice_id::text as "invoiceId",
      method_code as "methodCode",
      status,
      amount::text,
      currency_code as "currencyCode",
      redirect_url as "redirectUrl",
      gateway_reference as "gatewayReference"
    `;
    const intent = intentRows[0];
    if (!intent) throw new Error("Payment intent was not created.");
    return { intent, invoice, isGateway: invoice.methodKind === "gateway", reused: false };
  });

  const { intent, invoice, isGateway, reused } = prepared;
  if (!isGateway || reused) return intent;
  const amount = Number(intent.amount);
  const currencyCode = intent.currencyCode;

  if (methodCode !== "zarinpal" && methodCode !== "idpay") {
    throw new Error(`Unsupported online payment gateway: ${methodCode}.`);
  }
  const callbackUrl = methodCode === "zarinpal" ? zarinPalCallbackUrl(intent.paymentIntentId) : idPayCallbackUrl(intent.paymentIntentId);
  let gatewayResult;
  try {
    gatewayResult = methodCode === "zarinpal"
      ? await startZarinPalPayment({
        paymentIntentId: intent.paymentIntentId,
        invoiceId: intent.invoiceId,
        amount,
        currencyCode,
        description: invoice.title || `LSevin invoice ${invoice.invoiceNumber}`,
        callbackUrl,
        metadata: payload.metadata,
        })
      : await startIDPayPayment({
          paymentIntentId: intent.paymentIntentId,
          invoiceId: intent.invoiceId,
          amount,
          currencyCode,
          description: invoice.title || `LSevin invoice ${invoice.invoiceNumber}`,
          callbackUrl,
          metadata: payload.metadata,
        });
  } catch (error) {
    await sql`update payment_billing.payment_intents set status = 'failed', updated_at = now() where id = ${intent.paymentIntentId}::uuid and status = 'processing'`;
    throw error;
  }

  const updatedRows = await sql<Array<typeof intent>>`
    update payment_billing.payment_intents
    set status = 'requires_action',
        gateway_reference = ${gatewayResult.gatewayReference},
        redirect_url = ${gatewayResult.redirectUrl},
        metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ gatewayStart: gatewayResult.rawResponse })}::jsonb,
        updated_at = now()
    where id = ${intent.paymentIntentId}::uuid and status = 'processing'
    returning
      id::text as "paymentIntentId",
      invoice_id::text as "invoiceId",
      method_code as "methodCode",
      status,
      amount::text,
      currency_code as "currencyCode",
      redirect_url as "redirectUrl",
      gateway_reference as "gatewayReference"
  `;

  await sql`
    insert into payment_billing.payment_gateway_events (payment_intent_id, gateway_code, event_type, payload)
    values (${intent.paymentIntentId}::uuid, ${methodCode}, 'payment_started', ${JSON.stringify(gatewayResult.rawResponse)}::jsonb)
  `;

  return updatedRows[0] ?? intent;
}

export async function verifyGatewayPaymentIntent(input: {
  paymentIntentId: string;
  gatewayCode: "zarinpal" | "idpay";
  authority?: string;
  transactionId?: string;
  status?: string;
  rawPayload?: Record<string, unknown>;
}) {
  const rows = await sql<{
    paymentIntentId: string;
    invoiceId: string;
    methodCode: string;
    amount: string;
    currencyCode: string;
    gatewayReference: string | null;
    intentStatus: string;
    invoiceStatus: string;
  }[]>`
    select
      pi.id::text as "paymentIntentId",
      pi.invoice_id::text as "invoiceId",
      pi.method_code as "methodCode",
      pi.amount::text,
      pi.currency_code as "currencyCode",
      pi.gateway_reference as "gatewayReference",
      pi.status as "intentStatus",
      i.status as "invoiceStatus"
    from payment_billing.payment_intents pi
    join payment_billing.invoices i on i.id = pi.invoice_id
    where pi.id = ${input.paymentIntentId}::uuid
      and pi.method_code = ${input.gatewayCode}
    limit 1
  `;
  const intent = rows[0];
  if (!intent) throw new Error("Payment intent was not found for gateway verification.");
  if (intent.intentStatus === "succeeded") {
    return { paymentIntentId: intent.paymentIntentId, invoiceId: intent.invoiceId, intentStatus: "succeeded", invoiceStatus: intent.invoiceStatus, idempotentReplay: true };
  }

  const callbackReference = input.gatewayCode === "zarinpal" ? input.authority : input.transactionId;
  if (!callbackReference || !intent.gatewayReference || callbackReference !== intent.gatewayReference) {
    throw new Error("Gateway callback reference does not match the payment intent that was started.");
  }

  const amount = Number(intent.amount);
  const verification = input.gatewayCode === "zarinpal"
    ? await verifyZarinPalPayment({ paymentIntentId: intent.paymentIntentId, authority: callbackReference, status: input.status, amount, currencyCode: intent.currencyCode, rawPayload: input.rawPayload })
    : await verifyIDPayPayment({ paymentIntentId: intent.paymentIntentId, transactionId: callbackReference, status: input.status, amount, currencyCode: intent.currencyCode, rawPayload: input.rawPayload });

  return sql.begin(async (tx) => {
    const lockedRows = await tx<{ paymentIntentId: string; invoiceId: string; amount: string; currencyCode: string; intentStatus: string; invoiceStatus: string }[]>`
      select pi.id::text as "paymentIntentId", pi.invoice_id::text as "invoiceId", pi.amount::text,
        pi.currency_code as "currencyCode", pi.status as "intentStatus", i.status as "invoiceStatus"
      from payment_billing.payment_intents pi
      join payment_billing.invoices i on i.id = pi.invoice_id
      where pi.id = ${intent.paymentIntentId}::uuid
      for update of pi, i
    `;
    const locked = lockedRows[0];
    if (!locked) throw new Error("Payment intent disappeared during verification.");
    if (locked.intentStatus === "succeeded") {
      return { paymentIntentId: locked.paymentIntentId, invoiceId: locked.invoiceId, intentStatus: "succeeded", invoiceStatus: locked.invoiceStatus, idempotentReplay: true };
    }

    if (!verification.verified) {
      await tx`
        update payment_billing.payment_intents
        set status = 'failed', metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ gatewayVerification: verification.rawResponse })}::jsonb, updated_at = now()
        where id = ${locked.paymentIntentId}::uuid and status <> 'succeeded'
      `;
      await tx`
        insert into payment_billing.payment_gateway_events(payment_intent_id, gateway_code, event_type, payload)
        values (${locked.paymentIntentId}::uuid, ${input.gatewayCode}, 'payment_failed', ${JSON.stringify({ input, verification })}::jsonb)
      `;
      return { paymentIntentId: locked.paymentIntentId, invoiceId: locked.invoiceId, intentStatus: "failed", invoiceStatus: locked.invoiceStatus, idempotentReplay: false };
    }

    const processorReference = String(verification.gatewayReference || "").trim();
    if (!processorReference) throw new Error("Verified gateway response did not contain a processor reference.");
    await tx`
      update payment_billing.payment_intents
      set status = 'succeeded', gateway_verification_reference = ${processorReference}, verified_at = now(),
          metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ gatewayVerification: verification.rawResponse, cardPan: verification.cardPan ?? null, verifiedAmount: verification.verifiedAmount ?? null })}::jsonb,
          updated_at = now()
      where id = ${locked.paymentIntentId}::uuid and status <> 'succeeded'
    `;
    await tx`
      insert into payment_billing.payment_allocations(invoice_id, source_type, source_id, amount, currency_code, processor_reference, metadata)
      values (${locked.invoiceId}::uuid, 'gateway_intent', ${locked.paymentIntentId}::uuid, ${Number(locked.amount)}, ${locked.currencyCode}, ${processorReference}, ${JSON.stringify({ gatewayCode: input.gatewayCode })}::jsonb)
      on conflict (source_type, source_id) do nothing
    `;
    const invoiceRows = await tx<{ status: string }[]>`
      update payment_billing.invoices i
      set paid_amount = least(i.total_amount, coalesce((select sum(pa.amount) from payment_billing.payment_allocations pa where pa.invoice_id = i.id and pa.currency_code = i.currency_code), 0)),
          status = case
            when coalesce((select sum(pa.amount) from payment_billing.payment_allocations pa where pa.invoice_id = i.id and pa.currency_code = i.currency_code), 0) >= i.total_amount then 'paid'
            when coalesce((select sum(pa.amount) from payment_billing.payment_allocations pa where pa.invoice_id = i.id and pa.currency_code = i.currency_code), 0) > 0 then 'partially_paid'
            else i.status
          end,
          updated_at = now()
      where i.id = ${locked.invoiceId}::uuid
      returning status
    `;
    await tx`
      insert into payment_billing.payment_gateway_events(payment_intent_id, gateway_code, event_type, payload)
      values (${locked.paymentIntentId}::uuid, ${input.gatewayCode}, 'payment_verified', ${JSON.stringify({ input, verification })}::jsonb)
    `;
    return { paymentIntentId: locked.paymentIntentId, invoiceId: locked.invoiceId, intentStatus: "succeeded", invoiceStatus: invoiceRows[0]?.status || "unknown", idempotentReplay: false };
  });
}

export async function uploadPaymentReceipt(payload: UploadReceiptPayload, uploadedByUserId?: string) {
  if (!payload.receiptFileUrl?.startsWith("private://")) {
    throw new Error("Manual payment receipt must be uploaded to private storage before verification.");
  }
  const contentSha256 = String(payload.receiptContentSha256 || "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(contentSha256)) throw new Error("Receipt content hash is missing or invalid.");
  const authorizedProviderId = payload.authorizedProviderId?.trim() || "";
  return sql.begin(async (tx) => {
    const invoiceRows = await tx<{ id: string; status: string; totalAmount: string; paidAmount: string; currencyCode: string; methodKind: string | null; methodEnabled: boolean | null }[]>`
      select i.id::text, i.status, i.total_amount::text as "totalAmount", i.paid_amount::text as "paidAmount",
        i.currency_code as "currencyCode", pm.method_kind as "methodKind", pm.is_enabled as "methodEnabled"
      from payment_billing.invoices i
      left join payment_billing.payment_methods pm on pm.code = ${payload.methodCode}
      where i.id = ${payload.invoiceId}::uuid
        and (
          nullif(${authorizedProviderId}, '') is null
          or i.bill_to_entity_id = nullif(${authorizedProviderId}, '')::uuid
          or i.source_entity_id = nullif(${authorizedProviderId}, '')::uuid
          or i.snapshot->'billTo'->>'entityId' = ${authorizedProviderId}
        )
      for update of i
    `;
    const invoice = invoiceRows[0];
    if (!invoice) throw new Error("Invoice was not found for the authorized provider.");
    if (!invoice.methodKind || invoice.methodEnabled === false || !["manual", "international"].includes(invoice.methodKind)) {
      throw new Error("Manual receipt method is disabled, unknown, or is a gateway method.");
    }
    if (["paid", "cancelled", "void"].includes(invoice.status)) throw new Error(`Invoice is not payable in status ${invoice.status}.`);
    const amount = Math.max(Number(invoice.totalAmount) - Number(invoice.paidAmount), 0);
    const currencyCode = invoice.currencyCode.toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invoice has no outstanding amount for a receipt.");
    if (payload.amount !== undefined && Number(payload.amount) !== amount) throw new Error("Receipt amount must equal the invoice outstanding amount.");
    if (payload.currencyCode && payload.currencyCode.toUpperCase() !== currencyCode) throw new Error("Receipt currency must match the invoice currency.");

    const fingerprint = createHash("sha256").update([
      invoice.id,
      payload.methodCode,
      String(payload.trackingNumber || "").trim(),
      contentSha256,
    ].join(":"), "utf8").digest("hex");
    const rows = await tx<{ id: string; status: string }[]>`
      insert into payment_billing.payment_receipts (
        invoice_id, method_code, amount, currency_code, payer_note, receipt_file_url,
        tracking_number, status, uploaded_by_user_id, metadata, receipt_fingerprint
      ) values (
        ${invoice.id}::uuid, ${payload.methodCode}, ${amount}, ${currencyCode}, ${payload.payerNote ?? null},
        ${payload.receiptFileUrl}, ${payload.trackingNumber ?? null}, 'under_review', ${uploadedByUserId ?? null}::uuid,
        ${JSON.stringify({ storagePath: payload.receiptStoragePath, originalName: payload.receiptOriginalName, mimeType: payload.receiptMimeType, sizeBytes: payload.receiptSizeBytes, contentSha256 })}::jsonb,
        ${fingerprint}
      )
      on conflict (receipt_fingerprint) where receipt_fingerprint is not null do nothing
      returning id::text, status
    `;
    if (rows[0]) return rows[0];
    const existing = await tx<{ id: string; status: string }[]>`
      select id::text, status from payment_billing.payment_receipts where receipt_fingerprint = ${fingerprint} limit 1
    `;
    return existing[0];
  });
}

export async function verifyPaymentReceipt(payload: VerifyReceiptPayload) {
  return sql.begin(async (tx) => {
    const rows = await tx<{ receiptId: string; invoiceId: string; amount: string; currencyCode: string; receiptStatus: string; invoiceStatus: string; trackingNumber: string | null }[]>`
      select pr.id::text as "receiptId", pr.invoice_id::text as "invoiceId", pr.amount::text,
        pr.currency_code as "currencyCode", pr.status as "receiptStatus", i.status as "invoiceStatus", pr.tracking_number as "trackingNumber"
      from payment_billing.payment_receipts pr
      join payment_billing.invoices i on i.id = pr.invoice_id
      where pr.id = ${payload.receiptId}::uuid
      for update of pr, i
    `;
    const receipt = rows[0];
    if (!receipt) throw new Error("Payment receipt was not found.");
    const targetStatus = payload.approved ? "verified" : "rejected";
    if (receipt.receiptStatus === targetStatus) return { ...receipt, idempotentReplay: true };
    if (["verified", "rejected"].includes(receipt.receiptStatus)) {
      throw new Error(`A final ${receipt.receiptStatus} receipt decision cannot be changed by replaying verification.`);
    }
    if (!receipt.trackingNumber && payload.approved) throw new Error("A tracking number is required before a manual receipt can be verified.");

    await tx`
      update payment_billing.payment_receipts
      set status = ${targetStatus}, verified_by_user_id = ${payload.verifiedByUserId ?? null}::uuid,
          verified_at = now(), metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ reviewNote: payload.note ?? null })}::jsonb
      where id = ${receipt.receiptId}::uuid
    `;
    if (payload.approved) {
      await tx`
        insert into payment_billing.payment_allocations(invoice_id, source_type, source_id, amount, currency_code, processor_reference, metadata)
        values (${receipt.invoiceId}::uuid, 'manual_receipt', ${receipt.receiptId}::uuid, ${Number(receipt.amount)}, ${receipt.currencyCode}, ${receipt.trackingNumber}, ${JSON.stringify({ verifiedByUserId: payload.verifiedByUserId ?? null })}::jsonb)
        on conflict (source_type, source_id) do nothing
      `;
    }
    const invoiceRows = await tx<{ status: string }[]>`
      update payment_billing.invoices i
      set paid_amount = least(i.total_amount, coalesce((select sum(pa.amount) from payment_billing.payment_allocations pa where pa.invoice_id = i.id and pa.currency_code = i.currency_code), 0)),
          status = case
            when coalesce((select sum(pa.amount) from payment_billing.payment_allocations pa where pa.invoice_id = i.id and pa.currency_code = i.currency_code), 0) >= i.total_amount then 'paid'
            when coalesce((select sum(pa.amount) from payment_billing.payment_allocations pa where pa.invoice_id = i.id and pa.currency_code = i.currency_code), 0) > 0 then 'partially_paid'
            else i.status
          end,
          updated_at = now()
      where i.id = ${receipt.invoiceId}::uuid
      returning status
    `;
    return { receiptId: receipt.receiptId, invoiceId: receipt.invoiceId, receiptStatus: targetStatus, invoiceStatus: invoiceRows[0]?.status || receipt.invoiceStatus, idempotentReplay: false };
  });
}

export async function reconcileBankStatement(payload: ReconcileBankStatementPayload) {
  const batchRows = await sql<{ id: string }[]>`
    insert into payment_billing.bank_reconciliation_batches (bank_account_code, statement_reference, currency_code, imported_lines_count, matched_lines_count, status, payload)
    values (${payload.bankAccountCode}, ${payload.statementReference ?? null}, ${payload.currencyCode.toUpperCase()}, ${payload.lines.length}, 0, 'imported', ${JSON.stringify(payload)}::jsonb)
    returning id::text
  `;
  return {
    batchId: batchRows[0]?.id,
    importedLinesCount: payload.lines.length,
    matchedLinesCount: 0,
    status: "imported",
  };
}
