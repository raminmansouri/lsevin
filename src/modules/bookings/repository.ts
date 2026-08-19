import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import type { ProviderBooking } from "./types";

export async function listProviderBookings(providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ProviderBooking[]>`
    select
      b.id::text,
      b.user_id::text as "userId",
      ${translationSql(sql`ps.display_name_translations`, locale)} as "serviceName",
      b.selected_date::text as "selectedDate",
      b.selected_time::text as "selectedTime",
      b.booking_status as "bookingStatus",
      b.payment_status as "paymentStatus",
      b.total_amount::text as "totalAmount",
      coalesce(b.currency_code, b.payment_currency_code, b.display_currency_code) as "currencyCode",
      b.provider_notes as "providerNotes",
      b.create_date::text as "createdAt"
    from booking.bookings b
    join category.provider_services ps on ps.id = b.service_id
    where b.provider_id = ${providerId}::uuid
    order by b.create_date desc
    limit 100
  `;
}

export async function updateBookingByProvider(input: { providerId: string; bookingId: string; bookingStatus: string; providerNotes: string }) {
  await sql`
    update booking.bookings set booking_status = ${input.bookingStatus}, provider_notes = ${input.providerNotes}, provider_updated_at = now(), last_modified_date = now()
    where id = ${input.bookingId}::uuid and provider_id = ${input.providerId}::uuid
  `;
}

export type BookingInvoiceSource = {
  id: string;
  providerId: string;
  userId: string | null;
  serviceName: string;
  totalAmount: string | null;
  currencyCode: string | null;
};

export async function getBookingForInvoice(providerId: string, bookingId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  const rows = await sql<BookingInvoiceSource[]>`
    select
      b.id::text,
      b.provider_id::text as "providerId",
      b.user_id::text as "userId",
      ${translationSql(sql`ps.display_name_translations`, locale)} as "serviceName",
      b.total_amount::text as "totalAmount",
      coalesce(b.currency_code, b.payment_currency_code, b.display_currency_code, 'IRR') as "currencyCode"
    from booking.bookings b
    join category.provider_services ps on ps.id = b.service_id
    where b.id = ${bookingId}::uuid and b.provider_id = ${providerId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function markBookingInvoiceIssued(providerId: string, bookingId: string, invoiceId: string, invoiceNumber: string) {
  await sql`
    update booking.bookings
    set metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ paymentBilling: { invoiceId, invoiceNumber } })}::jsonb,
        last_modified_date = now()
    where id = ${bookingId}::uuid and provider_id = ${providerId}::uuid
  `;
}
