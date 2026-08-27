import "server-only";

import sql from "@/config/database/db";
import { formatDate } from "@/lib/formatters";
import type {
  Booking,
  BookingAddonSummary,
  BookingDocumentSummary,
  BookingRecord,
  BookingsResponse,
  BookingChildSummary,
  IncludedServicesType,
} from "@/features/service-providers/types";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type GetMyBookingsInput = {
  userId: string;
  locale?: string | null;
};

export type GetMyBookingByIdInput = GetMyBookingsInput & {
  bookingId: string;
};

export type CancelMyBookingInput = {
  userId: string;
  bookingId: string;
  reason?: string | null;
};

type BookingListRow = {
  id: string;
  service: string;
  provider: string;
  image: string | null;
  date: string;
  time: string;
  location: string;
  status: string;
  paymentStatus: string;
  price: number | string | null;
  currency: string | null;
  verified: boolean | null;
  selectedDate: string | null;
  createDate: string | null;
  groupName: "upcoming" | "past" | "cancelled";
};

type BookingDetailRow = BookingListRow & {
  providerImage: string | null;
  serviceImage: string | null;
  providerDescription: string | null;
  serviceDescription: string | null;
  duration: string | null;
  fullAddress: string | null;
  deposit: number | string | null;
  remaining: number | string | null;
  bookingDate: string | null;
  confirmationCode: string | null;
  paymentMethod: string | null;
  notes: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  agentName: string | null;
  agentTitle: string | null;
  agentExperience: string | null;
  agentImage: string | null;
  included: unknown;
  addons: unknown;
  documents: unknown;
  childBookings: unknown;
};

function isUuid(value?: string | null): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

function normalizeLocale(locale?: string | null): string {
  const raw = String(locale || "fa-IR").trim().replace("_", "-");
  const map: Record<string, string> = {
    en: "en-US",
    fa: "fa-IR",
    ar: "ar-SA",
    tr: "tr-TR",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    ku: "ku-KU",
    ru: "ru-RU",
    tg: "tg-TJ",
    zh: "zh-CN",
  };

  return map[raw.toLowerCase()] || raw || "fa-IR";
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value.filter(Boolean) as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed.filter(Boolean) as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// row.date/row.bookingDate arrive as raw ISO date text from SQL (see the "date"/
// "bookingDate" select below) -- formatted here via Intl through the caller's resolved
// locale so fa-IR renders the Jalali calendar with Persian month names and digits,
// instead of a Postgres to_char() month abbreviation ("Aug") that can never localize.
function formatBookingDate(raw: string | null | undefined, locale: string, fallback: string) {
  if (!raw) return fallback;
  return formatDate(raw, locale, { year: "numeric", month: "short", day: "2-digit" });
}

function toBooking(row: BookingListRow, locale: string): Booking {
  return {
    id: row.id,
    service: row.service || "Service",
    provider: row.provider || "Provider",
    image: row.image || undefined,
    date: formatBookingDate(row.date, locale, "Flexible date"),
    time: row.time || "Flexible time",
    location: row.location || "Location not specified",
    status: row.status || "pending",
    paymentStatus: row.paymentStatus || "pending",
    price: toNumber(row.price),
    currency: row.currency || "USD",
    verified: Boolean(row.verified),
  };
}

function toBookingRecord(row: BookingDetailRow, locale: string): BookingRecord {
  const image = row.serviceImage || row.providerImage || row.image || undefined;
  const providerImage = row.providerImage || row.serviceImage || row.image || undefined;

  return {
    ...toBooking({ ...row, image: image ?? null }, locale),
    providerImage,
    providerDescription: row.providerDescription || undefined,
    serviceDescription: row.serviceDescription || undefined,
    duration: row.duration || undefined,
    fullAddress: row.fullAddress || undefined,
    deposit: toNumber(row.deposit),
    remaining: toNumber(row.remaining),
    bookingDate: row.bookingDate ? formatBookingDate(row.bookingDate, locale, "") : undefined,
    confirmationCode: row.confirmationCode || undefined,
    paymentMethod: row.paymentMethod || undefined,
    notes: row.notes || undefined,
    included: toArray<IncludedServicesType>(row.included),
    addons: toArray<BookingAddonSummary>(row.addons),
    documents: toArray<BookingDocumentSummary>(row.documents),
    childBookings: toArray<BookingChildSummary>(row.childBookings),
    contact: {
      phone: row.contactPhone || "",
      email: row.contactEmail || "",
      address: row.fullAddress || undefined,
    },
    agent: row.agentName
      ? {
          name: row.agentName,
          title: row.agentTitle || "Specialist",
          experience: row.agentExperience || "",
          image: row.agentImage || undefined,
        }
      : undefined,
  };
}

export async function getMyBookingsFromDb(input: GetMyBookingsInput): Promise<BookingsResponse> {
  if (!isUuid(input.userId)) {
    return { upcomingBookings: [], pastBookings: [], cancelledBookings: [] };
  }

  const locale = normalizeLocale(input.locale);

  const rows = await sql<BookingListRow[]>`
    with latest_payment as (
      select distinct on (p.booking_id)
        p.booking_id,
        p.status,
        p.amount,
        p.currency,
        p.updated_at,
        p.created_at
      from booking.payments p
      order by p.booking_id, p.updated_at desc nulls last, p.created_at desc
    ), booking_base as (
      select
        b.id::text as id,
        coalesce(
          nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US'), ''),
          nullif(common.get_translation_t(sd.name_translations, ${locale}, 'en-US'), ''),
          'Service'
        ) as service,
        coalesce(nullif(common.get_translation_t(sp.name_translations, ${locale}, 'en-US'), ''), 'Provider') as provider,
        coalesce(nullif(ps.image_url, ''), nullif(sp.image_url, '')) as image,
        b.selected_date::text as date,
        case
          when b.selected_time_from is not null and b.selected_time_to is not null then concat(to_char(b.selected_time_from, 'HH24:MI'), ' - ', to_char(b.selected_time_to, 'HH24:MI'))
          when b.selected_time is not null then to_char(b.selected_time, 'HH24:MI')
          else 'Flexible time'
        end as time,
        coalesce(nullif(concat_ws(', ', nullif(sp.city, ''), nullif(sp.country, '')), ''), 'Location not specified') as location,
        lower(coalesce(nullif(b.booking_status, ''), 'pending')) as status,
        case
          when lower(coalesce(nullif(b.payment_status, ''), nullif(lp.status, ''), '')) in ('paid', 'captured', 'succeeded', 'completed') then 'paid'
          when lower(coalesce(nullif(b.payment_status, ''), nullif(lp.status, ''), '')) in ('refunded', 'partially_refunded') then 'refunded'
          when coalesce(b.paid_amount, 0) >= coalesce(b.display_total_amount, b.total_amount, b.source_total_amount, 0) and coalesce(b.display_total_amount, b.total_amount, b.source_total_amount, 0) > 0 then 'paid'
          else 'pending'
        end as "paymentStatus",
        coalesce(b.display_total_amount, b.total_amount, b.source_total_amount, ps.value, 0)::text as price,
        upper(coalesce(nullif(b.display_currency_code, ''), nullif(b.currency_code, ''), nullif(b.payment_currency_code, ''), nullif(ps.currency, ''), 'USD')) as currency,
        coalesce(sp.accredited, false) as verified,
        b.selected_date::text as "selectedDate",
        b.create_date::text as "createDate",
        case
          when lower(coalesce(b.booking_status, '')) in ('cancelled', 'canceled') then 'cancelled'
          when lower(coalesce(b.booking_status, '')) in ('completed', 'done') then 'past'
          when b.selected_date is not null and b.selected_date < current_date then 'past'
          else 'upcoming'
        end as "groupName"
      from booking.bookings b
      join category.service_providers sp on sp.id = b.provider_id
      join category.provider_services ps on ps.id = b.service_id
      left join category.service_definitions sd on sd.id = ps.service_definition_id
      left join latest_payment lp on lp.booking_id = b.id
      where b.user_id = ${input.userId}::uuid
    )
    select *
    from booking_base
    order by
      case "groupName" when 'upcoming' then 1 when 'past' then 2 else 3 end,
      coalesce("selectedDate"::date, "createDate"::date, current_date) desc,
      id desc
  `;

  return rows.reduce<BookingsResponse>(
    (acc, row) => {
      const booking = toBooking(row, locale);
      if (row.groupName === "cancelled") acc.cancelledBookings.push(booking);
      else if (row.groupName === "past") acc.pastBookings.push(booking);
      else acc.upcomingBookings.push(booking);
      return acc;
    },
    { upcomingBookings: [], pastBookings: [], cancelledBookings: [] }
  );
}

export async function getMyBookingByIdFromDb(input: GetMyBookingByIdInput): Promise<BookingRecord | null> {
  if (!isUuid(input.userId) || !isUuid(input.bookingId)) return null;

  const locale = normalizeLocale(input.locale);

  const rows = await sql<BookingDetailRow[]>`
    with latest_payment as (
      select distinct on (p.booking_id)
        p.booking_id,
        p.status,
        p.amount,
        p.currency,
        p.payment_method,
        p.updated_at,
        p.created_at
      from booking.payments p
      where p.booking_id = ${input.bookingId}::uuid
      order by p.booking_id, p.updated_at desc nulls last, p.created_at desc
    ), base as (
      select
        b.*,
        sp.name_translations as provider_name_translations,
        sp.description_translations as provider_description_translations,
        sp.image_url as provider_image_url,
        sp.city as provider_city,
        sp.country as provider_country,
        sp.street_translations as provider_street_translations,
        sp.detail_translations as provider_detail_translations,
        sp.zip_code as provider_zip_code,
        sp.email as provider_email,
        sp.phone_number_country_code as provider_phone_country_code,
        sp.phone_number as provider_phone_number,
        sp.accredited as provider_accredited,
        ps.display_name_translations as service_name_translations,
        ps.description_translations as service_description_translations,
        ps.image_url as service_image_url,
        ps.duration_minutes,
        ps.value as provider_service_value,
        ps.currency as provider_service_currency,
        sd.name_translations as definition_name_translations,
        sd.description_translations as definition_description_translations,
        st.name_translations as specialist_name_translations,
        st.title_translations as specialist_title_translations,
        st.profile_image_url as specialist_image_url,
        st.experience as specialist_experience,
        lp.status as latest_payment_status,
        lp.payment_method as latest_payment_method
      from booking.bookings b
      join category.service_providers sp on sp.id = b.provider_id
      join category.provider_services ps on ps.id = b.service_id
      left join category.service_definitions sd on sd.id = ps.service_definition_id
      left join category.staff st on st.id = b.specialist_id
      left join latest_payment lp on lp.booking_id = b.id
      where b.id = ${input.bookingId}::uuid
        and b.user_id = ${input.userId}::uuid
      limit 1
    )
    select
      base.id::text as id,
      coalesce(
        nullif(common.get_translation_t(base.service_name_translations, ${locale}, 'en-US'), ''),
        nullif(common.get_translation_t(base.definition_name_translations, ${locale}, 'en-US'), ''),
        'Service'
      ) as service,
      coalesce(nullif(common.get_translation_t(base.provider_name_translations, ${locale}, 'en-US'), ''), 'Provider') as provider,
      coalesce(nullif(base.service_image_url, ''), nullif(base.provider_image_url, '')) as image,
      nullif(base.provider_image_url, '') as "providerImage",
      nullif(base.service_image_url, '') as "serviceImage",
      coalesce(
        nullif(common.get_translation_t(base.provider_description_translations, ${locale}, 'en-US'), ''),
        null
      ) as "providerDescription",
      coalesce(
        nullif(common.get_translation_t(base.service_description_translations, ${locale}, 'en-US'), ''),
        nullif(common.get_translation_t(base.definition_description_translations, ${locale}, 'en-US'), ''),
        null
      ) as "serviceDescription",
      base.selected_date::text as date,
      case
        when base.selected_time_from is not null and base.selected_time_to is not null then concat(to_char(base.selected_time_from, 'HH24:MI'), ' - ', to_char(base.selected_time_to, 'HH24:MI'))
        when base.selected_time is not null then to_char(base.selected_time, 'HH24:MI')
        else 'Flexible time'
      end as time,
      case
        when coalesce(base.duration_minutes, 0) <= 0 then null
        when base.duration_minutes < 60 then concat(base.duration_minutes::text, ' min')
        when base.duration_minutes % 60 = 0 then concat((base.duration_minutes / 60)::text, ' hour', case when base.duration_minutes = 60 then '' else 's' end)
        else concat(base.duration_minutes::text, ' min')
      end as duration,
      coalesce(nullif(concat_ws(', ', nullif(base.provider_city, ''), nullif(base.provider_country, '')), ''), 'Location not specified') as location,
      nullif(
        concat_ws(', ',
          nullif(common.get_translation_t(base.provider_street_translations, ${locale}, 'en-US'), ''),
          nullif(common.get_translation_t(base.provider_detail_translations, ${locale}, 'en-US'), ''),
          nullif(base.provider_city, ''),
          nullif(base.provider_country, ''),
          nullif(base.provider_zip_code, '')
        ),
        ''
      ) as "fullAddress",
      lower(coalesce(nullif(base.booking_status, ''), 'pending')) as status,
      case
        when lower(coalesce(nullif(base.payment_status, ''), nullif(base.latest_payment_status, ''), '')) in ('paid', 'captured', 'succeeded', 'completed') then 'paid'
        when lower(coalesce(nullif(base.payment_status, ''), nullif(base.latest_payment_status, ''), '')) in ('refunded', 'partially_refunded') then 'refunded'
        when coalesce(base.paid_amount, 0) >= coalesce(base.display_total_amount, base.total_amount, base.source_total_amount, 0) and coalesce(base.display_total_amount, base.total_amount, base.source_total_amount, 0) > 0 then 'paid'
        else 'pending'
      end as "paymentStatus",
      coalesce(base.display_total_amount, base.total_amount, base.source_total_amount, base.provider_service_value, 0)::text as price,
      coalesce(base.paid_amount, 0)::text as deposit,
      greatest(coalesce(base.display_total_amount, base.total_amount, base.source_total_amount, base.provider_service_value, 0) - coalesce(base.paid_amount, 0), 0)::text as remaining,
      upper(coalesce(nullif(base.display_currency_code, ''), nullif(base.currency_code, ''), nullif(base.payment_currency_code, ''), nullif(base.provider_service_currency, ''), 'USD')) as currency,
      coalesce(base.provider_accredited, false) as verified,
      base.create_date::text as "createDate",
      base.selected_date::text as "selectedDate",
      base.create_date::text as "bookingDate",
      base.confirmation_code as "confirmationCode",
      coalesce(nullif(base.payment_method, ''), nullif(base.latest_payment_method, '')) as "paymentMethod",
      coalesce(
        nullif(base.metadata ->> 'notes', ''),
        nullif(base.metadata ->> 'note', ''),
        nullif(base.metadata ->> 'customer_notes', ''),
        nullif(base.metadata ->> 'customerNote', ''),
        nullif(base.metadata ->> 'special_requests', ''),
        null
      ) as notes,
      concat_ws(' ', nullif(base.provider_phone_country_code, ''), nullif(base.provider_phone_number, '')) as "contactPhone",
      base.provider_email as "contactEmail",
      nullif(common.get_translation_t(base.specialist_name_translations, ${locale}, 'en-US'), '') as "agentName",
      nullif(common.get_translation_t(base.specialist_title_translations, ${locale}, 'en-US'), '') as "agentTitle",
      base.specialist_experience as "agentExperience",
      base.specialist_image_url as "agentImage",
      coalesce((
        select jsonb_agg(jsonb_build_object('name', si.item, 'title', si.item, 'experience', '') order by si.id)
        from category.service_included si
        where si.service_id = base.service_id
      ), '[]'::jsonb) as included,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', ba.id::text,
          'name', coalesce(a.name, ba.addon_id),
          'quantity', ba.quantity,
          'unitPrice', ba.unit_price,
          'currency', coalesce(nullif(ba.currency_code, ''), upper(coalesce(base.display_currency_code, base.currency_code, 'USD'))),
          'kind', ba.addon_kind
        ) order by ba.created_at)
        from booking.booking_addons ba
        left join category.addons a on a.id = ba.addon_id
        where ba.booking_id = base.id
      ), '[]'::jsonb) as addons,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', bd.id::text,
          'title', bd.title,
          'fileName', bd.file_name,
          'fileUrl', bd.file_url,
          'mimeType', bd.mime_type,
          'sizeBytes', bd.size_bytes
        ) order by bd.created_at desc)
        from booking.booking_documents bd
        where bd.booking_id = base.id
      ), '[]'::jsonb) as documents,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', cb.id::text,
          'status', cb.status,
          'provider', coalesce(nullif(common.get_translation_t(csp.name_translations, ${locale}, 'en-US'), ''), 'Provider'),
          'service', coalesce(nullif(common.get_translation_t(cps.display_name_translations, ${locale}, 'en-US'), ''), nullif(common.get_translation_t(csd.name_translations, ${locale}, 'en-US'), ''), 'Service'),
          'date', coalesce(to_char(cb.selected_date, 'Mon DD, YYYY'), to_char(cb.selected_date_from, 'Mon DD, YYYY'), 'Flexible date'),
          'time', case
            when cb.selected_time_from is not null and cb.selected_time_to is not null then concat(to_char(cb.selected_time_from, 'HH24:MI'), ' - ', to_char(cb.selected_time_to, 'HH24:MI'))
            when cb.selected_time is not null then to_char(cb.selected_time, 'HH24:MI')
            else 'Flexible time'
          end,
          'subtotal', cb.subtotal_amount,
          'currency', cb.currency
        ) order by cb.create_date)
        from booking.booking_child_bookings cb
        left join category.service_providers csp on csp.id = cb.provider_id
        left join category.provider_services cps on cps.id = cb.service_id
        left join category.service_definitions csd on csd.id = cps.service_definition_id
        where cb.parent_booking_id = base.id
      ), '[]'::jsonb) as "childBookings",
      case
        when lower(coalesce(base.booking_status, '')) in ('cancelled', 'canceled') then 'cancelled'
        when lower(coalesce(base.booking_status, '')) in ('completed', 'done') then 'past'
        when base.selected_date is not null and base.selected_date < current_date then 'past'
        else 'upcoming'
      end as "groupName"
    from base
  `;

  return rows[0] ? toBookingRecord(rows[0], locale) : null;
}

export async function cancelMyBookingInDb(input: CancelMyBookingInput): Promise<boolean> {
  if (!isUuid(input.userId) || !isUuid(input.bookingId)) return false;

  const reason = String(input.reason || "").trim();

  const rows = await sql<{ id: string }[]>`
    update booking.bookings
       set booking_status = 'Cancelled',
           last_modified_date = now(),
           provider_updated_at = now(),
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'cancelledByUserId', ${input.userId},
             'cancelledAt', now(),
             'cancelReason', ${reason}
           )
     where id = ${input.bookingId}::uuid
       and user_id = ${input.userId}::uuid
       and lower(coalesce(booking_status, '')) not in ('cancelled', 'canceled', 'completed')
     returning id::text
  `;

  return rows.length > 0;
}
