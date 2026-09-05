import "server-only";

import sql from "@/config/database/db";

import { getShopContext } from "../lib/context";
import { SHOP_PERMISSIONS, assertShopPermission } from "../lib/permissions";

/**
 * Shop ↔ billing integration (SHP-DB-006, SHP-V02-013/014/015, SHP-V03-010).
 *
 * The canonical billing document lives in `payment_billing.invoices` /
 * `invoice_lines` (owned by the platform billing module). Shop writes there with
 * `source_module = 'shop'` and the order id as the reference — it never invents a
 * second invoice store. `shop.payment_transactions` stays the gateway-attempt
 * log; the two are not competing sources of truth (transactions = attempts,
 * invoices = the issued fiscal/commercial document).
 *
 * Everything degrades cleanly when the billing schema is absent (dev without the
 * .NET billing module), so this never breaks an order flow.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const j = (value: unknown) => sql.json((value ?? {}) as any);

export type ShopInvoiceType = "proforma" | "standard" | "credit_note";

export async function billingAvailable(): Promise<boolean> {
  try {
    const [r] = await sql<{ ok: boolean }[]>`select to_regclass('payment_billing.invoices') is not null as ok`;
    return Boolean(r?.ok);
  } catch {
    return false;
  }
}

function formatInvoiceNumber(type: ShopInvoiceType, seq: number | string, year: number): string {
  const p = type === "proforma" ? "PF" : type === "credit_note" ? "CN" : "INV";
  return `SHP-${p}-${year}-${String(seq).padStart(6, "0")}`;
}

async function issueInternal(input: {
  orderId: string;
  type: ShopInvoiceType;
  amountOverride?: number | null;
  note?: string | null;
  actorUserId?: string | null;
}): Promise<{ id: string; invoiceNumber: string; reused: boolean }> {
  return sql.begin(async (tx) => {
    const [o] = await tx<any[]>`
      select o.id::text as id, o.order_number as "orderNumber", o.customer_id::text as "customerId",
        o.email, o.currency, o.subtotal::float as subtotal, o.tax_total::float as tax,
        o.discount_total::float as discount, o.grand_total::float as total,
        o.placed_at::text as "placedAt"
      from shop.orders o where o.id = ${input.orderId}::uuid limit 1
    `;
    if (!o) throw new Error("Order not found.");

    // Idempotent for proforma / standard — one live document per (order, type).
    // Credit notes may legitimately be issued more than once (partial refunds).
    if (input.type !== "credit_note") {
      const [existing] = await tx<any[]>`
        select id::text as id, invoice_number as "invoiceNumber"
        from payment_billing.invoices
        where source_module = 'shop' and source_entity_id = ${input.orderId}::uuid
          and invoice_type = ${input.type} and status not in ('cancelled', 'void')
        order by created_at desc limit 1
      `;
      if (existing) return { id: existing.id, invoiceNumber: existing.invoiceNumber, reused: true };
    }

    const [{ seq }] = await tx<{ seq: string }[]>`select nextval('payment_billing.invoice_number_seq')::text as seq`;
    const year = new Date().getFullYear();
    const number = formatInvoiceNumber(input.type, seq, year);
    const billToId = o.customerId ?? o.id;
    const sign = input.type === "credit_note" ? -1 : 1;

    const override = typeof input.amountOverride === "number" && input.amountOverride > 0;
    const subtotal = override ? (input.amountOverride as number) : Number(o.subtotal);
    const tax = override ? 0 : Number(o.tax);
    const discount = override ? 0 : Number(o.discount);
    const total = override ? (input.amountOverride as number) : Number(o.total);

    const [inv] = await tx<any[]>`
      insert into payment_billing.invoices
        (invoice_number, invoice_type, status, bill_to_entity_type, bill_to_entity_id,
         source_module, source_entity_type, source_entity_id, currency_code,
         subtotal_amount, tax_amount, discount_amount, total_amount, snapshot)
      values (${number}, ${input.type}, 'issued', 'customer', ${billToId}::uuid,
        'shop', 'order', ${input.orderId}::uuid, ${o.currency},
        ${sign * subtotal}, ${sign * tax}, ${sign * discount}, ${sign * total},
        ${j({ orderNumber: o.orderNumber, email: o.email, placedAt: o.placedAt, note: input.note ?? null })})
      returning id::text as id, invoice_number as "invoiceNumber"
    `;

    if (override) {
      await tx`
        insert into payment_billing.invoice_lines (invoice_id, line_no, description, quantity, unit_amount, line_total)
        values (${inv.id}::uuid, 1, ${input.note || (input.type === "credit_note" ? "Credit note" : "Adjustment")},
          1, ${sign * total}, ${sign * total})
      `;
    } else {
      const items = await tx<any[]>`
        select common.get_translation_t(product_name_snapshot, 'en', 'en') as name,
          quantity, unit_price_snapshot::float as unit, line_total_snapshot::float as total
        from shop.order_items where order_id = ${input.orderId}::uuid order by create_date asc
      `;
      let lineNo = 1;
      for (const it of items) {
        await tx`
          insert into payment_billing.invoice_lines (invoice_id, line_no, description, quantity, unit_amount, line_total)
          values (${inv.id}::uuid, ${lineNo++}, ${it.name}, ${it.quantity},
            ${sign * Number(it.unit)}, ${sign * Number(it.total)})
        `;
      }
    }

    try {
      await tx`
        insert into payment_billing.payment_audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        values (${input.actorUserId ?? null}::uuid, 'shop.invoice.issued', 'invoice', ${inv.id}::uuid,
          ${j({ type: input.type, orderId: input.orderId, invoiceNumber: number })})
      `;
    } catch {
      // audit log is best-effort
    }

    return { id: inv.id, invoiceNumber: inv.invoiceNumber, reused: false };
  });
}

/** Admin issuance (SHP-V02-014). Credit notes require the refund permission. */
export async function issueOrderInvoice(input: {
  orderId: string;
  type: ShopInvoiceType;
  amountOverride?: number | null;
  note?: string | null;
}): Promise<{ id: string; invoiceNumber: string; reused: boolean }> {
  const perm = input.type === "credit_note" ? SHOP_PERMISSIONS.refundsManage : SHOP_PERMISSIONS.ordersManage;
  const { userId } = await assertShopPermission(perm);
  if (!(await billingAvailable())) {
    throw new Error("The billing capability is not available in this environment.");
  }
  return issueInternal({ ...input, actorUserId: userId ?? null });
}

/** Best-effort credit note when a refund is recorded (SHP-V03-010). Never throws. */
export async function issueRefundCreditNote(input: {
  orderId: string;
  amount: number;
  reason?: string | null;
  actorUserId?: string | null;
}): Promise<void> {
  try {
    if (!(await billingAvailable())) return;
    await issueInternal({
      orderId: input.orderId,
      type: "credit_note",
      amountOverride: input.amount,
      note: input.reason ?? "Refund credit note",
      actorUserId: input.actorUserId ?? null,
    });
  } catch (error) {
    console.error("issueRefundCreditNote failed", error);
  }
}

export async function getOrderInvoices(orderId: string): Promise<
  Array<{
    id: string;
    invoiceNumber: string;
    type: string;
    status: string;
    currency: string;
    total: number;
    issueDate: string;
    pdfUrl: string | null;
  }>
> {
  if (!(await billingAvailable())) return [];
  return sql<any[]>`
    select id::text as id, invoice_number as "invoiceNumber", invoice_type as type, status,
      currency_code as currency, total_amount::float as total, issue_date::text as "issueDate",
      pdf_url as "pdfUrl"
    from payment_billing.invoices
    where source_module = 'shop' and source_entity_id = ${orderId}::uuid
    order by created_at asc
  `;
}

/** Customer-facing proforma request (SHP-V02-013). Owner-scoped, no admin role. */
export async function requestOrderProforma(input: {
  orderNumber: string;
  guestEmail?: string | null;
}): Promise<{ id: string; invoiceNumber: string; reused: boolean }> {
  const ctx = await getShopContext();
  const [o] = await sql<any[]>`
    select o.id::text as id, o.customer_id::text as "customerId", lower(o.email) as email
    from shop.orders o where o.order_number = ${input.orderNumber} limit 1
  `;
  if (!o) throw new Error("Order not found.");
  const owns =
    (ctx.customerId && o.customerId === ctx.customerId) ||
    (input.guestEmail && input.guestEmail.trim().toLowerCase() === o.email);
  if (!owns) throw new Error("This order does not belong to you.");
  if (!o.customerId) throw new Error("A proforma invoice is available on a signed-in order.");
  if (!(await billingAvailable())) throw new Error("Invoicing is not available right now.");
  return issueInternal({ orderId: o.id, type: "proforma" });
}
