
import 'server-only';

import db from '@/config/database/db';
import { pickTranslation } from '@/features/booking-pro/utils/translation';

export async function listAdminBookings(params: { locale?: string; search?: string; status?: string; take?: number; offset?: number }) {
  const locale = params.locale ?? 'en-US';
  const search = params.search ?? '';
  const like = `%${search}%`;
  const take = params.take ?? 20;
  const offset = params.offset ?? 0;

  const rows = await db`
    select b.id,
           b.booking_status,
           b.payment_status,
           b.payment_method,
           b.total_amount,
           b.currency_code,
           b.create_date,
           b.provider_notes,
           b.provider_updated_at,
           sp.name_translations as provider_name_translations,
           ps.display_name_translations as service_name_translations,
           s.name_translations as specialist_name_translations,
           (select count(*) from booking.booking_child_bookings cb where cb.parent_booking_id = b.id) as child_count
    from booking.bookings b
    left join category.service_providers sp on sp.id = b.provider_id
    left join category.provider_services ps on ps.id = b.service_id
    left join category.staff s on s.id = b.specialist_id
    where (
      ${search} = ''
      or common.get_translation_t(sp.name_translations, ${locale}, 'en') ilike ${like}
      or common.get_translation_t(ps.display_name_translations, ${locale}, 'en') ilike ${like}
      or common.get_translation_t(s.name_translations, ${locale}, 'en') ilike ${like}
      or coalesce(b.payment_reference, '') ilike ${like}
      or cast(b.id as text) ilike ${like}
    )
      and (${params.status ?? ''} = '' or coalesce(b.booking_status, '') = ${params.status ?? ''})
    order by b.create_date desc
    limit ${take} offset ${offset}
  `;

  return rows.map((row: any) => ({
    id: row.id,
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    totalAmount: Number(row.total_amount ?? 0),
    currencyCode: row.currency_code ?? 'USD',
    createDate: row.create_date,
    providerName: pickTranslation(row.provider_name_translations, locale),
    serviceName: pickTranslation(row.service_name_translations, locale),
    specialistName: pickTranslation(row.specialist_name_translations, locale),
    childCount: Number(row.child_count ?? 0),
    providerNotes: row.provider_notes,
    providerUpdatedAt: row.provider_updated_at,
  }));
}

export async function getAdminBookingDetail(
  bookingId: string,
  locale = "en-US"
) {
  const rows = await db`
    select b.*,
           sp.name_translations as provider_name_translations,
           ps.display_name_translations as service_name_translations,
           s.name_translations as specialist_name_translations,

           coalesce(
             (
               select jsonb_agg(
                 jsonb_build_object(
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
                   'providerNotes', cb.provider_notes,
                   'providerUpdatedAt', cb.provider_updated_at,
                   'providerName', common.get_translation_t(sp2.name_translations, ${locale}, 'en'),
                   'serviceName', common.get_translation_t(ps2.display_name_translations, ${locale}, 'en'),
                   'specialistName', common.get_translation_t(s2.name_translations, ${locale}, 'en')
                 )
                 order by cb.create_date asc
               )
               from booking.booking_child_bookings cb
               left join category.service_providers sp2 on sp2.id = cb.provider_id
               left join category.provider_services ps2 on ps2.id = cb.service_id
               left join category.staff s2 on s2.id = cb.specialist_id
               where cb.parent_booking_id = b.id
             ),
             '[]'::jsonb
           ) as child_bookings,

           coalesce(
             (
               select jsonb_agg(
                 jsonb_build_object(
                   'id', bd.id,
                   'title', bd.title,
                   'fileName', bd.file_name,
                   'fileUrl', bd.file_url,
                   'requirementId', bd.requirement_id,
                   'mimeType', bd.mime_type,
                   'sizeBytes', bd.size_bytes
                 )
                 order by bd.created_at asc
               )
               from booking.booking_documents bd
               where bd.booking_id = b.id
             ),
             '[]'::jsonb
           ) as documents,

           coalesce(
             (
               select jsonb_agg(
                 jsonb_build_object(
                   'id', p.id,
                   'paymentMethod', p.payment_method,
                   'gateway', p.gateway,
                   'amount', p.amount,
                   'currency', p.currency,
                   'status', p.status,
                   'externalReference', p.external_reference,
                   'createdAt', p.created_at,
                   'updatedAt', p.updated_at,
                   'gatewayPayload', p.gateway_payload
                 )
                 order by p.created_at desc
               )
               from booking.payments p
               where p.booking_id = b.id
             ),
             '[]'::jsonb
           ) as payments

    from booking.bookings b
    left join category.service_providers sp on sp.id = b.provider_id
    left join category.provider_services ps on ps.id = b.service_id
    left join category.staff s on s.id = b.specialist_id
    where b.id = ${bookingId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function reviewAdminBooking(input: {
  bookingId: string;
  bookingStatus: string;
  providerNotes?: string | null;
  childReviews?: Array<{ id: string; status: string; providerNotes?: string | null }>;
}) {
  await db.begin(async (tx) => {
    await tx`
      update booking.bookings
      set booking_status = ${input.bookingStatus},
          provider_notes = coalesce(${input.providerNotes ?? null}, provider_notes),
          provider_updated_at = now()
      where id = ${input.bookingId}
    `;

    for (const child of input.childReviews ?? []) {
      await tx`
        update booking.booking_child_bookings
        set status = ${child.status},
            provider_notes = coalesce(${child.providerNotes ?? null}, provider_notes),
            provider_updated_at = now()
        where id = ${child.id} and parent_booking_id = ${input.bookingId}
      `;
    }
  });

  return { ok: true };
}
