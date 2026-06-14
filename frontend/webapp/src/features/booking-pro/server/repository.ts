import 'server-only';
import { assertNoUndefinedRecord, pgNumber, pgString } from './checkout-null-safety';
import db from '@/config/database/db';
import { calculateBookingPaymentTerms, resolveBookingPaymentPolicy } from '@/features/commercial/lib/server/payment-policy-engine';
import { applyCommercialSnapshotAfterCheckout } from './commercial-integration';
import { assertDraftAvailabilityBeforeCheckout } from './booking-availability.repository';
import { pickTranslation } from '../utils/translation';
import type {
  BookingDraftState,
  BookingUiMode,
  ChildBookingDraft,
  ProviderCardItem,
  ProviderTypeAddonItem,
  ServiceCardItem,
  SpecialistCardItem,
  UploadRequirementItem,
} from '../types';

type Locale = string;

const SAFE_DRAFT_METADATA_KEYS = new Set([
  'formSubmissionId',
  'adults',
  'children',
  'infants',
  'rooms',
  'bookingUiMode',
  'requiresSpecialist',
  'selectedDateFrom',
  'selectedDateTo',
  'serviceDefinitionId',
  'couponCode',
  'appliedCouponCode',
  'appliedCouponId',
  'appliedCouponSource',
  'appliedDiscountType',
  'appliedDiscountValue',
  'appliedDiscountAmount',
  'couponTitle',
  'customerCouponId',
]);

function sanitizeDraftMetadataPatch(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!SAFE_DRAFT_METADATA_KEYS.has(key)) continue;
    if (raw === undefined) continue;

    if (typeof raw === 'string') {
      const normalized = raw.trim();
      if (!normalized || normalized.length > 500 || normalized.startsWith('data:')) continue;
      output[key] = normalized;
      continue;
    }

    if (typeof raw === 'number') {
      if (Number.isFinite(raw)) output[key] = raw;
      continue;
    }

    if (typeof raw === 'boolean' || raw === null) {
      output[key] = raw;
    }
  }

  return output;
}

function normalizeDraftDocumentRef(value: unknown) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  if (normalized.startsWith('data:')) {
    throw new Error('Draft documents must store only uploaded media ids or URLs, not inline file content. Please upload the file first and save its media URL/id.');
  }
  if (normalized.length > 2000) {
    throw new Error('Draft document reference is too long. Please upload the file first and save only the media URL/id.');
  }
  return normalized;
}

function compactDraftDocumentRef(value: unknown) {
  try {
    return normalizeDraftDocumentRef(value);
  } catch {
    return '';
  }
}

function normalizePaymentScheduleLineType(lineType: unknown): "deposit" | "balance" {
  const raw = String(lineType ?? "").trim().toLowerCase();
  if (["balance", "remaining", "remaining_balance", "due_later", "later", "final"].includes(raw)) {
    return "balance";
  }

  // Internal semantic type. We may persist a different DB-compatible value later,
  // after reading the actual check constraint installed in the current database.
  return "deposit";
}

function extractAllowedScheduleLineTypes(definition: string | null | undefined) {
  if (!definition || !/line_type/i.test(definition)) return [] as string[];
  const matches = Array.from(definition.matchAll(/'([^']+)'/g)).map((match) => match[1]);
  return Array.from(new Set(matches.map((value) => value.trim()).filter(Boolean)));
}

async function listAllowedScheduleLineTypes(tx: any) {
  const rows = await tx<any[]>`
    select pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    join pg_namespace n on n.oid = r.relnamespace
    where n.nspname = 'commercial'
      and r.relname = 'booking_payment_schedule_lines'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%line_type%'
  `;

  const allowed = rows.flatMap((row) => extractAllowedScheduleLineTypes(row.definition));
  return Array.from(new Set(allowed));
}

function choosePersistedScheduleLineType(semanticType: "deposit" | "balance", allowedTypes: string[]) {
  // If there is no check constraint, keep our canonical values.
  if (!allowedTypes.length) return semanticType;

  const normalizedAllowed = allowedTypes.map((value) => value.trim()).filter(Boolean);
  const allowedByLower = new Map(normalizedAllowed.map((value) => [value.toLowerCase(), value]));
  if (allowedByLower.has(semanticType)) return allowedByLower.get(semanticType)!;

  const dueNowCandidates = [
    "deposit",
    "due_now",
    "pay_now",
    "upfront",
    "advance",
    "booking_fee",
    "fixed",
    "fixed_fee",
    "percent",
    "full_payment",
    "payment",
    "installment",
  ];
  const balanceCandidates = [
    "balance",
    "due_later",
    "remaining",
    "remaining_balance",
    "final",
    "provider_balance",
    "installment",
    "payment",
  ];

  const candidates = semanticType === "balance" ? balanceCandidates : dueNowCandidates;
  const found = candidates.find((candidate) => allowedByLower.has(candidate));

  // If we cannot find a safe value, skip inserting the schedule row instead of
  // breaking checkout. booking_payment_terms still stores due_now/due_later amounts.
  return found ? allowedByLower.get(found)! : null;
}

type DraftCouponSnapshot = {
  source: "loyalty" | "marketing";
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  title?: string | null;
  customerCouponId?: string | null;
};

function normalizeDiscountType(value: unknown): "percent" | "fixed" {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["percent", "percentage", "%"].includes(raw)) return "percent";
  return "fixed";
}

function calculateCouponDiscount(type: "percent" | "fixed", value: number, grossAmount: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (type === "percent") return Math.min(grossAmount, Math.round((grossAmount * Math.min(safeValue, 100) / 100) * 100) / 100);
  return Math.min(grossAmount, Math.round(safeValue * 100) / 100);
}

async function resolveDraftCoupon(draftId: string, grossAmount: number): Promise<DraftCouponSnapshot | null> {
  const [draft] = await db<any[]>`
    select d.user_id, d.service_id, coalesce(d.metadata, '{}'::jsonb) as metadata
    from booking.booking_drafts d
    where d.id = ${draftId}
    limit 1
  `;

  const rawCode = String(
    draft?.metadata?.couponCode ??
    draft?.metadata?.appliedCouponCode ??
    draft?.metadata?.coupon_code ??
    ""
  ).trim();

  if (!rawCode || grossAmount <= 0 || !draft?.user_id) return null;

  const [loyalty] = await db<any[]>`
    select c.id,
           c.code,
           c.title,
           c.discount_type,
           c.discount_value,
           c.min_purchase,
           cc.id as customer_coupon_id,
           cc.status as customer_coupon_status
    from loyalty.coupons c
    left join loyalty.customer_coupons cc
      on cc.coupon_id = c.id
     and cc.customer_id = ${draft.user_id}
    where lower(c.code) = lower(${rawCode})
      and c.is_active = true
      and (c.starts_at is null or c.starts_at <= now())
      and (c.expires_at is null or c.expires_at >= now())
      and (c.provider_service_id is null or c.provider_service_id = ${draft.service_id})
      and coalesce(c.min_purchase, 0) <= ${grossAmount}
      and (cc.id is null or lower(cc.status) in ('available', 'issued'))
    order by case when cc.id is not null then 0 else 1 end, c.create_date desc
    limit 1
  `;

  if (loyalty) {
    const discountType = normalizeDiscountType(loyalty.discount_type);
    const discountValue = Number(loyalty.discount_value ?? 0);
    return {
      source: "loyalty",
      id: String(loyalty.id),
      code: String(loyalty.code),
      title: loyalty.title ?? null,
      discountType,
      discountValue,
      discountAmount: calculateCouponDiscount(discountType, discountValue, grossAmount),
      customerCouponId: loyalty.customer_coupon_id ? String(loyalty.customer_coupon_id) : null,
    };
  }

  const [marketing] = await db<any[]>`
    select id, code, title, discount_type, discount_value, currency_code, status
    from marketing.user_discount_coupons
    where customer_id = ${draft.user_id}
      and lower(code) = lower(${rawCode})
      and status in ('issued', 'reserved')
      and (expires_at is null or expires_at >= now())
    order by issued_at desc
    limit 1
  `;

  if (marketing) {
    const discountType = normalizeDiscountType(marketing.discount_type);
    const discountValue = Number(marketing.discount_value ?? 0);
    return {
      source: "marketing",
      id: String(marketing.id),
      code: String(marketing.code),
      title: marketing.title ?? null,
      discountType,
      discountValue,
      discountAmount: calculateCouponDiscount(discountType, discountValue, grossAmount),
      customerCouponId: null,
    };
  }

  return null;
}

function mapDraftRow(row: any): BookingDraftState {
  const metadata = sanitizeDraftMetadataPatch(row.metadata);
  const childBookings = Array.isArray(row.child_bookings)
    ? row.child_bookings.map((child: any) => ({
        ...child,
        metadata: sanitizeDraftMetadataPatch(child?.metadata),
      }))
    : [];
  const uploadFiles = Array.isArray(row.upload_files)
    ? row.upload_files
        .map((file: any) => ({
          ...file,
          fileUrl: compactDraftDocumentRef(file?.fileUrl ?? file?.file_url),
          mediaIds: compactDraftDocumentRef(file?.mediaIds ?? file?.fileUrl ?? file?.file_url),
        }))
        .filter((file: any) => file.fileUrl || file.mediaIds)
    : [];

  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    providerId: row.provider_id ?? undefined,
    serviceId: row.service_id ?? undefined,
    serviceDefinitionId: row.service_definition_id ?? undefined,
    specialistId: row.specialist_id ?? undefined,
    requiresSpecialist: row.requires_specialist ?? true,
    bookingUiMode: row.booking_ui_mode ?? 'default_slot',
    selectedDate: row.selected_date?.toISOString?.().slice(0, 10) ?? row.selected_date ?? undefined,
    selectedDateFrom: row.selected_date_from?.toISOString?.().slice(0, 10) ?? row.selected_date_from ?? undefined,
    selectedDateTo: row.selected_date_to?.toISOString?.().slice(0, 10) ?? row.selected_date_to ?? undefined,
    selectedTime: row.selected_time ?? undefined,
    selectedTimeFrom: row.selected_time_from ?? undefined,
    selectedTimeTo: row.selected_time_to ?? undefined,
    adults: row.adults ?? undefined,
    children: row.children ?? undefined,
    infants: row.infants ?? undefined,
    rooms: row.rooms ?? undefined,
    currentStep: row.current_step ?? 1,
    paymentMethod: row.payment_method ?? undefined,
    currency: row.currency ?? 'USD',
    subtotalAmount: Number(row.subtotal_amount ?? 0),
    addonsAmount: Number(row.addons_amount ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    useLsevin: row.use_lsevin ?? false,
    notes: row.notes ?? undefined,
    metadata,
    formSubmissionId: (row.form_submission_id ?? metadata.formSubmissionId) as string | undefined,
    childBookings,
    uploadFiles,
  };
}

export async function getOrCreateActiveDraft(userId: string): Promise<BookingDraftState> {
  const rows = await db`
    with current_draft as (
      select d.*,
             ps.service_definition_id,
             sd.requires_specialist,
             sd.booking_ui_mode,
             coalesce((
               select jsonb_agg(jsonb_build_object(
                 'id', c.id,
                 'providerTypeId', c.provider_type_id,
                 'providerId', c.provider_id,
                 'serviceId', c.service_id,
                 'specialistId', c.specialist_id,
                 'bookingUiMode', c.booking_ui_mode,
                 'selectedDate', c.selected_date,
                 'selectedDateFrom', c.selected_date_from,
                 'selectedDateTo', c.selected_date_to,
                 'selectedTime', c.selected_time,
                 'selectedTimeFrom', c.selected_time_from,
                 'selectedTimeTo', c.selected_time_to,
                 'adults', c.adults,
                 'children', c.children,
                 'infants', c.infants,
                 'rooms', c.rooms,
                 'formSubmissionId', c.form_submission_id,
                 'subtotalAmount', c.subtotal_amount,
                 'currency', c.currency,
                 'metadata', c.metadata,
                 'status', c.status
               ) order by c.create_date asc)
               from booking.booking_draft_child_bookings c
               where c.parent_draft_id = d.id
             ), '[]'::jsonb) as child_bookings,
             coalesce((
               select jsonb_agg(jsonb_build_object(
                 'id', bd.id,
                 'requirementId', bd.requirement_id,
                 'title', bd.title,
                 'fileUrl', bd.file_url,
                 'fileName', bd.file_name
               ) order by bd.created_at asc)
               from booking.booking_draft_documents bd
               where bd.draft_id = d.id
             ), '[]'::jsonb) as upload_files
      from booking.booking_drafts d
      left join category.provider_services ps on ps.id = d.service_id
      left join category.service_definitions sd on sd.id = ps.service_definition_id
      where d.user_id = ${userId}
        and d.status in ('Draft', 'InProgress')
      order by d.updated_at desc
      limit 1
    )
    select * from current_draft
  `;

  if (rows.length) {
    return mapDraftRow(rows[0]);
  }

  const inserted = await db`
    insert into booking.booking_drafts (user_id, current_step, status, currency)
    values (${userId}, 1, 'Draft', 'USD')
    returning *
  `;

  return mapDraftRow(inserted[0]);
}

export async function getActiveDraft(userId: string): Promise<BookingDraftState | null> {
  const rows = await db`
    select d.*,
           ps.service_definition_id,
           sd.requires_specialist,
           sd.booking_ui_mode,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', c.id,
               'providerTypeId', c.provider_type_id,
               'providerId', c.provider_id,
               'serviceId', c.service_id,
               'specialistId', c.specialist_id,
               'bookingUiMode', c.booking_ui_mode,
               'selectedDate', c.selected_date,
               'selectedDateFrom', c.selected_date_from,
               'selectedDateTo', c.selected_date_to,
               'selectedTime', c.selected_time,
               'selectedTimeFrom', c.selected_time_from,
               'selectedTimeTo', c.selected_time_to,
               'adults', c.adults,
               'children', c.children,
               'infants', c.infants,
               'rooms', c.rooms,
               'formSubmissionId', c.form_submission_id,
               'subtotalAmount', c.subtotal_amount,
               'currency', c.currency,
               'metadata', c.metadata,
               'status', c.status
             ) order by c.create_date asc)
             from booking.booking_draft_child_bookings c
             where c.parent_draft_id = d.id
           ), '[]'::jsonb) as child_bookings,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', bd.id,
               'requirementId', bd.requirement_id,
               'title', bd.title,
               'fileUrl', bd.file_url,
               'fileName', bd.file_name
             ) order by bd.created_at asc)
             from booking.booking_draft_documents bd
             where bd.draft_id = d.id
           ), '[]'::jsonb) as upload_files
    from booking.booking_drafts d
    left join category.provider_services ps on ps.id = d.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where d.user_id = ${userId}
      and d.status in ('Draft', 'InProgress')
    order by d.updated_at desc
    limit 1
  `;

  return rows.length ? mapDraftRow(rows[0]) : null;
}

export async function abandonActiveDraft(userId: string): Promise<void> {
  await db`
    update booking.booking_drafts
    set status = 'Cancelled'
    where user_id = ${userId} and status in ('Draft', 'InProgress')
  `;
}

function isTimeString(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function hasInput<T extends object>(input: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export async function upsertMainDraftSelection(
  userId: string,
  input: Partial<BookingDraftState>
) {
  const draft = await getOrCreateActiveDraft(userId);

  const metadataPatch = sanitizeDraftMetadataPatch({
    formSubmissionId: hasInput(input, 'formSubmissionId') ? input.formSubmissionId ?? null : undefined,
    adults: input.adults ?? undefined,
    children: input.children ?? undefined,
    infants: input.infants ?? undefined,
    rooms: input.rooms ?? undefined,
    bookingUiMode: input.bookingUiMode ?? undefined,
    requiresSpecialist: input.requiresSpecialist ?? undefined,

    // keep date-range style values here for now because main draft schema
    // does not currently support date typed selected_date_from/to
    selectedDateFrom: hasInput(input, 'selectedDateFrom')
      ? (isDateString(input.selectedDateFrom) ? input.selectedDateFrom : null)
      : undefined,
    selectedDateTo: hasInput(input, 'selectedDateTo')
      ? (isDateString(input.selectedDateTo) ? input.selectedDateTo : null)
      : undefined,
    serviceDefinitionId: hasInput(input, 'serviceDefinitionId') ? input.serviceDefinitionId ?? null : undefined,
  });

  await db`
    update booking.booking_drafts
    set provider_id = case when ${hasInput(input, 'providerId')} then ${input.providerId ?? null} else provider_id end,
        service_id = case when ${hasInput(input, 'serviceId')} then ${input.serviceId ?? null} else service_id end,
        specialist_id = case when ${hasInput(input, 'specialistId')} then ${input.specialistId ?? null} else specialist_id end,
        selected_date = case when ${hasInput(input, 'selectedDate')} then ${isDateString(input.selectedDate) ? input.selectedDate : null} else selected_date end,
        selected_time = case when ${hasInput(input, 'selectedTime')} then ${isTimeString(input.selectedTime) ? input.selectedTime : null} else selected_time end,

        -- these columns are TIME in your latest schema
        selected_date_from = case when ${hasInput(input, 'selectedDateFrom')} then ${isTimeString(input.selectedDateFrom) ? input.selectedDateFrom : null} else selected_date_from end,
        selected_date_to = case when ${hasInput(input, 'selectedDateTo')} then ${isTimeString(input.selectedDateTo) ? input.selectedDateTo : null} else selected_date_to end,

        selected_time_from = case when ${hasInput(input, 'selectedTimeFrom')} then ${isTimeString(input.selectedTimeFrom) ? input.selectedTimeFrom : null} else selected_time_from end,
        selected_time_to = case when ${hasInput(input, 'selectedTimeTo')} then ${isTimeString(input.selectedTimeTo) ? input.selectedTimeTo : null} else selected_time_to end,

        use_lsevin = case when ${hasInput(input, 'useLsevin')} then coalesce(${input.useLsevin ?? null}, false) else use_lsevin end,
        current_step = case when ${hasInput(input, 'currentStep')} then coalesce(${input.currentStep ?? null}, current_step) else current_step end,
        payment_method = case when ${hasInput(input, 'paymentMethod')} then ${input.paymentMethod ?? null} else payment_method end,
        currency = case when ${hasInput(input, 'currency')} then coalesce(${input.currency ?? null}, currency) else currency end,
        subtotal_amount = case when ${hasInput(input, 'subtotalAmount')} then coalesce(${input.subtotalAmount ?? null}, 0) else subtotal_amount end,
        addons_amount = case when ${hasInput(input, 'addonsAmount')} then coalesce(${input.addonsAmount ?? null}, 0) else addons_amount end,
        total_amount = case when ${hasInput(input, 'totalAmount')} then coalesce(${input.totalAmount ?? null}, 0) else total_amount end,
        notes = case when ${hasInput(input, 'notes')} then ${input.notes ?? null} else notes end,
        metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify(metadataPatch)}::jsonb
    where id = ${draft.id}
  `;

  const safeClientMetadataPatch = sanitizeDraftMetadataPatch(input.metadata);
  if (Object.keys(safeClientMetadataPatch).length > 0) {
    await db`
      update booking.booking_drafts
      set metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify(safeClientMetadataPatch)}::jsonb
      where id = ${draft.id}
    `;
  }

  return await getOrCreateActiveDraft(userId);
}

export async function saveDraftDocuments(userId: string, draftId: string, documents: BookingDraftState['uploadFiles']) {
  await db.begin(async (tx) => {
    await tx`delete from booking.booking_draft_documents where draft_id = ${draftId}`;
    for (const doc of documents) {
      await tx`
        insert into booking.booking_draft_documents (
          draft_id, requirement_id, title, file_name, file_url
        ) values (
          ${draftId},
          ${doc.requirementId ?? null},
          ${String(doc.title ?? 'Document').slice(0, 250)},
          ${normalizeDraftDocumentRef((doc as any).fileName ?? (doc as any).mediaIds ?? doc.fileUrl ?? '')},
          ${normalizeDraftDocumentRef((doc as any).fileUrl ?? (doc as any).mediaIds ?? '')}
        )
      `;
    }
    await tx`update booking.booking_drafts set status = 'InProgress' where id = ${draftId} and user_id = ${userId}`;
  });
}

export async function saveChildDraft(userId: string, draftId: string, child: ChildBookingDraft) {
  const active = await getOrCreateActiveDraft(userId);
  if (active.id !== draftId) {
    throw new Error('Draft mismatch');
  }

  const rows = await db`
    with service_meta as (
      select ps.id,
             ps.service_definition_id,
             ps.currency,
             ps.value,
             sd.requires_specialist,
             sd.booking_ui_mode
      from category.provider_services ps
      join category.service_definitions sd on sd.id = ps.service_definition_id
      where ps.id = ${child.serviceId ?? null}
      limit 1
    )
    insert into booking.booking_draft_child_bookings (
      parent_draft_id,
      provider_type_id,
      provider_id,
      service_id,
      specialist_id,
      selected_date,
      selected_date_from,
      selected_date_to,
      selected_time,
      selected_time_from,
      selected_time_to,
      adults,
      children,
      infants,
      rooms,
      booking_ui_mode,
      form_submission_id,
      subtotal_amount,
      currency,
      metadata,
      status
    ) values (
      ${draftId},
      ${child.providerTypeId},
      ${child.providerId ?? null},
      ${child.serviceId ?? null},
      ${child.specialistId ?? null},
      ${child.selectedDate ?? null},
      ${child.selectedDateFrom ?? null},
      ${child.selectedDateTo ?? null},
      ${child.selectedTime ?? null},
      ${child.selectedTimeFrom ?? null},
      ${child.selectedTimeTo ?? null},
      ${child.adults ?? null},
      ${child.children ?? null},
      ${child.infants ?? null},
      ${child.rooms ?? null},
      coalesce(${child.bookingUiMode ?? null}, (select booking_ui_mode from service_meta), 'default_slot'),
      ${child.formSubmissionId ?? null},
      coalesce(${child.subtotalAmount ?? null}, (select value from service_meta), 0),
      coalesce(${child.currency ?? null}, (select currency from service_meta), 'USD'),
      ${sanitizeDraftMetadataPatch(child.metadata) as any},
      'Completed'
    )
    on conflict (parent_draft_id, provider_type_id)
    do update set
      provider_id = excluded.provider_id,
      service_id = excluded.service_id,
      specialist_id = excluded.specialist_id,
      selected_date = excluded.selected_date,
      selected_date_from = excluded.selected_date_from,
      selected_date_to = excluded.selected_date_to,
      selected_time = excluded.selected_time,
      selected_time_from = excluded.selected_time_from,
      selected_time_to = excluded.selected_time_to,
      adults = excluded.adults,
      children = excluded.children,
      infants = excluded.infants,
      rooms = excluded.rooms,
      booking_ui_mode = excluded.booking_ui_mode,
      form_submission_id = excluded.form_submission_id,
      subtotal_amount = excluded.subtotal_amount,
      currency = excluded.currency,
      metadata = excluded.metadata,
      status = excluded.status
    returning id
  `;

  return rows[0];
}

function normalizeCatalogSearch(search?: string) {
  return String(search || '')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function listProviders(params: { locale?: Locale; search?: string; providerTypeId?: string; providerId?: string; serviceId?: string; specialistId?: string; take?: number; offset?: number; }) {
  const { locale = 'fa-IR', search = '', providerTypeId, providerId, serviceId, specialistId, take = 3, offset = 0 } = params;
  const searchText = normalizeCatalogSearch(search);
  const normalizedSearchText = searchText.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
  const like = `%${searchText}%`;
  const normalizedLike = `%${normalizedSearchText}%`;
  const rows = await db`
    with providers as (
      select sp.id,
             sp.provider_type_id,
             common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
             common.get_translation_t(sp.description_translations, ${locale}, 'fa-IR') as provider_description,
             coalesce(
               nullif(sp.image_url, ''),
               (
                 select nullif(pgi.url, '')
                 from category.provider_gallery_items pgi
                 where pgi.service_provider_id = sp.id
                 order by pgi.display_order asc, pgi.create_date desc
                 limit 1
               )
             ) as image_url,
             sp.city,
             sp.country,
             sp.rating,
             sp.review_count,
             sp.featured_score,
             sp.is_sponsored,
             sp.specialties,
             sp.response_time,
             sp.success_rate,
             sp.total_patients,
             sp.name_translations,
             sp.description_translations,
             sp.email,
             sp.phone_number,
             concat_ws(' ',
               common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR'),
               common.get_translation_t(sp.description_translations, ${locale}, 'fa-IR'),
               sp.name_translations::text,
               sp.description_translations::text,
               sp.city,
               sp.country,
               sp.email,
               sp.phone_number
             ) as search_blob,
             regexp_replace(
               replace(replace(replace(replace(concat_ws(' ',
                 common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR'),
                 common.get_translation_t(sp.description_translations, ${locale}, 'fa-IR'),
                 sp.name_translations::text,
                 sp.description_translations::text,
                 sp.city,
                 sp.country,
                 sp.email,
                 sp.phone_number
               ), 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک'), chr(8204), ' '),
               '\\s+',
               ' ',
               'g'
             ) as normalized_search_blob
      from category.service_providers sp
      where sp.is_active = true
        and (${providerId ?? null}::uuid is null or sp.id = ${providerId ?? null}::uuid)
        and (${providerTypeId ?? null}::uuid is null or sp.provider_type_id = ${providerTypeId ?? null}::uuid)
        and (
          ${serviceId ?? null}::uuid is null
          or exists (
            select 1
            from category.provider_services fps
            where fps.id = ${serviceId ?? null}::uuid
              and fps.service_provider_id = sp.id
              and fps.is_active = true
          )
        )
        and (
          ${specialistId ?? null}::uuid is null
          or exists (
            select 1
            from category.provider_staffs fpst
            where fpst.service_provider_id = sp.id
              and fpst.staff_id = ${specialistId ?? null}::uuid
              and fpst.is_active = true
          )
        )
    )
    select id,
           provider_type_id,
           provider_name,
           provider_description,
           image_url,
           city,
           country,
           rating,
           review_count,
           featured_score,
           is_sponsored,
           specialties,
           response_time,
           success_rate,
           total_patients
    from providers p
    where (
      ${searchText}::text = ''
      or p.provider_name ilike ${like}
      or p.provider_description ilike ${like}
      or replace(replace(replace(p.provider_name, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      or replace(replace(replace(p.provider_description, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      or coalesce(p.city, '') ilike ${like}
      or coalesce(p.country, '') ilike ${like}
      or coalesce(p.email, '') ilike ${like}
      or coalesce(p.phone_number, '') ilike ${like}
      or exists (
        select 1
        from jsonb_each_text(coalesce(p.name_translations, '{}'::jsonb)) tr
        where tr.value ilike ${like}
           or replace(replace(replace(tr.value, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      )
      or exists (
        select 1
        from jsonb_each_text(coalesce(p.description_translations, '{}'::jsonb)) tr
        where tr.value ilike ${like}
           or replace(replace(replace(tr.value, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      )
      or (
        ${normalizedSearchText}::text <> ''
        and not exists (
          select 1
          from unnest(regexp_split_to_array(${normalizedSearchText}::text, '\\s+')) as term
          where nullif(btrim(term), '') is not null
            and p.normalized_search_blob not ilike ('%' || term || '%')
        )
      )
    )
    order by
      case
        when ${searchText}::text = '' then 10
        when p.provider_name ilike ${like} then 0
        when replace(replace(replace(p.provider_name, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike} then 1
        when coalesce(p.city, '') ilike ${like} or coalesce(p.country, '') ilike ${like} then 2
        else 5
      end,
      p.featured_score desc nulls last,
      p.rating desc nulls last,
      p.review_count desc nulls last
    limit ${take} offset ${offset}
  `;

  const items: ProviderCardItem[] = rows.map((row: any) => ({
    id: row.id,
    providerTypeId: row.provider_type_id,
    name: row.provider_name || '',
    description: row.provider_description || '',
    imageUrl: row.image_url,
    city: row.city,
    country: row.country,
    rating: row.rating,
    reviewCount: row.review_count,
    featuredScore: row.featured_score,
    isSponsored: row.is_sponsored,
    specialties: row.specialties,
    responseTime: row.response_time,
    successRate: row.success_rate,
    totalPatients: row.total_patients,
  }));

  return { items, hasMore: items.length === take };
}

export async function listServices(params: { providerId?: string; serviceId?: string; specialistId?: string; locale?: Locale; search?: string; take?: number; offset?: number; }) {
  const { providerId, serviceId, specialistId, locale = 'fa-IR', search = '', take = 3, offset = 0 } = params;
  const searchText = normalizeCatalogSearch(search);
  const normalizedSearchText = searchText.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
  const like = `%${searchText}%`;
  const normalizedLike = `%${normalizedSearchText}%`;
  const rows = await db`
    with services as (
      select ps.id,
             ps.service_provider_id,
             ps.service_definition_id,
             coalesce(
               nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
               nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''),
               ''
             ) as service_name,
             coalesce(
               nullif(common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR'), ''),
               nullif(common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR'), ''),
               ''
             ) as service_description,
             ps.display_name_translations,
             ps.description_translations,
             sd.name_translations as service_definition_name_translations,
             sd.description_translations as service_definition_description_translations,
             coalesce(
               nullif(ps.image_url, ''),
               nullif(sd.image_url, ''),
               (
                 select nullif(psgi.url, '')
                 from category.provider_service_gallery_items psgi
                 where psgi.provider_service_id = ps.id
                 order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date desc
                 limit 1
               )
             ) as image_url,
             ps.currency,
             ps.value,
             ps.duration_minutes,
             ps.slot_interval_minutes,
             ps.rating,
             ps.review_count,
             ps.recovery,
             ps.success_rate,
             ps.satisfaction,
             ps.growth,
             ps.is_popular,
             sd.requires_specialist,
             sd.booking_ui_mode,
             concat_ws(' ',
               common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'),
               common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR'),
               common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'),
               common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR'),
               ps.display_name_translations::text,
               ps.description_translations::text,
               sd.name_translations::text,
               sd.description_translations::text
             ) as search_blob,
             regexp_replace(
               replace(replace(replace(replace(concat_ws(' ',
                 common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'),
                 common.get_translation_t(ps.description_translations, ${locale}, 'fa-IR'),
                 common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'),
                 common.get_translation_t(sd.description_translations, ${locale}, 'fa-IR'),
                 ps.display_name_translations::text,
                 ps.description_translations::text,
                 sd.name_translations::text,
                 sd.description_translations::text
               ), 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک'), chr(8204), ' '),
               '\\s+',
               ' ',
               'g'
             ) as normalized_search_blob
      from category.provider_services ps
      join category.service_definitions sd on sd.id = ps.service_definition_id
      where ps.is_active = true
        and (${providerId ?? null}::uuid is null or ps.service_provider_id = ${providerId ?? null}::uuid)
        and (${serviceId ?? null}::uuid is null or ps.id = ${serviceId ?? null}::uuid)
        and (
          ${specialistId ?? null}::uuid is null
          or exists (
            select 1
            from category.provider_staffs pst
            join category.staff_services ss on ss.staff_id = pst.staff_id
              and ss.service_definition_id = ps.service_definition_id
              and ss.is_active = true
            where pst.service_provider_id = ps.service_provider_id
              and pst.staff_id = ${specialistId ?? null}::uuid
              and pst.is_active = true
          )
        )
    )
    select id,
           service_provider_id,
           service_definition_id,
           service_name,
           service_description,
           image_url,
           currency,
           value,
           duration_minutes,
           slot_interval_minutes,
           rating,
           review_count,
           recovery,
           success_rate,
           satisfaction,
           growth,
           is_popular,
           requires_specialist,
           booking_ui_mode
    from services s
    where (
      ${searchText}::text = ''
      or s.service_name ilike ${like}
      or s.service_description ilike ${like}
      or replace(replace(replace(s.service_name, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      or replace(replace(replace(s.service_description, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      or exists (
        select 1
        from jsonb_each_text(coalesce(s.display_name_translations, '{}'::jsonb) || coalesce(s.service_definition_name_translations, '{}'::jsonb)) tr
        where tr.value ilike ${like}
           or replace(replace(replace(tr.value, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      )
      or exists (
        select 1
        from jsonb_each_text(coalesce(s.description_translations, '{}'::jsonb) || coalesce(s.service_definition_description_translations, '{}'::jsonb)) tr
        where tr.value ilike ${like}
           or replace(replace(replace(tr.value, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      )
      or (
        ${normalizedSearchText}::text <> ''
        and not exists (
          select 1
          from unnest(regexp_split_to_array(${normalizedSearchText}::text, '\\s+')) as term
          where nullif(btrim(term), '') is not null
            and s.normalized_search_blob not ilike ('%' || term || '%')
        )
      )
    )
    order by
      case
        when ${searchText}::text = '' then 10
        when s.service_name ilike ${like} then 0
        when replace(replace(replace(s.service_name, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike} then 1
        else 5
      end,
      s.is_popular desc nulls last,
      s.rating desc nulls last,
      s.review_count desc nulls last
    limit ${take} offset ${offset}
  `;

  const items: ServiceCardItem[] = rows.map((row: any) => ({
    id: row.id,
    serviceDefinitionId: row.service_definition_id,
    name: row.service_name || '',
    description: row.service_description || '',
    imageUrl: row.image_url,
    currency: row.currency,
    value: Number(row.value ?? 0),
    durationMinutes: row.duration_minutes,
    slotIntervalMinutes: row.slot_interval_minutes,
    rating: row.rating,
    reviewCount: row.review_count,
    recovery: row.recovery,
    successRate: row.success_rate,
    satisfaction: row.satisfaction,
    growth: row.growth,
    isPopular: row.is_popular,
    requiresSpecialist: row.requires_specialist,
    bookingUiMode: row.booking_ui_mode,
  }));

  return { items, hasMore: items.length === take };
}

export async function listSpecialists(params: { providerId?: string; serviceId?: string; specialistId?: string; locale?: Locale; search?: string; take?: number; offset?: number; }) {
  const { providerId, serviceId, specialistId, locale = 'fa-IR', search = '', take = 3, offset = 0 } = params;
  const searchText = normalizeCatalogSearch(search);
  const normalizedSearchText = searchText.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
  const like = `%${searchText}%`;
  const normalizedLike = `%${normalizedSearchText}%`;
  const rows = await db`
    with specialists as (
      select s.id,
             common.get_translation_t(s.name_translations, ${locale}, 'fa-IR') as specialist_name,
             common.get_translation_t(s.title_translations, ${locale}, 'fa-IR') as specialist_title,
             s.name_translations,
             s.title_translations,
             s.specialty,
             coalesce(
               nullif(s.profile_image_url, ''),
               (
                 select nullif(sgi.url, '')
                 from category.staff_gallery_items sgi
                 where sgi.staff_id = s.id
                 order by sgi.is_primary desc, sgi.display_order asc, sgi.create_date desc
                 limit 1
               )
             ) as profile_image_url,
             s.rating,
             s.review_count,
             s.experience,
             s.patients,
             s.next_available_label,
             s.success_rate,
             concat_ws(' ',
               common.get_translation_t(s.name_translations, ${locale}, 'fa-IR'),
               common.get_translation_t(s.title_translations, ${locale}, 'fa-IR'),
               s.name_translations::text,
               s.title_translations::text,
               s.specialty,
               s.experience,
               s.next_available_label
             ) as search_blob,
             regexp_replace(
               replace(replace(replace(replace(concat_ws(' ',
                 common.get_translation_t(s.name_translations, ${locale}, 'fa-IR'),
                 common.get_translation_t(s.title_translations, ${locale}, 'fa-IR'),
                 s.name_translations::text,
                 s.title_translations::text,
                 s.specialty,
                 s.experience,
                 s.next_available_label
               ), 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک'), chr(8204), ' '),
               '\\s+',
               ' ',
               'g'
             ) as normalized_search_blob
      from category.provider_staffs ps
      join category.staff s on s.id = ps.staff_id and s.is_active = true
      where ps.is_active = true
        and (${providerId ?? null}::uuid is null or ps.service_provider_id = ${providerId ?? null}::uuid)
        and (${specialistId ?? null}::uuid is null or s.id = ${specialistId ?? null}::uuid)
        and (
          ${serviceId ?? null}::uuid is null
          or exists (
            select 1
            from category.provider_services selected_ps
            join category.staff_services ss on ss.service_definition_id = selected_ps.service_definition_id
              and ss.staff_id = s.id
              and ss.is_active = true
            where selected_ps.id = ${serviceId ?? null}::uuid
              and selected_ps.is_active = true
          )
        )
    )
    select id,
           specialist_name,
           specialist_title,
           specialty,
           profile_image_url,
           rating,
           review_count,
           experience,
           patients,
           next_available_label,
           success_rate
    from specialists s
    where (
      ${searchText}::text = ''
      or s.specialist_name ilike ${like}
      or s.specialist_title ilike ${like}
      or coalesce(s.specialty, '') ilike ${like}
      or replace(replace(replace(s.specialist_name, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      or replace(replace(replace(s.specialist_title, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      or exists (
        select 1
        from jsonb_each_text(coalesce(s.name_translations, '{}'::jsonb) || coalesce(s.title_translations, '{}'::jsonb)) tr
        where tr.value ilike ${like}
           or replace(replace(replace(tr.value, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike}
      )
      or (
        ${normalizedSearchText}::text <> ''
        and not exists (
          select 1
          from unnest(regexp_split_to_array(${normalizedSearchText}::text, '\\s+')) as term
          where nullif(btrim(term), '') is not null
            and s.normalized_search_blob not ilike ('%' || term || '%')
        )
      )
    )
    order by
      case
        when ${searchText}::text = '' then 10
        when s.specialist_name ilike ${like} then 0
        when replace(replace(replace(s.specialist_name, 'ي', 'ی'), 'ك', 'ک'), chr(8204), ' ') ilike ${normalizedLike} then 1
        else 5
      end,
      s.rating desc nulls last,
      s.review_count desc nulls last
    limit ${take} offset ${offset}
  `;

  const items: SpecialistCardItem[] = rows.map((row: any) => ({
    id: row.id,
    name: row.specialist_name || '',
    title: row.specialist_title || '',
    specialty: row.specialty,
    imageUrl: row.profile_image_url,
    rating: row.rating,
    reviewCount: row.review_count,
    experience: row.experience,
    patients: row.patients,
    nextAvailableLabel: row.next_available_label,
    successRate: row.success_rate,
  }));

  return { items, hasMore: items.length === take };
}

export async function getServiceMode(providerServiceId: string) {
  const rows = await db`
    select ps.id,
           ps.service_definition_id,
           ps.currency,
           ps.value,
           ps.duration_minutes,
           ps.slot_interval_minutes,
           sd.requires_specialist,
           sd.booking_ui_mode
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.id = ${providerServiceId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function listAddonProviderTypes(providerServiceId: string, locale = 'fa-IR') {
  const rows = await db`
    select sapt.provider_type_id,
           sapt.icon,
           sapt.is_required,
           sapt.metadata,
           pt.name_translations,
           pt.description_translations
    from category.service_definition_addon_provider_types sapt
    join category.provider_services ps on ps.service_definition_id = sapt.service_definition_id
    join category.provider_types pt on pt.id = sapt.provider_type_id
    where ps.id = ${providerServiceId}
    order by sapt.display_order asc, pt.create_date asc
  `;

  const items: ProviderTypeAddonItem[] = rows.map((row: any) => ({
    providerTypeId: row.provider_type_id,
    label: pickTranslation(row.name_translations, locale),
    description: pickTranslation(row.description_translations, locale),
    icon: row.icon,
    isRequired: row.is_required,
    metadata: row.metadata ?? {},
  }));

  return { items };
}

export async function listUploadRequirements(providerServiceId: string, locale = 'fa-IR') {
  const rows = await db`
    select sufr.id,
           sufr.title_translations,
           sufr.description_translations,
           sufr.is_required,
           sufr.max_files,
           sufr.allowed_extensions,
           sufr.allowed_mime_types,
           sufr.max_file_size_bytes,
           sufr.example_file_url
    from category.service_upload_file_requirements sufr
    where sufr.service_definition_id = (
      select service_definition_id from category.provider_services where id = ${providerServiceId}
    )
    order by sufr.display_order asc, sufr.create_date asc
  `;

  const items: UploadRequirementItem[] = rows.map((row: any) => ({
    id: row.id,
    title: pickTranslation(row.title_translations, locale),
    description: pickTranslation(row.description_translations, locale),
    isRequired: row.is_required,
    maxFiles: row.max_files,
    allowedExtensions: row.allowed_extensions ?? [],
    allowedMimeTypes: row.allowed_mime_types ?? [],
    maxFileSizeBytes: Number(row.max_file_size_bytes ?? 0),
    exampleFileUrl: row.example_file_url,
  }));

  return { items };
}

export async function recalculateDraftTotals(draftId: string) {
  const mainRows = await db<any[]>`
    select coalesce(ps.value, 0) as main_amount,
           coalesce(ps.currency, d.currency) as currency,
           coalesce(d.use_lsevin, false) as use_lsevin,
           d.metadata
    from booking.booking_drafts d
    left join category.provider_services ps on ps.id = d.service_id
    where d.id = ${draftId}
  `;
  const useLsevin = Boolean(mainRows[0]?.use_lsevin);
  const childRows = useLsevin
    ? await db<any[]>`
        select coalesce(sum(coalesce(ps.value, c.subtotal_amount, 0)), 0) as child_amount
        from booking.booking_draft_child_bookings c
        left join category.provider_services ps on ps.id = c.service_id
        where c.parent_draft_id = ${draftId}
      `
    : [{ child_amount: 0 }];
  const mainAmount = Number(mainRows[0]?.main_amount ?? 0);
  const childAmount = Number(childRows[0]?.child_amount ?? 0);
  const grossTotal = Math.round((mainAmount + childAmount) * 100) / 100;
  const coupon = await resolveDraftCoupon(draftId, grossTotal);
  const discountAmount = coupon ? Math.min(grossTotal, coupon.discountAmount) : 0;
  const total = Math.round(Math.max(0, grossTotal - discountAmount) * 100) / 100;

  const cleanCouponMetadataSql = db`
    coalesce(metadata, '{}'::jsonb)
      - 'couponCode'
      - 'appliedCouponCode'
      - 'appliedCouponId'
      - 'appliedCouponSource'
      - 'appliedDiscountType'
      - 'appliedDiscountValue'
      - 'appliedDiscountAmount'
      - 'couponTitle'
      - 'customerCouponId'
  `;

  if (coupon) {
    await db`
      update booking.booking_drafts
      set subtotal_amount = ${mainAmount},
          addons_amount = ${childAmount},
          total_amount = ${total},
          metadata = (${cleanCouponMetadataSql}) || ${JSON.stringify({
            couponCode: coupon.code,
            appliedCouponCode: coupon.code,
            appliedCouponId: coupon.id,
            appliedCouponSource: coupon.source,
            appliedDiscountType: coupon.discountType,
            appliedDiscountValue: coupon.discountValue,
            appliedDiscountAmount: discountAmount,
            couponTitle: coupon.title ?? null,
            customerCouponId: coupon.customerCouponId ?? null,
          })}::jsonb
      where id = ${draftId}
    `;
  } else {
    await db`
      update booking.booking_drafts
      set subtotal_amount = ${mainAmount},
          addons_amount = ${childAmount},
          total_amount = ${total},
          metadata = ${cleanCouponMetadataSql}
      where id = ${draftId}
    `;
  }

  return {
    subtotalAmount: mainAmount,
    addonsAmount: childAmount,
    grossTotalAmount: grossTotal,
    totalAmount: total,
    discountAmount,
    appliedCouponId: coupon?.id ?? null,
    appliedCouponCode: coupon?.code ?? null,
    appliedCouponSource: coupon?.source ?? null,
    appliedDiscountType: coupon?.discountType ?? null,
    appliedDiscountValue: coupon?.discountValue ?? null,
    customerCouponId: coupon?.customerCouponId ?? null,
    currency: mainRows[0]?.currency ?? 'USD',
  };
}

export async function applyDraftCoupon(userId: string, draftId: string, couponCode: string) {
  const code = String(couponCode ?? '').trim();
  if (!code) throw new Error('Coupon code is required');

  const [draft] = await db<any[]>`
    select id
    from booking.booking_drafts
    where id = ${draftId}
      and user_id = ${userId}
      and status in ('Draft', 'InProgress')
    limit 1
  `;
  if (!draft) throw new Error('Draft not found');

  await db`
    update booking.booking_drafts
    set metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ couponCode: code })}::jsonb,
        updated_at = now()
    where id = ${draftId}
  `;

  const totals = await recalculateDraftTotals(draftId);
  if (!totals.appliedCouponId) {
    await removeDraftCoupon(userId, draftId);
    throw new Error('Coupon is invalid, expired, already used, or not applicable to this booking.');
  }

  return { ok: true, totals };
}

export async function removeDraftCoupon(userId: string, draftId: string) {
  const [draft] = await db<any[]>`
    select id
    from booking.booking_drafts
    where id = ${draftId}
      and user_id = ${userId}
      and status in ('Draft', 'InProgress')
    limit 1
  `;
  if (!draft) throw new Error('Draft not found');

  await db`
    update booking.booking_drafts
    set metadata = coalesce(metadata, '{}'::jsonb)
      - 'couponCode'
      - 'appliedCouponCode'
      - 'appliedCouponId'
      - 'appliedCouponSource'
      - 'appliedDiscountType'
      - 'appliedDiscountValue'
      - 'appliedDiscountAmount'
      - 'couponTitle'
      - 'customerCouponId',
      updated_at = now()
    where id = ${draftId}
  `;

  const totals = await recalculateDraftTotals(draftId);
  return { ok: true, totals };
}

async function getDraftByIdForUser(userId: string, draftId: string) {
  const [draft] = await db`
    select *
    from booking.booking_drafts
    where id = ${draftId}
      and user_id = ${userId}
    limit 1
  `;
  return draft ?? null;
}

export async function checkoutDraft(
  userId: string,
  payload: { draftId: string; paymentMethod: string; notes?: string }
) {
  if (!userId) throw new Error("userId is required");
  if (!payload?.draftId) throw new Error("draftId is required");
  if (!payload?.paymentMethod) throw new Error("paymentMethod is required");

  const draft = await getDraftByIdForUser(userId, payload.draftId);
  if (!draft?.id) throw new Error("Draft not found");

  const totals = await recalculateDraftTotals(draft.id);

  const [scope] = await db<any[]>`
    select d.provider_id as "providerId",
           d.service_id as "providerServiceId",
           ps.service_definition_id as "serviceDefinitionId",
           sp.provider_type_id as "providerTypeId"
    from booking.booking_drafts d
    left join category.provider_services ps on ps.id = d.service_id
    left join category.service_providers sp on sp.id = d.provider_id
    where d.id = ${draft.id}
    limit 1
  `;

  const paymentPolicy = await resolveBookingPaymentPolicy({
    providerTypeId: scope?.providerTypeId ?? null,
    providerId: scope?.providerId ?? null,
    serviceDefinitionId: scope?.serviceDefinitionId ?? null,
    providerServiceId: scope?.providerServiceId ?? null,
  });
  const paymentTerms = calculateBookingPaymentTerms(totals.totalAmount, totals.currency, paymentPolicy);
  const scheduleLines = (paymentTerms.schedule || [])
    .map((line: any, index: number) => ({
      ...line,
      lineNo: Number(line.lineNo || line.line_no || index + 1),
      lineType: normalizePaymentScheduleLineType(line.lineType ?? line.line_type),
      amount: Number(line.amount || 0),
      currencyCode: String(line.currencyCode || line.currency_code || paymentTerms.paymentCurrencyCode || totals.currency || 'USD').toUpperCase(),
      label: String(line.label || (normalizePaymentScheduleLineType(line.lineType ?? line.line_type) === 'balance' ? 'Remaining balance' : 'Payment due now')),
      metadata: line.metadata && typeof line.metadata === 'object' ? line.metadata : {},
    }))
    .filter((line: any) => line.amount > 0);

  // Final guard before converting a draft into a booking. This checks generic service/resource availability
  // (hotel rooms, seats, equipment, etc.) as well as the legacy provider/staff availability fallback.
  await assertDraftAvailabilityBeforeCheckout(draft.id);

  const txResult = await db.begin(async (tx) => {
    const [lockedDraft] = await tx`
      select d.*
      from booking.booking_drafts d
      where d.id = ${draft.id}
        and d.user_id = ${userId}
      for update
    `;

    if (!lockedDraft) {
      throw new Error("Draft not found");
    }

    const [existingPending] = await tx`
      select b.id
      from booking.bookings b
      where b.user_id = ${userId}
        and b.booking_status = 'Pending'
      order by b.create_date desc
      limit 1
      for update
    `;

    let bookingId: string;

    if (existingPending?.id) {
      bookingId = existingPending.id;

      await tx`
        update booking.bookings b
        set provider_id = d.provider_id,
            service_id = d.service_id,
            specialist_id = d.specialist_id,
            selected_date = d.selected_date,
            selected_date_from = d.selected_date_from,
            selected_date_to = d.selected_date_to,
            selected_time = d.selected_time,
            selected_time_from = d.selected_time_from,
            selected_time_to = d.selected_time_to,
            payment_method = ${payload.paymentMethod},
            add_ons = '[]'::jsonb,
            upload_files = coalesce((select jsonb_agg(jsonb_build_object('title', x.title,'fileUrl', x.file_url,'requirementId', x.requirement_id)) from booking.booking_draft_documents x where x.draft_id = d.id),'[]'::jsonb),
            additional_services = '[]'::jsonb,
            payment_status = case when ${paymentTerms.dueNowAmount} <= 0 then 'NotRequired' else 'Pending' end,
            booking_status = 'Pending',
            currency_code = ${totals.currency},
            total_amount = ${totals.totalAmount},
            paid_amount = 0,
            applied_coupon_id = ${totals.appliedCouponId ?? null},
            applied_discount_type = ${totals.appliedDiscountType ?? null},
            applied_discount_value = ${totals.appliedDiscountValue ?? null},
            applied_discount_amount = ${totals.discountAmount ?? 0},
            booking_ui_mode = coalesce(sd.booking_ui_mode, 'default_slot'),
            form_submission_id = (d.metadata ->> 'formSubmissionId')::uuid,
            adults = (d.metadata ->> 'adults')::integer,
            children = (d.metadata ->> 'children')::integer,
            infants = (d.metadata ->> 'infants')::integer,
            rooms = (d.metadata ->> 'rooms')::integer,
            metadata = d.metadata,
            source_currency_code = coalesce(d.source_currency_code, ${totals.currency}),
            display_currency_code = coalesce(d.display_currency_code, ${totals.currency}),
            payment_currency_code = coalesce(d.payment_currency_code, ${totals.currency}),
            settlement_currency_code = coalesce(d.settlement_currency_code, d.source_currency_code, ${totals.currency}),
            source_subtotal_amount = coalesce(d.source_subtotal_amount, d.subtotal_amount, ${totals.subtotalAmount}),
            source_addons_amount = coalesce(d.source_addons_amount, d.addons_amount, ${totals.addonsAmount}),
            source_total_amount = coalesce(d.source_total_amount, d.total_amount, ${totals.totalAmount}),
            display_subtotal_amount = coalesce(d.display_subtotal_amount, d.subtotal_amount, ${totals.subtotalAmount}),
            display_addons_amount = coalesce(d.display_addons_amount, d.addons_amount, ${totals.addonsAmount}),
            display_total_amount = coalesce(d.display_total_amount, d.total_amount, ${totals.totalAmount}),
            exchange_rate = d.exchange_rate,
            exchange_rate_ids = coalesce(d.exchange_rate_ids, array[]::uuid[]),
            fx_quote_id = d.fx_quote_id,
            pricing_snapshot = coalesce(d.pricing_snapshot, '{}'::jsonb)
        from booking.booking_drafts d
        left join category.provider_services ps on ps.id = d.service_id
        left join category.service_definitions sd on sd.id = ps.service_definition_id
        where b.id = ${bookingId}
          and d.id = ${draft.id}
      `;

      await tx`delete from booking.booking_child_bookings where parent_booking_id = ${bookingId}`;
      await tx`delete from booking.booking_documents where booking_id = ${bookingId}`;
      await tx`delete from booking.booking_addons where booking_id = ${bookingId}`;
      await tx`delete from booking.payments where booking_id = ${bookingId}`;
      await tx`delete from commercial.booking_payment_schedule_lines where payment_terms_id in (select id from commercial.booking_payment_terms where booking_id = ${bookingId})`;
      await tx`delete from commercial.booking_payment_terms where booking_id = ${bookingId}`;
    } else {
      const [booking] = await tx`
        insert into booking.bookings (
          id, provider_id, service_id, specialist_id,
          selected_date, selected_date_from, selected_date_to,
          selected_time, selected_time_from, selected_time_to,
          payment_method, add_ons, upload_files, additional_services,
          payment_status, booking_status, user_id,
          currency_code, total_amount, paid_amount,
          applied_coupon_id, applied_discount_type, applied_discount_value, applied_discount_amount,
          booking_ui_mode, form_submission_id, adults, children, infants, rooms, metadata,
          source_currency_code, display_currency_code, payment_currency_code, settlement_currency_code,
          source_subtotal_amount, source_addons_amount, source_total_amount,
          display_subtotal_amount, display_addons_amount, display_total_amount,
          exchange_rate, exchange_rate_ids, fx_quote_id, pricing_snapshot
        )
        select public.uuid_generate_v4(),
               d.provider_id,
               d.service_id,
               d.specialist_id,
               d.selected_date,
               d.selected_date_from,
               d.selected_date_to,
               d.selected_time,
               d.selected_time_from,
               d.selected_time_to,
               ${payload.paymentMethod},
               '[]'::jsonb,
               coalesce((select jsonb_agg(jsonb_build_object('title', x.title,'fileUrl', x.file_url,'requirementId', x.requirement_id)) from booking.booking_draft_documents x where x.draft_id = d.id),'[]'::jsonb),
               '[]'::jsonb,
               case when ${paymentTerms.dueNowAmount} <= 0 then 'NotRequired' else 'Pending' end,
               'Pending',
               d.user_id,
               ${totals.currency},
               ${totals.totalAmount},
               0,
               ${totals.appliedCouponId ?? null},
               ${totals.appliedDiscountType ?? null},
               ${totals.appliedDiscountValue ?? null},
               ${totals.discountAmount ?? 0},
               coalesce(sd.booking_ui_mode, 'default_slot'),
               (d.metadata ->> 'formSubmissionId')::uuid,
               (d.metadata ->> 'adults')::integer,
               (d.metadata ->> 'children')::integer,
               (d.metadata ->> 'infants')::integer,
               (d.metadata ->> 'rooms')::integer,
               d.metadata,
               coalesce(d.source_currency_code, ${totals.currency}),
               coalesce(d.display_currency_code, ${totals.currency}),
               coalesce(d.payment_currency_code, ${totals.currency}),
               coalesce(d.settlement_currency_code, d.source_currency_code, ${totals.currency}),
               coalesce(d.source_subtotal_amount, d.subtotal_amount, ${totals.subtotalAmount}),
               coalesce(d.source_addons_amount, d.addons_amount, ${totals.addonsAmount}),
               coalesce(d.source_total_amount, d.total_amount, ${totals.totalAmount}),
               coalesce(d.display_subtotal_amount, d.subtotal_amount, ${totals.subtotalAmount}),
               coalesce(d.display_addons_amount, d.addons_amount, ${totals.addonsAmount}),
               coalesce(d.display_total_amount, d.total_amount, ${totals.totalAmount}),
               d.exchange_rate,
               coalesce(d.exchange_rate_ids, array[]::uuid[]),
               d.fx_quote_id,
               coalesce(d.pricing_snapshot, '{}'::jsonb)
        from booking.booking_drafts d
        left join category.provider_services ps on ps.id = d.service_id
        left join category.service_definitions sd on sd.id = ps.service_definition_id
        where d.id = ${draft.id}
        returning id
      `;

      bookingId = booking.id;
    }

    await tx`
      insert into booking.booking_child_bookings (
        parent_booking_id, provider_type_id, provider_id, service_id, specialist_id,
        selected_date, selected_date_from, selected_date_to,
        selected_time, selected_time_from, selected_time_to,
        adults, children, infants, rooms,
        booking_ui_mode, form_submission_id, subtotal_amount, currency, status, metadata
      )
      select ${bookingId},
             provider_type_id, provider_id, service_id, specialist_id,
             selected_date, selected_date_from, selected_date_to,
             selected_time, selected_time_from, selected_time_to,
             adults, children, infants, rooms,
             booking_ui_mode, form_submission_id,
             coalesce((select value from category.provider_services ps where ps.id = booking_draft_child_bookings.service_id), subtotal_amount),
             currency, 'Confirmed', metadata
      from booking.booking_draft_child_bookings
      where parent_draft_id = ${draft.id}
        and ${Boolean(lockedDraft.use_lsevin)} = true
    `;

    await tx`
      insert into booking.booking_documents (booking_id, requirement_id, title, file_name, file_url)
      select ${bookingId}, requirement_id, title, file_name, file_url
      from booking.booking_draft_documents
      where draft_id = ${draft.id}
        and ${Boolean(lockedDraft.use_lsevin)} = true
    `;

    await tx`
      insert into booking.booking_addons (booking_id, addon_id, source_type, addon_kind, quantity, unit_price, config)
      select ${bookingId}, addon_id, source_type, addon_kind, quantity, unit_price, config
      from booking.booking_draft_addons
      where draft_id = ${draft.id}
        and ${Boolean(lockedDraft.use_lsevin)} = true
    `;

    const [savedTerms] = await tx<any[]>`
      insert into commercial.booking_payment_terms (
        booking_id, policy_id, collection_mode, payment_currency_code, total_amount,
        due_now_amount, due_later_amount, deposit_percent, deposit_fixed_amount,
        balance_due_trigger, deposit_refundable_mode, terms_snapshot
      ) values (
        ${bookingId}, ${paymentPolicy?.id ?? null}, ${paymentTerms.collectionMode}, ${paymentTerms.paymentCurrencyCode}, ${paymentTerms.totalAmount},
        ${paymentTerms.dueNowAmount}, ${paymentTerms.dueLaterAmount}, ${paymentTerms.depositPercent}, ${paymentTerms.depositFixedAmount},
        ${paymentTerms.balanceDueTrigger}, ${paymentTerms.depositRefundableMode}, ${paymentTerms.termsSnapshot as any}
      )
      returning id
    `;

    const allowedScheduleLineTypes = (await listAllowedScheduleLineTypes(tx)) as string[];
    for (const line of scheduleLines) {
      const semanticLineType = normalizePaymentScheduleLineType(line.lineType);
      const persistedLineType = choosePersistedScheduleLineType(semanticLineType, allowedScheduleLineTypes);
      if (!persistedLineType) continue;

      await tx`
        insert into commercial.booking_payment_schedule_lines (
          payment_terms_id, line_no, line_type, label, amount, currency_code, status, metadata
        ) values (
          ${savedTerms.id}, ${line.lineNo}, ${persistedLineType}, ${line.label}, ${line.amount}, ${line.currencyCode},
          'pending', ${({ ...(line.metadata ?? {}), semanticLineType, originalLineType: line.lineType }) as any}
        )
      `;
    }

    let paymentStatus = 'Pending';
    let paymentId: string | null = null;
    if (paymentTerms.dueNowAmount <= 0) {
      const [payment] = await tx`
        insert into booking.payments (
          booking_id, user_id, payment_method, gateway, amount, currency, status,
          source_currency_code, settlement_currency_code, source_amount, settlement_amount
        ) values (
          ${bookingId}, ${userId}, 'free_booking', 'internal', 0, ${paymentTerms.paymentCurrencyCode}, 'Succeeded',
          ${totals.currency}, ${totals.currency}, 0, 0
        ) returning id
      `;
      paymentId = payment.id;
      paymentStatus = 'NotRequired';
      await tx`
        update booking.bookings
        set payment_status = 'NotRequired',
            paid_amount = 0,
            payment_method = 'free_booking'
        where id = ${bookingId}
      `;
    } else {
      const [payment] = await tx`
        insert into booking.payments (
          booking_id, user_id, payment_method, amount, currency, status,
          source_currency_code, settlement_currency_code, source_amount, settlement_amount
        ) values (
          ${bookingId}, ${userId}, ${payload.paymentMethod}, ${paymentTerms.dueNowAmount}, ${paymentTerms.paymentCurrencyCode}, 'Pending',
          ${totals.currency}, ${totals.currency}, ${paymentTerms.dueNowAmount}, ${paymentTerms.dueNowAmount}
        ) returning id
      `;
      paymentId = payment.id;
    }

    if (totals.appliedCouponSource === 'loyalty' && totals.customerCouponId) {
      await tx`
        update loyalty.customer_coupons
        set status = 'Redeemed',
            redeemed_at = coalesce(redeemed_at, now()),
            booking_id = ${bookingId}
        where id = ${totals.customerCouponId}
          and customer_id = ${userId}
      `;
    }

    if (totals.appliedCouponSource === 'marketing' && totals.appliedCouponId) {
      await tx`
        update marketing.user_discount_coupons
        set status = 'reserved',
            reserved_at = coalesce(reserved_at, now()),
            order_reference = ${bookingId}
        where id = ${totals.appliedCouponId}
          and customer_id = ${userId}
          and status = 'issued'
      `;
    }

    await tx`
      update booking.booking_drafts
      set status = 'Submitted',
          submitted_at = coalesce(submitted_at, now()),
          payment_method = ${payload.paymentMethod},
          notes = coalesce(${payload.notes ?? null}, notes),
          updated_at = now()
      where id = ${draft.id}
    `;

    return { bookingId, paymentId, dueNowAmount: paymentTerms.dueNowAmount, dueLaterAmount: paymentTerms.dueLaterAmount, collectionMode: paymentTerms.collectionMode, currency: paymentTerms.paymentCurrencyCode, paymentStatus };
  });

  await applyCommercialSnapshotAfterCheckout({ bookingId: txResult.bookingId, paymentId: txResult.paymentId });

  return {
    bookingId: txResult.bookingId,
    paymentId: txResult.paymentId,
    totalAmount: totals.totalAmount,
    dueNowAmount: txResult.dueNowAmount,
    dueLaterAmount: txResult.dueLaterAmount,
    collectionMode: txResult.collectionMode,
    currency: txResult.currency,
    paymentStatus: txResult.paymentStatus,
  };
}
