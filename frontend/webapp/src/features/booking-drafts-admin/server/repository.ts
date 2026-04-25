import "server-only";
import { db } from "@/features/booking-admin-shared/server/db";

export async function getBookingDrafts(locale = 'en-US') {
  return db<any[]>`
    select
      d.id,
      d.status,
      d.current_step as "currentStep",
      d.payment_method as "paymentMethod",
      d.total_amount::text as "totalAmount",
      d.currency,
      d.updated_at as "updatedAt",
      common.get_translation_t(sp.name_translations, ${locale}, 'en-US') as "providerName",
      common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US') as "serviceName",
      common.get_translation_t(st.name_translations, ${locale}, 'en-US') as "specialistName",
      trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as "customerName"
    from booking.booking_drafts d
    left join category.service_providers sp on sp.id = d.provider_id
    left join category.provider_services ps on ps.id = d.service_id
    left join category.staff st on st.id = d.specialist_id
    left join identity.asp_net_users u on u.id = d.user_id
    order by d.updated_at desc
    limit 300
  `;
}

export async function getBookingDraftById(draftId: string, locale = 'en-US') {
  const rows = await db<any[]>`
    select
      d.*,
      common.get_translation_t(sp.name_translations, ${locale}, 'en-US') as "providerName",
      common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US') as "serviceName",
      common.get_translation_t(st.name_translations, ${locale}, 'en-US') as "specialistName",
      trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))) as "customerName",
      coalesce((select jsonb_agg(jsonb_build_object('addonId', a.addon_id, 'sourceType', a.source_type, 'addonKind', a.addon_kind, 'quantity', a.quantity, 'unitPrice', a.unit_price, 'config', a.config) order by a.created_at asc) from booking.booking_draft_addons a where a.draft_id = d.id), '[]'::jsonb) as "draftAddOns",
      coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'providerTypeId', x.provider_type_id, 'providerId', x.provider_id, 'serviceId', x.service_id, 'specialistId', x.specialist_id, 'selectedDate', x.selected_date, 'selectedDateFrom', x.selected_date_from, 'selectedDateTo', x.selected_date_to, 'selectedTime', x.selected_time, 'selectedTimeFrom', x.selected_time_from, 'selectedTimeTo', x.selected_time_to, 'adults', x.adults, 'children', x.children, 'infants', x.infants, 'rooms', x.rooms, 'bookingUiMode', x.booking_ui_mode, 'formSubmissionId', x.form_submission_id, 'subtotalAmount', x.subtotal_amount, 'currency', x.currency, 'status', x.status, 'metadata', x.metadata) order by x.create_date asc) from booking.booking_draft_child_bookings x where x.parent_draft_id = d.id), '[]'::jsonb) as "draftChildBookings",
      coalesce((select jsonb_agg(jsonb_build_object('id', doc.id, 'requirementId', doc.requirement_id, 'title', doc.title, 'fileName', doc.file_name, 'fileUrl', doc.file_url, 'mimeType', doc.mime_type, 'sizeBytes', doc.size_bytes) order by doc.created_at asc) from booking.booking_draft_documents doc where doc.draft_id = d.id), '[]'::jsonb) as "draftDocuments"
    from booking.booking_drafts d
    left join category.service_providers sp on sp.id = d.provider_id
    left join category.provider_services ps on ps.id = d.service_id
    left join category.staff st on st.id = d.specialist_id
    left join identity.asp_net_users u on u.id = d.user_id
    where d.id = ${draftId}
    limit 1
  `;
  return rows[0] ?? null;
}
