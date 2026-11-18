/** Renders the admin pre-invoice for a real local draft in fa/en/ar with the real message files. */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

import sql from "@/config/database/db";
import { getBookingDraftPreInvoice, type BookingDraftPreInvoice } from "../server/pre-invoice";
import { BookingDraftPreInvoiceView } from "./booking-draft-pre-invoice";

const messages = (locale: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../../messages/${locale}.json`), "utf8"));

function render(draft: BookingDraftPreInvoice, locale: string) {
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale,
      messages: messages(locale),
      timeZone: "UTC",
      children: createElement(BookingDraftPreInvoiceView, { draft }),
    }),
  );
}

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe("pre-invoice view", () => {
  it("renders a priced draft with the not-final marker, totals and print button in every locale", async () => {
    const [row] = await sql<{ id: string }[]>`
      select id::text from booking.booking_drafts where total_amount > 0 and service_id is not null order by updated_at desc limit 1`;
    if (!row) return;
    const draft = (await getBookingDraftPreInvoice(row.id, "fa-IR"))!;

    const fa = render(draft, "fa");
    expect(fa).toContain("این فاکتور نهایی نیست");
    expect(fa).toContain("پیش‌فاکتور");
    expect(fa).toContain('data-testid="pre-invoice-print"');
    expect(fa).toContain('data-testid="pre-invoice-line-main"');
    expect(fa).not.toMatch(/BookingDraftsAdmin\./);

    expect(render(draft, "en")).toContain("not a final invoice");
    expect(render(draft, "ar")).toContain("ليست فاتورة نهائية");
  });

  it("shows a dash for every missing field instead of breaking", () => {
    const empty: BookingDraftPreInvoice = {
      id: "00000000-0000-4000-8000-000000000000",
      status: null, currentStep: null, createdAt: null, updatedAt: null, submittedAt: null,
      customer: { name: null, phone: null, email: null },
      providerName: null, serviceName: null, specialistName: null, bookingUiMode: null,
      selectedDate: null, selectedDateFrom: null, selectedDateTo: null, selectedTime: null, selectedTimeFrom: null, selectedTimeTo: null,
      nights: null, adults: null, children: null, infants: null, rooms: null,
      paymentMethod: null, payInPlacePlan: null, notes: null, currency: "USD",
      lines: [], subtotalAmount: 0, addonsAmount: 0, grossAmount: 0, discount: null, surcharge: null,
      totalAmount: 0, dueNowAmount: null, remainingAmount: null,
      paymentTermsSource: "unavailable", collectionMode: null,
    };
    const html = render(empty, "fa");
    expect(html).toContain("—");
    expect(html).toContain("هنوز قلمی در این پیش‌نویس نیست");
    expect(html).not.toMatch(/BookingDraftsAdmin\./);

    // Regression: with no payment policy the engine collects 100% now. That must read as a
    // full payment, not as a deposit equal to the total with a remaining balance of 0.
    const full = render({ ...empty, totalAmount: 65_000_000, currency: "IRR", dueNowAmount: 65_000_000, remainingAmount: 0, paymentTermsSource: "default", collectionMode: "full" }, "fa");
    expect(full).toContain('data-testid="pre-invoice-full-payment"');
    expect(full).toContain("پرداخت کامل");
    expect(full).not.toContain("مانده");
    expect(full).toContain("هیچ سیاست پرداختی تعریف نشده");

    const split = render({ ...empty, totalAmount: 100, dueNowAmount: 21, remainingAmount: 79, paymentTermsSource: "payInPlace", collectionMode: "percent" }, "en");
    expect(split).not.toContain('data-testid="pre-invoice-full-payment"');
    expect(split).toContain("Remaining balance");
  });
});
