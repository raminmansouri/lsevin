import "server-only";
import { BOOKING_ATTENTION_THRESHOLD_MINUTES, BOOKING_MARKET_WINDOW_DAYS, type ProviderBookingResponsePulse } from "./marketTypes";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import { normalizeOptionSearchLimit, normalizeOptionSearchQuery } from "@core/lib/optionSearch";

export type ModuleRecord = {
  id: string;
  status?: string | null;
  type?: string | null;
  createdAt?: string | null;
};


export type BookingDocumentItem = { id:string; bookingId:string; title:string; fileName:string; fileUrl:string; mimeType:string|null; sizeBytes:number|null; createdAt:string };
export type BookingOperationItem = {
  bookingId: string;
  serviceProviderId: string | null;
  serviceId: string | null;
  specialistId: string | null;
  customerId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  bookingStatus: string;
  paymentStatus: string | null;
  totalAmount: string | null;
  currencyCode: string | null;
  assignedStaffId: string | null;
  assignedResourceId: string | null;
  assignmentStatus: string | null;
  providerNotesCount: number;
  createdAt: string;
};

export type BookingAssignmentInput = {
  bookingId: string;
  providerId: string;
  staffId?: string;
  resourceId?: string;
  note?: string;
  assignedByUserId: string;
};

export async function getModuleSummary(providerId?: string) {
  const [records, bookings] = await Promise.all([listRecentRecords(providerId), listBookings({ providerId, limit: 100 })]);
  return {
    recordCount: records.length,
    providerId: providerId ?? null,
    upcomingCount: bookings.filter((booking) => booking.bookingStatus !== "Completed" && booking.bookingStatus !== "Cancelled").length,
    assignedCount: bookings.filter((booking) => Boolean(booking.assignedStaffId || booking.assignedResourceId)).length,
    unpaidCount: bookings.filter((booking) => booking.paymentStatus && !["Paid", "paid", "captured", "succeeded"].includes(booking.paymentStatus)).length,
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      return sql<ModuleRecord[]>`
        select id::text as id, new_status as status, 'status_change' as type, created_at::text as "createdAt"
        from booking_management.booking_status_changes
        where service_provider_id = ${providerId}::uuid
        order by created_at desc
        limit 10
      `;
    }
    return sql<ModuleRecord[]>`
      select id::text as id, new_status as status, 'status_change' as type, created_at::text as "createdAt"
      from booking_management.booking_status_changes
      order by created_at desc
      limit 10
    `;
  } catch {
    return [];
  }
}

export async function listBookings(input: { providerId?: string; staffId?: string; limit?: number } = {}): Promise<BookingOperationItem[]> {
  const limit = input.limit ?? 50;
  try {
    if (input.staffId) {
      return sql<BookingOperationItem[]>`
        select ${bookingSelectFragment()}
        from booking.bookings b
        left join lateral (
          select ba.staff_id, ba.resource_id, ba.assignment_status
          from booking_management.booking_assignments ba
          where ba.booking_id = b.id and ba.staff_id = ${input.staffId}::uuid and ba.assignment_status <> 'cancelled'
          order by ba.created_at desc
          limit 1
        ) ba on true
        left join lateral (
          select count(*)::int as notes_count from booking_management.provider_booking_notes n where n.booking_id = b.id
        ) notes on true
        where ba.staff_id = ${input.staffId}::uuid
        order by b.create_date desc
        limit ${limit}
      `;
    }

    if (input.providerId) {
      return sql<BookingOperationItem[]>`
        select ${bookingSelectFragment()}
        from booking.bookings b
        left join lateral (
          select ba.staff_id, ba.resource_id, ba.assignment_status
          from booking_management.booking_assignments ba
          where ba.booking_id = b.id and ba.service_provider_id = ${input.providerId}::uuid and ba.assignment_status <> 'cancelled'
          order by ba.created_at desc
          limit 1
        ) ba on true
        left join lateral (
          select count(*)::int as notes_count from booking_management.provider_booking_notes n where n.booking_id = b.id
        ) notes on true
        where b.provider_id = ${input.providerId}::uuid
        order by b.create_date desc
        limit ${limit}
      `;
    }

    return sql<BookingOperationItem[]>`
      select ${bookingSelectFragment()}
      from booking.bookings b
      left join lateral (
        select ba.staff_id, ba.resource_id, ba.assignment_status
        from booking_management.booking_assignments ba
        where ba.booking_id = b.id and ba.assignment_status <> 'cancelled'
        order by ba.created_at desc
        limit 1
      ) ba on true
      left join lateral (
        select count(*)::int as notes_count from booking_management.provider_booking_notes n where n.booking_id = b.id
      ) notes on true
      order by b.create_date desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

function bookingSelectFragment() {
  return sql`
    b.id::text as "bookingId",
    b.provider_id::text as "serviceProviderId",
    b.service_id::text as "serviceId",
    b.specialist_id::text as "specialistId",
    b.user_id::text as "customerId",
    b.selected_date::text as "selectedDate",
    b.selected_time::text as "selectedTime",
    b.booking_status as "bookingStatus",
    b.payment_status as "paymentStatus",
    b.total_amount::text as "totalAmount",
    coalesce(b.currency_code, b.payment_currency_code, b.display_currency_code, b.source_currency_code, 'IRR') as "currencyCode",
    ba.staff_id::text as "assignedStaffId",
    ba.resource_id::text as "assignedResourceId",
    ba.assignment_status as "assignmentStatus",
    coalesce(notes.notes_count, 0)::int as "providerNotesCount",
    b.create_date::text as "createdAt"
  `;
}

export async function assignBooking(input: BookingAssignmentInput) {
  await sql.begin(async (tx) => {
    await tx`
      update booking_management.booking_assignments
      set assignment_status = 'reassigned', updated_at = now()
      where booking_id = ${input.bookingId}::uuid
        and service_provider_id = ${input.providerId}::uuid
        and assignment_status = 'assigned'
    `;
    await tx`
      insert into booking_management.booking_assignments (booking_id, service_provider_id, staff_id, resource_id, assignment_status, note, assigned_by_user_id, metadata)
      values (${input.bookingId}::uuid, ${input.providerId}::uuid, nullif(${input.staffId || ""}, '')::uuid, nullif(${input.resourceId || ""}, '')::uuid, 'assigned', nullif(${input.note || ""}, ''), ${input.assignedByUserId}::uuid, '{}'::jsonb)
    `;
  });
}

export async function updateBookingStatus(input: { bookingId: string; providerId: string; newStatus: string; note?: string; changedByUserId: string }) {
  const currentRows = await sql<{ bookingStatus: string }[]>`
    select booking_status as "bookingStatus" from booking.bookings where id = ${input.bookingId}::uuid and provider_id = ${input.providerId}::uuid limit 1
  `;
  const oldStatus = currentRows[0]?.bookingStatus ?? null;
  const allowedStatuses = new Set(["Confirmed", "InProgress", "Completed", "Cancelled", "NoShow", "ProviderReview"]);
  if (!allowedStatuses.has(input.newStatus)) throw new Error("Invalid provider booking status transition.");
  await sql.begin(async (tx) => {
    await tx`
      update booking.bookings
      set booking_status = ${input.newStatus}, provider_updated_at = now(), provider_notes = nullif(${input.note || ""}, ''), last_modified_date = now()
      where id = ${input.bookingId}::uuid and provider_id = ${input.providerId}::uuid
    `;
    await tx`
      insert into booking_management.booking_status_changes(booking_id, service_provider_id, old_status, new_status, changed_by_user_id, note)
      values (${input.bookingId}::uuid, ${input.providerId}::uuid, ${oldStatus}, ${input.newStatus}, ${input.changedByUserId}::uuid, nullif(${input.note || ""}, ''))
    `;
  });
}

export async function addBookingNote(input: { bookingId: string; providerId: string; staffId?: string; note: string; visibility: string; createdByUserId: string }) {
  if (!input.note.trim()) throw new Error("Booking note cannot be empty.");
  await sql`
    insert into booking_management.provider_booking_notes(booking_id, service_provider_id, staff_id, note, visibility, created_by_user_id)
    values (${input.bookingId}::uuid, ${input.providerId}::uuid, nullif(${input.staffId || ""}, '')::uuid, ${input.note}, ${input.visibility === "customer_visible" ? "customer_visible" : "internal"}, ${input.createdByUserId}::uuid)
  `;
}


export async function listBookingDocuments(input:{providerId:string;staffId?:string;bookingId?:string;limit?:number}) {
  const staffId=input.staffId?.trim()||""; const bookingId=input.bookingId?.trim()||""; const limit=Math.min(100,Math.max(1,Math.trunc(input.limit||50)));
  return sql<BookingDocumentItem[]>`
    select d.id::text as id,d.booking_id::text as "bookingId",d.title,d.file_name as "fileName",d.file_url as "fileUrl",d.mime_type as "mimeType",d.size_bytes::int as "sizeBytes",d.created_at::text as "createdAt"
    from booking.booking_documents d join booking.bookings b on b.id=d.booking_id
    where b.provider_id=${input.providerId}::uuid
      and (${bookingId}='' or d.booking_id=${bookingId}::uuid)
      and (${staffId}='' or exists(select 1 from booking_management.booking_assignments ba where ba.booking_id=d.booking_id and ba.service_provider_id=${input.providerId}::uuid and ba.staff_id=${staffId}::uuid and ba.assignment_status='assigned'))
    order by d.created_at desc limit ${limit}`;
}

export async function getBookingDocument(input:{providerId:string;staffId?:string;documentId:string}) {
  const staffId=input.staffId?.trim()||"";
  const rows=await sql<BookingDocumentItem[]>`
    select d.id::text as id,d.booking_id::text as "bookingId",d.title,d.file_name as "fileName",d.file_url as "fileUrl",d.mime_type as "mimeType",d.size_bytes::int as "sizeBytes",d.created_at::text as "createdAt"
    from booking.booking_documents d join booking.bookings b on b.id=d.booking_id
    where d.id=${input.documentId}::uuid and b.provider_id=${input.providerId}::uuid
      and (${staffId}='' or exists(select 1 from booking_management.booking_assignments ba where ba.booking_id=d.booking_id and ba.service_provider_id=${input.providerId}::uuid and ba.staff_id=${staffId}::uuid and ba.assignment_status='assigned'))
    limit 1`;
  return rows[0]??null;
}

export async function searchProviderBookingOptions(input:{providerId:string;query?:string;selected?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const limit=normalizeOptionSearchLimit(input.limit,30,60);
  return sql<{value:string;label:string;description:string|null}[]>`
    select b.id::text as value,concat_ws(' · ',coalesce(b.selected_date::text,'—'),coalesce(b.selected_time::text,''),left(b.id::text,8),b.booking_status) as label,
      nullif(trim(concat_ws(' · ',nullif(trim(concat_ws(' ',u.first_name,u.last_name)),''),u.email)),'') as description
    from booking.bookings b left join identity.asp_net_users u on u.id=b.user_id
    where b.provider_id=${input.providerId}::uuid and (${query}='' or b.id::text ilike '%'||${query}||'%' or coalesce(b.confirmation_code,'') ilike '%'||${query}||'%' or coalesce(u.email,'') ilike '%'||${query}||'%')
    order by case when b.id::text=${selected} then 0 else 1 end,b.create_date desc limit ${limit}`;
}

export async function searchStaffBookingOptions(input:{providerId:string;staffId:string;query?:string;selected?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const limit=normalizeOptionSearchLimit(input.limit,30,60);
  return sql<{value:string;label:string;description:string|null}[]>`
    select b.id::text as value,concat_ws(' · ',coalesce(b.selected_date::text,'—'),coalesce(b.selected_time::text,''),left(b.id::text,8),b.booking_status) as label,
      nullif(trim(concat_ws(' · ',nullif(trim(concat_ws(' ',u.first_name,u.last_name)),''),u.email)),'') as description
    from booking_management.booking_assignments ba join booking.bookings b on b.id=ba.booking_id left join identity.asp_net_users u on u.id=b.user_id
    where ba.service_provider_id=${input.providerId}::uuid and ba.staff_id=${input.staffId}::uuid and ba.assignment_status='assigned'
      and (${query}='' or b.id::text ilike '%'||${query}||'%' or coalesce(b.confirmation_code,'') ilike '%'||${query}||'%' or coalesce(u.email,'') ilike '%'||${query}||'%')
    order by case when b.id::text=${selected} then 0 else 1 end,b.create_date desc limit ${limit}`;
}

export async function searchBookingStaffOptions(input:{providerId:string;query?:string;selected?:string;locale?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const locale=input.locale||"fa-IR"; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select st.id::text as value,coalesce(${translationSql(sql`st.name_translations`,locale)},st.id::text) as label,
      nullif(trim(concat_ws(' · ',${translationSql(sql`st.title_translations`,locale)},st.specialty)),'') as description
    from category.provider_staffs ps join category.staff st on st.id=ps.staff_id and st.is_active=true
    where ps.service_provider_id=${input.providerId}::uuid and ps.is_active=true and (${query}='' or st.id::text ilike '%'||${query}||'%' or coalesce(st.specialty,'') ilike '%'||${query}||'%' or exists(select 1 from jsonb_each_text(coalesce(st.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when st.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}

export async function searchBookingResourceOptions(input:{providerId:string;query?:string;selected?:string;locale?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const locale=input.locale||"fa-IR"; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select r.id::text as value,coalesce(${translationSql(sql`r.name_translations`,locale)},r.code,r.id::text) as label,
      nullif(trim(concat_ws(' · ',r.resource_type,r.code,'capacity '||r.total_capacity::text)),'') as description
    from provider_portal.bookable_resources r where r.service_provider_id=${input.providerId}::uuid and r.is_active=true
      and (${query}='' or r.id::text ilike '%'||${query}||'%' or coalesce(r.code,'') ilike '%'||${query}||'%' or exists(select 1 from jsonb_each_text(coalesce(r.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when r.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}


type BookingPulseSummaryRow = {
  bookings30d: number;
  providerTouched30d: number;
  completed30d: number;
  cancelledOrNoShow30d: number;
  averageResponseProxyMinutes: number | null;
  awaitingProviderAction: number;
  overdueProviderAttention: number;
};

export async function getProviderBookingResponsePulse(providerId: string, queueLimit = 6): Promise<ProviderBookingResponsePulse> {
  const limit = Math.min(12, Math.max(1, Math.trunc(queueLimit || 6)));
  const summaryRows = await sql<BookingPulseSummaryRow[]>`
    select
      count(*) filter (where b.create_date >= now() - interval '30 days')::int as "bookings30d",
      count(*) filter (where b.create_date >= now() - interval '30 days' and b.provider_updated_at is not null)::int as "providerTouched30d",
      count(*) filter (where b.create_date >= now() - interval '30 days' and lower(coalesce(b.booking_status, '')) = 'completed')::int as "completed30d",
      count(*) filter (where b.create_date >= now() - interval '30 days' and lower(coalesce(b.booking_status, '')) in ('cancelled','noshow'))::int as "cancelledOrNoShow30d",
      round(avg(extract(epoch from (b.provider_updated_at - b.create_date)) / 60.0) filter (where b.create_date >= now() - interval '30 days' and b.provider_updated_at is not null and b.provider_updated_at >= b.create_date))::int as "averageResponseProxyMinutes",
      count(*) filter (where b.provider_updated_at is null and lower(coalesce(b.booking_status, '')) not in ('completed','cancelled','noshow'))::int as "awaitingProviderAction",
      count(*) filter (where b.provider_updated_at is null and lower(coalesce(b.booking_status, '')) not in ('completed','cancelled','noshow') and b.create_date <= now() - interval '120 minutes')::int as "overdueProviderAttention"
    from booking.bookings b
    where b.provider_id = ${providerId}::uuid
  `;
  const attentionQueue = await sql<{ bookingId: string; confirmationCode: string | null; bookingStatus: string; paymentStatus: string | null; createdAt: string; selectedDate: string | null; selectedTime: string | null; ageMinutes: number }[]>`
    select
      b.id::text as "bookingId",
      b.confirmation_code as "confirmationCode",
      coalesce(b.booking_status, '') as "bookingStatus",
      b.payment_status as "paymentStatus",
      b.create_date::text as "createdAt",
      b.selected_date::text as "selectedDate",
      b.selected_time::text as "selectedTime",
      greatest(0, floor(extract(epoch from (now() - b.create_date)) / 60))::int as "ageMinutes"
    from booking.bookings b
    where b.provider_id = ${providerId}::uuid
      and b.provider_updated_at is null
      and lower(coalesce(b.booking_status, '')) not in ('completed','cancelled','noshow')
    order by b.create_date asc
    limit ${limit}
  `;
  const summary = summaryRows[0] ?? { bookings30d: 0, providerTouched30d: 0, completed30d: 0, cancelledOrNoShow30d: 0, averageResponseProxyMinutes: null, awaitingProviderAction: 0, overdueProviderAttention: 0 };
  const responseCoveragePercent = summary.bookings30d > 0 ? Math.max(0, Math.min(100, Math.round((summary.providerTouched30d / summary.bookings30d) * 100))) : 0;
  return {
    windowDays: BOOKING_MARKET_WINDOW_DAYS,
    attentionThresholdMinutes: BOOKING_ATTENTION_THRESHOLD_MINUTES,
    ...summary,
    responseCoveragePercent,
    attentionQueue,
  };
}
