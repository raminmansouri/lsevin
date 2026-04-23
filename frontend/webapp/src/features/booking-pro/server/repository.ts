import 'server-only';

import db from '@/config/database/db';
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

function mapDraftRow(row: any): BookingDraftState {
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
    metadata: row.metadata ?? {},
    formSubmissionId: row.form_submission_id ?? undefined,
    childBookings: row.child_bookings ?? [],
    uploadFiles: row.upload_files ?? [],
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

export async function upsertMainDraftSelection(userId: string, input: Partial<BookingDraftState>) {
  const draft = await getOrCreateActiveDraft(userId);

  await db`
    update booking.booking_drafts
    set provider_id = coalesce(${input.providerId ?? null}, provider_id),
        service_id = coalesce(${input.serviceId ?? null}, service_id),
        specialist_id = ${input.specialistId ?? null},
        selected_date = ${input.selectedDate ?? null},
        selected_time = ${input.selectedTime ?? null},
        selected_date_from = ${input.selectedDateFrom ?? null},
        selected_date_to = ${input.selectedDateTo ?? null},
        selected_time_from = ${input.selectedTimeFrom ?? null},
        selected_time_to = ${input.selectedTimeTo ?? null},
        use_lsevin = coalesce(${input.useLsevin ?? null}, use_lsevin),
        current_step = greatest(coalesce(${input.currentStep ?? null}, current_step), current_step),
        payment_method = coalesce(${input.paymentMethod ?? null}, payment_method),
        currency = coalesce(${input.currency ?? null}, currency),
        subtotal_amount = coalesce(${input.subtotalAmount ?? null}, subtotal_amount),
        addons_amount = coalesce(${input.addonsAmount ?? null}, addons_amount),
        total_amount = coalesce(${input.totalAmount ?? null}, total_amount),
        notes = coalesce(${input.notes ?? null}, notes),
        metadata = coalesce(${(input.metadata ?? null) as any}, metadata),
        status = 'InProgress'
    where id = ${draft.id}
  `;

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
          ${doc.title ?? 'Document'},
          ${doc.fileUrl ?? ''},
          ${doc.fileUrl ?? ''}
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
      ${child.metadata ?? {} as any},
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

export async function listProviders(params: { locale?: Locale; search?: string; providerTypeId?: string; take?: number; offset?: number; }) {
  const { locale = 'en-US', search = '', providerTypeId, take = 3, offset = 0 } = params;
  const like = `%${search}%`;
  const rows = await db`
    select sp.id,
           sp.provider_type_id,
           sp.name_translations,
           sp.description_translations,
           sp.image_url,
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
           sp.languages
    from category.service_providers sp
    where sp.is_active = true
      and (${providerTypeId ?? null}::uuid is null or sp.provider_type_id = ${providerTypeId ?? null})
      and (
        ${search} = ''
        or common.get_translation_t(sp.name_translations, ${locale}, 'en') ilike ${like}
        or common.get_translation_t(sp.description_translations, ${locale}, 'en') ilike ${like}
      )
    order by sp.featured_score desc nulls last, sp.rating desc nulls last, sp.review_count desc nulls last, sp.create_date desc
    limit ${take} offset ${offset}
  `;

  const items: ProviderCardItem[] = rows.map((row: any) => ({
    id: row.id,
    providerTypeId: row.provider_type_id,
    name: pickTranslation(row.name_translations, locale),
    description: pickTranslation(row.description_translations, locale),
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
    languages: row.languages,
  }));

  return { items, hasMore: items.length === take };
}

export async function listServices(params: { providerId: string; locale?: Locale; search?: string; take?: number; offset?: number; }) {
  const { providerId, locale = 'en-US', search = '', take = 3, offset = 0 } = params;
  const like = `%${search}%`;
  const rows = await db`
    select ps.id,
           ps.service_definition_id,
           ps.display_name_translations,
           ps.description_translations,
           ps.image_url,
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
           sd.booking_ui_mode
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.is_active = true
      and ps.service_provider_id = ${providerId}
      and (
        ${search} = ''
        or common.get_translation_t(ps.display_name_translations, ${locale}, 'en') ilike ${like}
        or common.get_translation_t(ps.description_translations, ${locale}, 'en') ilike ${like}
      )
    order by ps.is_popular desc nulls last, ps.rating desc nulls last, ps.review_count desc nulls last, ps.create_date desc
    limit ${take} offset ${offset}
  `;

  const items: ServiceCardItem[] = rows.map((row: any) => ({
    id: row.id,
    serviceDefinitionId: row.service_definition_id,
    name: pickTranslation(row.display_name_translations, locale),
    description: pickTranslation(row.description_translations, locale),
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

export async function listSpecialists(params: { providerId: string; serviceId: string; locale?: Locale; search?: string; take?: number; offset?: number; }) {
  const { providerId, serviceId, locale = 'en-US', search = '', take = 3, offset = 0 } = params;
  const like = `%${search}%`;
  const rows = await db`
    select s.id,
           s.name_translations,
           s.title_translations,
           s.specialty,
           s.profile_image_url,
           s.rating,
           s.review_count,
           s.experience,
           s.patients,
           s.next_available_label,
           s.success_rate
    from category.provider_staffs ps
    join category.staff s on s.id = ps.staff_id and s.is_active = true
    join category.staff_services ss on ss.staff_id = s.id and ss.service_definition_id = (
      select service_definition_id from category.provider_services where id = ${serviceId}
    ) and ss.is_active = true
    where ps.is_active = true
      and ps.service_provider_id = ${providerId}
      and (
        ${search} = ''
        or common.get_translation_t(s.name_translations, ${locale}, 'en') ilike ${like}
        or common.get_translation_t(s.title_translations, ${locale}, 'en') ilike ${like}
        or coalesce(s.specialty, '') ilike ${like}
      )
    order by s.rating desc nulls last, s.review_count desc nulls last, s.create_date desc
    limit ${take} offset ${offset}
  `;

  const items: SpecialistCardItem[] = rows.map((row: any) => ({
    id: row.id,
    name: pickTranslation(row.name_translations, locale),
    title: pickTranslation(row.title_translations, locale),
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

export async function listAddonProviderTypes(providerServiceId: string, locale = 'en-US') {
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

export async function listUploadRequirements(providerServiceId: string, locale = 'en-US') {
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
  const mainRows = await db`
    select coalesce(ps.value, 0) as main_amount,
           coalesce(ps.currency, d.currency) as currency
    from booking.booking_drafts d
    left join category.provider_services ps on ps.id = d.service_id
    where d.id = ${draftId}
  `;
  const childRows = await db`
    select coalesce(sum(coalesce(ps.value, c.subtotal_amount, 0)), 0) as child_amount
    from booking.booking_draft_child_bookings c
    left join category.provider_services ps on ps.id = c.service_id
    where c.parent_draft_id = ${draftId}
  `;
  const mainAmount = Number(mainRows[0]?.main_amount ?? 0);
  const childAmount = Number(childRows[0]?.child_amount ?? 0);
  const total = mainAmount + childAmount;
  await db`
    update booking.booking_drafts
    set subtotal_amount = ${mainAmount}, addons_amount = ${childAmount}, total_amount = ${total}
    where id = ${draftId}
  `;
  return { subtotalAmount: mainAmount, addonsAmount: childAmount, totalAmount: total, currency: mainRows[0]?.currency ?? 'USD' };
}

export async function checkoutDraft(userId: string, payload: { draftId: string; paymentMethod: string; notes?: string; }) {
  const draft = await getOrCreateActiveDraft(userId);
  if (draft.id !== payload.draftId) throw new Error('Active draft mismatch');

  const totals = await recalculateDraftTotals(draft.id!);

  return await db.begin(async (tx) => {
    const [booking] = await tx`
      insert into booking.bookings (
        id, provider_id, service_id, specialist_id,
        selected_date, selected_date_from, selected_date_to,
        selected_time, selected_time_from, selected_time_to,
        payment_method, add_ons, upload_files, additional_services,
        payment_status, booking_status, user_id,
        currency_code, total_amount, paid_amount,
        booking_ui_mode, form_submission_id, adults, children, infants, rooms, metadata
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
             coalesce((select jsonb_agg(jsonb_build_object('title', x.title, 'fileUrl', x.file_url, 'requirementId', x.requirement_id)) from booking.booking_draft_documents x where x.draft_id = d.id), '[]'::jsonb),
             '[]'::jsonb,
             'Pending',
             'Pending',
             d.user_id,
             ${totals.currency},
             ${totals.totalAmount},
             0,
             coalesce(sd.booking_ui_mode, 'default_slot'),
             (d.metadata ->> 'formSubmissionId')::uuid,
             (d.metadata ->> 'adults')::integer,
             (d.metadata ->> 'children')::integer,
             (d.metadata ->> 'infants')::integer,
             (d.metadata ->> 'rooms')::integer,
             d.metadata
      from booking.booking_drafts d
      left join category.provider_services ps on ps.id = d.service_id
      left join category.service_definitions sd on sd.id = ps.service_definition_id
      where d.id = ${draft.id}
      returning id
    `;

    await tx`
      insert into booking.booking_child_bookings (
        parent_booking_id, provider_type_id, provider_id, service_id, specialist_id,
        selected_date, selected_date_from, selected_date_to,
        selected_time, selected_time_from, selected_time_to,
        adults, children, infants, rooms,
        booking_ui_mode, form_submission_id, subtotal_amount, currency, status, metadata
      )
      select ${booking.id}, provider_type_id, provider_id, service_id, specialist_id,
             selected_date, selected_date_from, selected_date_to,
             selected_time, selected_time_from, selected_time_to,
             adults, children, infants, rooms,
             booking_ui_mode, form_submission_id,
             coalesce((select value from category.provider_services where id = service_id), subtotal_amount),
             currency,
             'Confirmed',
             metadata
      from booking.booking_draft_child_bookings
      where parent_draft_id = ${draft.id}
    `;

    await tx`
      insert into booking.booking_documents (booking_id, requirement_id, title, file_name, file_url)
      select ${booking.id}, requirement_id, title, file_name, file_url
      from booking.booking_draft_documents
      where draft_id = ${draft.id}
    `;

    await tx`
      insert into booking.payments (booking_id, user_id, payment_method, amount, currency, status)
      values (${booking.id}, ${userId}, ${payload.paymentMethod}, ${totals.totalAmount}, ${totals.currency}, 'Pending')
    `;

    await tx`
      update booking.booking_drafts
      set status = 'Submitted', submitted_at = now(), payment_method = ${payload.paymentMethod}, notes = coalesce(${payload.notes ?? null}, notes)
      where id = ${draft.id}
    `;

    return { bookingId: booking.id, totalAmount: totals.totalAmount, currency: totals.currency, paymentStatus: 'Pending' };
  });
}
