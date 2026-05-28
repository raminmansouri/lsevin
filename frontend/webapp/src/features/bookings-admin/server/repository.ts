import "server-only";
import { db } from "@/features/booking-admin-shared/server/db";
import type { BookingDetail, BookingListItem } from "../types";

export async function getBookings(locale = "fa-IR"): Promise<BookingListItem[]> {
  return db<BookingListItem[]>`
    select
      b.id,
      b.booking_status as "bookingStatus",
      b.payment_status as "paymentStatus",
      b.payment_method as "paymentMethod",
      b.selected_date::text as "selectedDate",
      b.selected_time::text as "selectedTime",
      b.total_amount::text as "totalAmount",
      b.currency_code as "currencyCode",
      common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as "providerName",
      common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as "serviceName",
      common.get_translation_t(st.name_translations, ${locale}, 'fa-IR') as "specialistName",
      trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as "customerName",
      u.email as "customerEmail",
      b.create_date as "createDate"
    from booking.bookings b
    left join category.service_providers sp on sp.id = b.provider_id
    left join category.provider_services ps on ps.id = b.service_id
    left join category.staff st on st.id = b.specialist_id
    left join identity.asp_net_users u on u.id = b.user_id
    order by b.create_date desc
    limit 300
  `;
}

export async function getBookingById(bookingId: string, locale = "fa-IR"): Promise<BookingDetail | null> {
  const rows = await db<any[]>`
    select
      b.id,
      b.provider_id as "providerId",
      b.service_id as "serviceId",
      b.specialist_id as "specialistId",
      b.user_id as "userId",
      b.booking_status as "bookingStatus",
      b.payment_status as "paymentStatus",
      b.payment_method as "paymentMethod",
      b.selected_date::text as "selectedDate",
      b.selected_time::text as "selectedTime",
      b.selected_time_from::text as "selectedTimeFrom",
      b.selected_time_to::text as "selectedTimeTo",
      b.selected_date_from::text as "selectedDateFrom",
      b.selected_date_to::text as "selectedDateTo",
      b.total_amount::text as "totalAmount",
      b.paid_amount::text as "paidAmount",
      b.currency_code as "currencyCode",
      b.provider_notes as "providerNotes",
      b.provider_updated_at::text as "providerUpdatedAt",
      b.booking_ui_mode as "bookingUiMode",
      b.form_submission_id::text as "formSubmissionId",
      b.adults,
      b.children,
      b.infants,
      b.rooms,
      b.metadata,
      common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as "providerName",
      common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as "serviceName",
      common.get_translation_t(st.name_translations, ${locale}, 'fa-IR') as "specialistName",
      trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as "customerName",
      u.email as "customerEmail",
      b.create_date as "createDate",
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', a.id,
          'addonId', a.addon_id,
          'sourceType', a.source_type,
          'addonKind', a.addon_kind,
          'quantity', a.quantity,
          'unitPrice', a.unit_price,
          'config', a.config
        ) order by a.created_at asc)
        from booking.booking_addons a
        where a.booking_id = b.id
      ), '[]'::jsonb) as "addOns",
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', d.id,
          'requirementId', d.requirement_id,
          'title', d.title,
          'fileName', d.file_name,
          'fileUrl', d.file_url,
          'mimeType', d.mime_type,
          'sizeBytes', d.size_bytes
        ) order by d.created_at asc)
        from booking.booking_documents d
        where d.booking_id = b.id
      ), '[]'::jsonb) as documents,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', p.id,
          'paymentMethod', p.payment_method,
          'gateway', p.gateway,
          'amount', p.amount,
          'currency', p.currency,
          'status', p.status,
          'externalReference', p.external_reference,
          'gatewayPayload', p.gateway_payload,
          'createdAt', p.created_at,
          'updatedAt', p.updated_at
        ) order by p.created_at desc)
        from booking.payments p
        where p.booking_id = b.id
      ), '[]'::jsonb) as payments,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', cb.id,
          'providerTypeId', cb.provider_type_id,
          'providerId', cb.provider_id,
          'serviceId', cb.service_id,
          'specialistId', cb.specialist_id,
          'selectedDate', cb.selected_date,
          'selectedDateFrom', cb.selected_date_from,
          'selectedDateTo', cb.selected_date_to,
          'selectedTime', cb.selected_time,
          'selectedTimeFrom', cb.selected_time_from,
          'selectedTimeTo', cb.selected_time_to,
          'adults', cb.adults,
          'children', cb.children,
          'infants', cb.infants,
          'rooms', cb.rooms,
          'bookingUiMode', cb.booking_ui_mode,
          'formSubmissionId', cb.form_submission_id,
          'subtotalAmount', cb.subtotal_amount,
          'currency', cb.currency,
          'status', cb.status,
          'metadata', cb.metadata,
          'providerName', common.get_translation_t(sp2.name_translations, ${locale}, 'fa-IR'),
          'serviceName', common.get_translation_t(ps2.display_name_translations, ${locale}, 'fa-IR'),
          'specialistName', common.get_translation_t(st2.name_translations, ${locale}, 'fa-IR'),
          'adminNote', coalesce(cb.metadata->>'adminNote', ''),
          'reviewedAt', cb.metadata->>'reviewedAt'
        ) order by cb.create_date asc)
        from booking.booking_child_bookings cb
        left join category.service_providers sp2 on sp2.id = cb.provider_id
        left join category.provider_services ps2 on ps2.id = cb.service_id
        left join category.staff st2 on st2.id = cb.specialist_id
        where cb.parent_booking_id = b.id
      ), '[]'::jsonb) as "childBookings"
    from booking.bookings b
    left join category.service_providers sp on sp.id = b.provider_id
    left join category.provider_services ps on ps.id = b.service_id
    left join category.staff st on st.id = b.specialist_id
    left join identity.asp_net_users u on u.id = b.user_id
    where b.id = ${bookingId}
    limit 1
  `;

  return rows[0] ?? null;
}
