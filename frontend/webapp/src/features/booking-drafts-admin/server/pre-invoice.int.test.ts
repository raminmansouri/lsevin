/** Admin pre-invoice for booking drafts, read-only against the local DB. */
import { afterAll, describe, expect, it } from "vitest";

import sql from "@/config/database/db";
import { draftStatusKey, paymentMethodKey } from "../components/draft-labels";
import { formatClock, formatDay, formatMoney } from "../lib/format";
import { getBookingDraftPreInvoice } from "./pre-invoice";

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe("booking draft pre-invoice", () => {
  it("returns null for a malformed or unknown draft id instead of throwing", async () => {
    expect(await getBookingDraftPreInvoice("not-a-uuid", "fa-IR")).toBeNull();
    expect(await getBookingDraftPreInvoice("00000000-0000-4000-8000-000000000000", "fa-IR")).toBeNull();
  });

  it("mirrors the stored draft totals and never writes to the draft", async () => {
    const drafts = await sql<{ id: string; updatedAt: Date; total: string; subtotal: string; addons: string }[]>`
      select id::text, updated_at as "updatedAt", total_amount::text as total, subtotal_amount::text as subtotal, addons_amount::text as addons
      from booking.booking_drafts order by updated_at desc limit 25`;
    if (drafts.length === 0) return;

    for (const draft of drafts) {
      const invoice = await getBookingDraftPreInvoice(draft.id, "fa-IR");
      expect(invoice).not.toBeNull();
      expect(invoice!.id).toBe(draft.id);
      expect(invoice!.totalAmount).toBe(Number(draft.total));
      expect(invoice!.subtotalAmount).toBe(Number(draft.subtotal));
      expect(invoice!.addonsAmount).toBe(Number(draft.addons));
      if (invoice!.dueNowAmount !== null && invoice!.remainingAmount !== null) {
        expect(invoice!.dueNowAmount + invoice!.remainingAmount).toBeCloseTo(invoice!.totalAmount, 1);
      }
      const main = invoice!.lines.find((line) => line.kind === "main");
      if (main) expect(main.amount).toBe(Number(draft.subtotal));
    }

    const [after] = await sql<{ updatedAt: Date }[]>`select updated_at as "updatedAt" from booking.booking_drafts where id = ${drafts[0].id}`;
    expect(after.updatedAt.getTime()).toBe(drafts[0].updatedAt.getTime());
  });

  it("lists every child booking and add-on of a draft as its own line", async () => {
    const [withChildren] = await sql<{ id: string; children: number; addons: number }[]>`
      select d.id::text,
             (select count(*)::int from booking.booking_draft_child_bookings c where c.parent_draft_id = d.id) as children,
             (select count(*)::int from booking.booking_draft_addons a where a.draft_id = d.id) as addons
      from booking.booking_drafts d
      where exists (select 1 from booking.booking_draft_child_bookings c where c.parent_draft_id = d.id)
         or exists (select 1 from booking.booking_draft_addons a where a.draft_id = d.id)
      order by d.updated_at desc limit 1`;
    if (!withChildren) return;
    const invoice = await getBookingDraftPreInvoice(withChildren.id, "en-US");
    expect(invoice!.lines.filter((line) => line.kind === "child")).toHaveLength(withChildren.children);
    expect(invoice!.lines.filter((line) => line.kind === "addon")).toHaveLength(withChildren.addons);
  });
});

describe("pre-invoice labels and formatting", () => {
  it("maps the statuses the booking flow writes", () => {
    expect(draftStatusKey("Draft")).toBe("draft");
    expect(draftStatusKey("InProgress")).toBe("inProgress");
    expect(draftStatusKey("Submitted")).toBe("submitted");
    expect(draftStatusKey("Cancelled")).toBe("cancelled");
    expect(draftStatusKey("Completed")).toBe("completed");
    expect(draftStatusKey("Weird")).toBeNull();
    expect(draftStatusKey(null)).toBeNull();
    expect(paymentMethodKey("pay_on_delivery")).toBe("payOnDelivery");
    expect(paymentMethodKey("btcpay")).toBe("btcpay");
    expect(paymentMethodKey("gateway_card")).toBe("gatewayCard");
    expect(paymentMethodKey("something_new")).toBeNull();
  });

  it("uses Persian digits and the Jalali calendar for fa", () => {
    expect(formatDay("2026-03-21", "fa")).toMatch(/۱۴۰۵/);
    expect(formatDay("2026-03-21", "en")).toMatch(/2026/);
    expect(formatClock("09:30", "fa")).toBe("۰۹:۳۰");
    expect(formatMoney(1500, "USD", "fa")).toMatch(/۱٬۵۰۰/);
    expect(formatMoney(null, "USD", "fa")).toBeNull();
    expect(formatDay(null, "fa")).toBeNull();
  });
});

describe("pre-invoice payment terms source", () => {
  it("falls back to full payment now when no payment policy applies, exactly like checkout's engine", async () => {
    const [{ policies }] = await sql<{ policies: number }[]>`select count(*)::int as policies from commercial.booking_payment_policies where is_active`;
    const [row] = await sql<{ id: string }[]>`
      select id::text from booking.booking_drafts
      where total_amount > 0 and coalesce(payment_method, '') <> 'pay_on_delivery'
      order by updated_at desc limit 1`;
    if (!row || policies > 0) return;
    const invoice = (await getBookingDraftPreInvoice(row.id, "fa-IR"))!;
    expect(invoice.paymentTermsSource).toBe("default");
    expect(invoice.collectionMode).toBe("full");
    expect(invoice.dueNowAmount).toBe(invoice.totalAmount);
    expect(invoice.remainingAmount).toBe(0);
  });
});

describe("draft service name", () => {
  it("falls back to the service definition name when the provider service has no display name", async () => {
    const { getBookingDrafts } = await import("./repository");
    const [row] = await sql<{ id: string }[]>`
      select d.id::text from booking.booking_drafts d
      join category.provider_services ps on ps.id = d.service_id
      join category.service_definitions sd on sd.id = ps.service_definition_id
      where coalesce(ps.display_name_translations, '{}'::jsonb) = '{}'::jsonb
      order by d.updated_at desc limit 1`;
    if (!row) return;
    const listed = (await getBookingDrafts("fa")).find((item) => item.id === row.id);
    expect(listed?.serviceName).toBeTruthy();
    const invoice = await getBookingDraftPreInvoice(row.id, "fa");
    expect(invoice!.serviceName).toBeTruthy();
    expect(invoice!.lines.find((line) => line.kind === "main")?.name).toBe(invoice!.serviceName);
  });
});
