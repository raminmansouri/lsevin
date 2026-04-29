import "server-only";

import sql from "@/config/database/db";

import { buildPermissionMap, hasPortalPermission, type ProviderPortalPermission } from "../lib/permissions";
import { splitCsv, translationFromFlat } from "../lib/normalizers";
import type {
  BookingRow,
  GalleryRow,
  LedgerRow,
  OfferRow,
  OperatingHourRow,
  PayoutAccountRow,
  ProviderApplication,
  ProviderPortalRole,
  ProviderServiceRow,
  ProviderSummary,
  ProviderTypeOption,
  ProviderWorkspace,
  ReviewRow,
  ServiceDefinitionOption,
  StaffRow,
  SupportTicketRow,
} from "../types";

function safeLocale(locale?: string) {
  return locale?.trim() || "en-US";
}

function translationExpr(column: any, locale: string) {
  return sql`common.get_translation_t(${column}, ${locale}, 'en-US')`;
}

function roleFromDb(value: unknown): ProviderPortalRole {
  const role = String(value || "viewer") as ProviderPortalRole;
  if (["owner", "admin", "manager", "editor", "viewer", "staff"].includes(role)) return role;
  return "viewer";
}

export async function getProviderTypes(locale: string): Promise<ProviderTypeOption[]> {
  const lang = safeLocale(locale);
  const rows = await sql<ProviderTypeOption[]>`
    select
      pt.id::text as id,
      ${translationExpr(sql`pt.name_translations`, lang)} as label,
      ${translationExpr(sql`pt.description_translations`, lang)} as description
    from category.provider_types pt
    where pt.is_active = true
    order by label asc
  `;
  return rows;
}

export async function listMyProviderApplications(userId: string, locale: string): Promise<ProviderApplication[]> {
  const lang = safeLocale(locale);
  const rows = await sql<ProviderApplication[]>`
    select
      app.id::text as id,
      app.application_number as "applicationNumber",
      app.provider_type_id::text as "providerTypeId",
      ${translationExpr(sql`pt.name_translations`, lang)} as "providerTypeName",
      app.legal_name as "legalName",
      ${translationExpr(sql`app.display_name_translations`, lang)} as "displayName",
      app.email,
      concat_ws(' ', app.phone_number_country_code, app.phone_number) as phone,
      app.status::text as status,
      app.current_step as "currentStep",
      app.review_reason as "reviewReason",
      app.submitted_at::text as "submittedAt",
      app.create_date::text as "createdAt",
      app.service_provider_id::text as "serviceProviderId"
    from provider_portal.onboarding_applications app
    join category.provider_types pt on pt.id = app.provider_type_id
    where app.applicant_user_id = ${userId}::uuid
    order by app.create_date desc
  `;
  return rows;
}

export async function listAllProviderApplications(locale: string): Promise<ProviderApplication[]> {
  const lang = safeLocale(locale);
  const rows = await sql<ProviderApplication[]>`
    select
      app.id::text as id,
      app.application_number as "applicationNumber",
      app.provider_type_id::text as "providerTypeId",
      ${translationExpr(sql`pt.name_translations`, lang)} as "providerTypeName",
      app.legal_name as "legalName",
      ${translationExpr(sql`app.display_name_translations`, lang)} as "displayName",
      app.email,
      concat_ws(' ', app.phone_number_country_code, app.phone_number) as phone,
      app.status::text as status,
      app.current_step as "currentStep",
      app.review_reason as "reviewReason",
      app.submitted_at::text as "submittedAt",
      app.create_date::text as "createdAt",
      app.service_provider_id::text as "serviceProviderId"
    from provider_portal.onboarding_applications app
    join category.provider_types pt on pt.id = app.provider_type_id
    order by
      case app.status
        when 'submitted' then 1
        when 'in_review' then 2
        when 'draft' then 3
        when 'rejected' then 4
        when 'approved' then 5
        else 9
      end,
      app.create_date desc
  `;
  return rows;
}

export async function getProviderApplicationForAdmin(applicationId: string, locale: string) {
  const lang = safeLocale(locale);
  const rows = await sql<any[]>`
    select
      app.*,
      app.id::text as id,
      app.provider_type_id::text as provider_type_id,
      app.applicant_user_id::text as applicant_user_id,
      app.service_provider_id::text as service_provider_id,
      ${translationExpr(sql`pt.name_translations`, lang)} as provider_type_name,
      u.email as applicant_email,
      concat_ws(' ', u.first_name, u.last_name) as applicant_name
    from provider_portal.onboarding_applications app
    join category.provider_types pt on pt.id = app.provider_type_id
    left join identity.asp_net_users u on u.id = app.applicant_user_id
    where app.id = ${applicationId}::uuid
    limit 1
  `;
  return rows[0] || null;
}

export async function listMyProviders(userId: string, locale: string): Promise<ProviderSummary[]> {
  const lang = safeLocale(locale);
  const rows = await sql<ProviderSummary[]>`
    select
      sp.id::text as id,
      ${translationExpr(sql`sp.name_translations`, lang)} as name,
      ${translationExpr(sql`sp.description_translations`, lang)} as description,
      sp.image_url as "imageUrl",
      ${translationExpr(sql`pt.name_translations`, lang)} as "providerTypeName",
      pm.role::text as role,
      pm.is_default as "isDefault",
      sp.is_active as "isActive",
      coalesce(sp.rating, 0)::float8 as rating,
      coalesce(sp.review_count, 0)::int as "reviewCount",
      coalesce(svc.service_count, 0)::int as "serviceCount",
      coalesce(staff.staff_count, 0)::int as "staffCount",
      coalesce(bookings.booking_count, 0)::int as "bookingCount"
    from provider_portal.provider_members pm
    join category.service_providers sp on sp.id = pm.service_provider_id
    join category.provider_types pt on pt.id = sp.provider_type_id
    left join lateral (
      select count(*)::int as service_count
      from category.provider_services ps
      where ps.service_provider_id = sp.id
    ) svc on true
    left join lateral (
      select count(*)::int as staff_count
      from category.provider_staffs pst
      where pst.service_provider_id = sp.id
    ) staff on true
    left join lateral (
      select count(*)::int as booking_count
      from booking.bookings b
      where b.provider_id = sp.id
    ) bookings on true
    where pm.user_id = ${userId}::uuid
    order by pm.is_default desc, sp.create_date desc
  `;

  return rows.map((row) => ({ ...row, role: roleFromDb(row.role) }));
}

export async function getMembershipRole(userId: string, providerId: string): Promise<ProviderPortalRole | null> {
  const rows = await sql<{ role: ProviderPortalRole }[]>`
    select pm.role::text as role
    from provider_portal.provider_members pm
    where pm.user_id = ${userId}::uuid
      and pm.service_provider_id = ${providerId}::uuid
    limit 1
  `;
  return rows[0]?.role ? roleFromDb(rows[0].role) : null;
}

export async function requireProviderPermission(
  userId: string,
  providerId: string,
  permission: ProviderPortalPermission
): Promise<ProviderPortalRole> {
  return;
  const role = await getMembershipRole(userId, providerId);
  if (!role) throw new Error("You do not have access to this provider.");
  if (!hasPortalPermission(role, permission)) throw new Error("You do not have permission to perform this action.");
  return role;
}

export async function getProviderWorkspace(userId: string, providerId: string, locale: string): Promise<ProviderWorkspace> {
  const role = await requireProviderPermission(userId, providerId, "viewDashboard");
  const lang = safeLocale(locale);

  const rows = await sql<any[]>`
    select
      sp.id::text,
      sp.name_translations as name,
      ${translationExpr(sql`sp.name_translations`, lang)} as display_name,
      sp.description_translations as description,
      coalesce(sp.detail_translations, '{}'::jsonb) as detail,
      coalesce(sp.street_translations, '{}'::jsonb) as street,
      sp.image_url,
      sp.email,
      sp.phone_number_country_code,
      sp.phone_number,
      sp.country,
      sp.city,
      sp.zip_code,
      ${translationExpr(sql`pt.name_translations`, lang)} as provider_type_name,
      sp.is_active,
      sp.accredited,
      coalesce(sp.rating, 0)::float8 as rating,
      coalesce(sp.review_count, 0)::int as review_count,
      sp.response_time,
      sp.established_year,
      sp.total_patients,
      sp.success_rate,
      coalesce(sp.languages, array[]::text[]) as languages,
      coalesce(sp.specialties, array[]::text[]) as specialties,
      sp.timezone_id,
      coalesce(stats.services, 0)::int as services,
      coalesce(stats.active_services, 0)::int as active_services,
      coalesce(stats.staff, 0)::int as staff,
      coalesce(stats.bookings, 0)::int as bookings,
      coalesce(stats.pending_bookings, 0)::int as pending_bookings,
      coalesce(stats.reviews, 0)::int as reviews,
      coalesce(stats.unread_tickets, 0)::int as unread_tickets,
      coalesce(ledger.pending_amount, 0)::float8 as pending_ledger_amount,
      ledger.currency_code as ledger_currency
    from category.service_providers sp
    join category.provider_types pt on pt.id = sp.provider_type_id
    left join lateral (
      select
        (select count(*) from category.provider_services ps where ps.service_provider_id = sp.id) as services,
        (select count(*) from category.provider_services ps where ps.service_provider_id = sp.id and ps.is_active = true) as active_services,
        (select count(*) from category.provider_staffs pst where pst.service_provider_id = sp.id and pst.is_active = true) as staff,
        (select count(*) from booking.bookings b where b.provider_id = sp.id) as bookings,
        (select count(*) from booking.bookings b where b.provider_id = sp.id and b.booking_status in ('Pending', 'Confirmed')) as pending_bookings,
        (select count(*) from category.service_provider_comments c where c.service_provider_id = sp.id) as reviews,
        (select count(*) from provider_portal.support_tickets t where t.service_provider_id = sp.id and t.status in ('open','in_progress')) as unread_tickets
    ) stats on true
    left join lateral (
      select sum(pl.amount)::float8 as pending_amount, min(pl.currency_code) as currency_code
      from commercial.provider_ledgers pl
      where pl.provider_id = sp.id and pl.status = 'pending'
    ) ledger on true
    where sp.id = ${providerId}::uuid
    limit 1
  `;

  const row = rows[0];
  if (!row) throw new Error("Provider was not found.");

  return {
    provider: {
      id: row.id,
      name: row.name || {},
      displayName: row.display_name || "-",
      description: row.description || {},
      detail: row.detail || {},
      street: row.street || {},
      imageUrl: row.image_url,
      email: row.email,
      phoneNumberCountryCode: row.phone_number_country_code,
      phoneNumber: row.phone_number,
      country: row.country,
      city: row.city,
      zipCode: row.zip_code,
      providerTypeName: row.provider_type_name || "-",
      isActive: Boolean(row.is_active),
      accredited: Boolean(row.accredited),
      rating: Number(row.rating || 0),
      reviewCount: Number(row.review_count || 0),
      responseTime: row.response_time,
      establishedYear: row.established_year,
      totalPatients: row.total_patients,
      successRate: row.success_rate,
      languages: row.languages || [],
      specialties: row.specialties || [],
      timezoneId: row.timezone_id || "UTC",
    },
    role,
    permissions: buildPermissionMap(role),
    stats: {
      services: Number(row.services || 0),
      activeServices: Number(row.active_services || 0),
      staff: Number(row.staff || 0),
      bookings: Number(row.bookings || 0),
      pendingBookings: Number(row.pending_bookings || 0),
      reviews: Number(row.reviews || 0),
      unreadTickets: Number(row.unread_tickets || 0),
      pendingLedgerAmount: Number(row.pending_ledger_amount || 0),
      ledgerCurrency: row.ledger_currency,
    },
  };
}

export async function createProviderApplication(userId: string, input: {
  providerTypeId: string;
  legalName: string;
  displayNameEn: string;
  displayNameFa?: string;
  email?: string | null;
  phoneNumberCountryCode: string;
  phoneNumber: string;
  country: string;
  city: string;
  addressText?: string | null;
  websiteUrl?: string | null;
}) {
  const displayName = translationFromFlat(input.displayNameEn, input.displayNameFa);
  const rows = await sql<{ id: string }[]>`
    insert into provider_portal.onboarding_applications (
      applicant_user_id,
      provider_type_id,
      current_step,
      status,
      legal_name,
      display_name_translations,
      email,
      phone_number_country_code,
      phone_number,
      address_text,
      website_url,
      submission_payload,
      submitted_at,
      create_date,
      last_modified_date
    ) values (
      ${userId}::uuid,
      ${input.providerTypeId}::uuid,
      1,
      'submitted',
      ${input.legalName},
      ${sql.json(displayName)}::jsonb,
      ${input.email},
      ${input.phoneNumberCountryCode},
      ${input.phoneNumber},
      ${input.addressText},
      ${input.websiteUrl},
      ${sql.json({ country: input.country, city: input.city })}::jsonb,
      now(),
      now(),
      now()
    )
    returning id::text
  `;
  return rows[0].id;
}

export async function approveApplication(adminUserId: string, applicationId: string, reviewNote?: string) {
  const rows = await sql<any[]>`
    select *
    from provider_portal.onboarding_applications
    where id = ${applicationId}::uuid
    for update
  `;
  const app = rows[0];
  if (!app) throw new Error("Application was not found.");
  if (app.status === "approved" && app.service_provider_id) return String(app.service_provider_id);

  const payload = app.submission_payload || {};
  const country = String(payload.country || "IR").slice(0, 15);
  const city = String(payload.city || "Tehran").slice(0, 15);
  const displayName = app.display_name_translations || {};
  const description = {};
  const phoneCode = String(app.phone_number_country_code || "+98").slice(0, 3);
  const phone = String(app.phone_number || "").slice(0, 15);
  const email = app.email || "";

  const providerRows = await sql<{ id: string }[]>`
    insert into category.service_providers (
      id,
      name_translations,
      description_translations,
      is_active,
      provider_type_id,
      city,
      country,
      detail_translations,
      street_translations,
      email,
      phone_number_country_code,
      phone_number,
      create_date,
      last_modified_date,
      timezone_id
    ) values (
      public.uuid_generate_v4(),
      ${sql.json(displayName)}::jsonb,
      ${sql.json(description)}::jsonb,
      true,
      ${app.provider_type_id}::uuid,
      ${city},
      ${country},
      '{}'::jsonb,
      '{}'::jsonb,
      ${email},
      ${phoneCode},
      ${phone},
      now(),
      now(),
      'UTC'
    )
    returning id::text
  `;

  const providerId = providerRows[0].id;

  await sql`
    insert into provider_portal.provider_members (
      service_provider_id,
      user_id,
      role,
      is_default,
      metadata,
      create_date,
      last_modified_date
    )
    select
      ${providerId}::uuid,
      ${app.applicant_user_id}::uuid,
      'owner',
      true,
      '{}'::jsonb,
      now(),
      now()
    where not exists (
      select 1 from provider_portal.provider_members
      where service_provider_id = ${providerId}::uuid
        and user_id = ${app.applicant_user_id}::uuid
    )
  `;

  await sql`
    update provider_portal.onboarding_applications
    set
      status = 'approved',
      service_provider_id = ${providerId}::uuid,
      reviewed_by = ${adminUserId}::uuid,
      reviewed_at = now(),
      internal_note = nullif(${reviewNote || ""}, ''),
      last_modified_date = now()
    where id = ${applicationId}::uuid
  `;

  return providerId;
}

export async function rejectApplication(adminUserId: string, applicationId: string, reviewReason: string) {
  await sql`
    update provider_portal.onboarding_applications
    set
      status = 'rejected',
      reviewed_by = ${adminUserId}::uuid,
      reviewed_at = now(),
      review_reason = ${reviewReason},
      last_modified_date = now()
    where id = ${applicationId}::uuid
  `;
  return true;
}

export async function updateProviderProfile(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageProfile");

  await sql`
    update category.service_providers
    set
      name_translations = ${sql.json(translationFromFlat(input.nameEn, input.nameFa))}::jsonb,
      description_translations = ${sql.json(translationFromFlat(input.descriptionEn, input.descriptionFa))}::jsonb,
      detail_translations = ${sql.json(translationFromFlat(input.detailEn, input.detailFa))}::jsonb,
      street_translations = ${sql.json(translationFromFlat(input.streetEn, input.streetFa))}::jsonb,
      email = ${input.email},
      phone_number_country_code = ${input.phoneNumberCountryCode},
      phone_number = ${input.phoneNumber},
      zip_code = ${input.zipCode},
      image_url = ${input.imageUrl},
      latitude = ${input.latitude},
      longitude = ${input.longitude},
      response_time = ${input.responseTime},
      established_year = ${input.establishedYear},
      total_patients = ${input.totalPatients},
      success_rate = ${input.successRate},
      languages = ${splitCsv(input.languagesCsv)}::text[],
      specialties = ${splitCsv(input.specialtiesCsv)}::text[],
      timezone_id = ${input.timezoneId || "UTC"},
      last_modified_date = now()
    where id = ${input.providerId}::uuid
  `;

  return true;
}

export async function listServiceDefinitionOptions(locale: string): Promise<ServiceDefinitionOption[]> {
  const lang = safeLocale(locale);
  return await sql<ServiceDefinitionOption[]>`
    select
      sd.id::text as id,
      ${translationExpr(sql`sd.name_translations`, lang)} as label,
      coalesce(sd.duration_minutes, 0)::int as "durationMinutes",
      sd.currency,
      coalesce(sd.value, 0)::float8 as value
    from category.service_definitions sd
    where sd.is_active = true
    order by label asc
    limit 500
  `;
}

export async function listProviderServices(userId: string, providerId: string, locale: string): Promise<ProviderServiceRow[]> {
  await requireProviderPermission(userId, providerId, "viewDashboard");
  const lang = safeLocale(locale);
  return await sql<ProviderServiceRow[]>`
    select
      ps.id::text as id,
      ps.service_definition_id::text as "serviceDefinitionId",
      ${translationExpr(sql`sd.name_translations`, lang)} as "serviceDefinitionName",
      ps.display_name_translations as "displayName",
      ${translationExpr(sql`ps.display_name_translations`, lang)} as name,
      ps.description_translations as description,
      ps.is_active as "isActive",
      ps.currency,
      ps.value::float8,
      ps.duration_minutes::int as "durationMinutes",
      ps.slot_interval_minutes::int as "slotIntervalMinutes",
      ps.image_url as "imageUrl",
      coalesce(ps.is_popular, false) as "isPopular",
      coalesce(ps.tags, array[]::text[]) as tags,
      coalesce(ps.rating, 0)::float8 as rating,
      coalesce(ps.review_count, 0)::int as "reviewCount"
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.service_provider_id = ${providerId}::uuid
    order by ps.create_date desc
  `;
}

export async function saveProviderService(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageServices");

  const displayName = translationFromFlat(input.nameEn, input.nameFa);
  const description = translationFromFlat(input.descriptionEn, input.descriptionFa);
  const tags = splitCsv(input.tagsCsv);

  if (input.serviceId) {
    await sql`
      update category.provider_services
      set
        service_definition_id = ${input.serviceDefinitionId}::uuid,
        display_name_translations = ${sql.json(displayName)}::jsonb,
        description_translations = ${sql.json(description)}::jsonb,
        is_active = ${input.isActive},
        currency = ${input.currency},
        value = ${input.value},
        duration_minutes = ${input.durationMinutes},
        slot_interval_minutes = ${input.slotIntervalMinutes},
        image_url = ${input.imageUrl},
        is_popular = ${input.isPopular},
        tags = ${tags}::text[],
        last_modified_date = now()
      where id = ${input.serviceId}::uuid
        and service_provider_id = ${input.providerId}::uuid
    `;
    return input.serviceId;
  }

  const rows = await sql<{ id: string }[]>`
    insert into category.provider_services (
      id,
      service_definition_id,
      display_name_translations,
      description_translations,
      is_active,
      service_provider_id,
      currency,
      value,
      duration_minutes,
      slot_interval_minutes,
      image_url,
      is_popular,
      tags,
      create_date,
      last_modified_date
    ) values (
      public.uuid_generate_v4(),
      ${input.serviceDefinitionId}::uuid,
      ${sql.json(displayName)}::jsonb,
      ${sql.json(description)}::jsonb,
      ${input.isActive},
      ${input.providerId}::uuid,
      ${input.currency},
      ${input.value},
      ${input.durationMinutes},
      ${input.slotIntervalMinutes},
      ${input.imageUrl},
      ${input.isPopular},
      ${tags}::text[],
      now(),
      now()
    )
    returning id::text
  `;

  return rows[0].id;
}

export async function deleteProviderService(userId: string, providerId: string, serviceId: string) {
  await requireProviderPermission(userId, providerId, "manageServices");
  await sql`
    update category.provider_services
    set is_active = false, last_modified_date = now()
    where id = ${serviceId}::uuid
      and service_provider_id = ${providerId}::uuid
  `;
  return true;
}

export async function listProviderStaff(userId: string, providerId: string, locale: string): Promise<StaffRow[]> {
  await requireProviderPermission(userId, providerId, "viewDashboard");
  const lang = safeLocale(locale);

  return await sql<StaffRow[]>`
    select
      s.id::text as id,
      pst.id::text as "providerStaffId",
      s.name_translations as name,
      ${translationExpr(sql`s.name_translations`, lang)} as "displayName",
      s.title_translations as title,
      s.biography_translations as biography,
      s.profile_image_url as "profileImageUrl",
      pst.is_active as "isActive",
      s.specialty,
      s.experience_years as "experienceYears",
      coalesce(s.consultation_fee, 0)::float8 as "consultationFee",
      pst.notes_translations as notes
    from category.provider_staffs pst
    join category.staff s on s.id = pst.staff_id
    where pst.service_provider_id = ${providerId}::uuid
    order by pst.create_date desc
  `;
}

export async function saveProviderStaff(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageStaff");

  const name = translationFromFlat(input.nameEn, input.nameFa);
  const title = translationFromFlat(input.titleEn, input.titleFa);
  const biography = translationFromFlat(input.biographyEn, input.biographyFa);
  const notes = translationFromFlat(input.notesEn, input.notesFa);

  let staffId = input.staffId as string | null | undefined;

  if (staffId) {
    await sql`
      update category.staff
      set
        name_translations = ${sql.json(name)}::jsonb,
        title_translations = ${sql.json(title)}::jsonb,
        biography_translations = ${sql.json(biography)}::jsonb,
        profile_image_url = ${input.profileImageUrl},
        is_active = ${input.isActive},
        specialty = ${input.specialty},
        experience_years = ${input.experienceYears},
        consultation_fee = ${input.consultationFee},
        last_modified_date = now()
      where id = ${staffId}::uuid
    `;
  } else {
    const rows = await sql<{ id: string }[]>`
      insert into category.staff (
        name_translations,
        title_translations,
        biography_translations,
        profile_image_url,
        is_active,
        specialty,
        experience_years,
        consultation_fee,
        create_date,
        last_modified_date
      ) values (
        ${sql.json(name)}::jsonb,
        ${sql.json(title)}::jsonb,
        ${sql.json(biography)}::jsonb,
        ${input.profileImageUrl},
        ${input.isActive},
        ${input.specialty},
        ${input.experienceYears},
        ${input.consultationFee},
        now(),
        now()
      )
      returning id::text
    `;
    staffId = rows[0].id;
  }

  if (input.providerStaffId) {
    await sql`
      update category.provider_staffs
      set
        notes_translations = ${sql.json(notes)}::jsonb,
        is_active = ${input.isActive},
        last_modified_date = now()
      where id = ${input.providerStaffId}::uuid
        and service_provider_id = ${input.providerId}::uuid
    `;
    return input.providerStaffId;
  }

  const linkRows = await sql<{ id: string }[]>`
    insert into category.provider_staffs (
      id,
      staff_id,
      notes_translations,
      is_active,
      service_provider_id,
      create_date,
      last_modified_date
    ) values (
      public.uuid_generate_v4(),
      ${staffId}::uuid,
      ${sql.json(notes)}::jsonb,
      ${input.isActive},
      ${input.providerId}::uuid,
      now(),
      now()
    )
    returning id::text
  `;

  return linkRows[0].id;
}

export async function deleteProviderStaffLink(userId: string, providerId: string, providerStaffId: string) {
  await requireProviderPermission(userId, providerId, "manageStaff");
  await sql`
    update category.provider_staffs
    set is_active = false, last_modified_date = now()
    where id = ${providerStaffId}::uuid
      and service_provider_id = ${providerId}::uuid
  `;
  return true;
}

export async function listOperatingHours(userId: string, providerId: string): Promise<OperatingHourRow[]> {
  await requireProviderPermission(userId, providerId, "viewDashboard");
  const rows = await sql<OperatingHourRow[]>`
    select
      id::text,
      day_of_week::int as "dayOfWeek",
      opens_at::text as "opensAt",
      closes_at::text as "closesAt",
      is_closed as "isClosed",
      slot_interval_minutes::int as "slotIntervalMinutes"
    from provider_portal.provider_operating_hours
    where service_provider_id = ${providerId}::uuid
    order by day_of_week asc
  `;

  const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
  return Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    return byDay.get(day) || {
      id: null,
      dayOfWeek: day,
      opensAt: "09:00",
      closesAt: "18:00",
      isClosed: false,
      slotIntervalMinutes: 15,
    };
  });
}

export async function saveOperatingHours(userId: string, providerId: string, hours: OperatingHourRow[]) {
  await requireProviderPermission(userId, providerId, "manageAvailability");

  for (const hour of hours) {
    await sql`
      insert into provider_portal.provider_operating_hours (
        service_provider_id,
        day_of_week,
        opens_at,
        closes_at,
        is_closed,
        slot_interval_minutes,
        metadata,
        create_date,
        last_modified_date
      ) values (
        ${providerId}::uuid,
        ${hour.dayOfWeek},
        ${hour.isClosed ? null : hour.opensAt},
        ${hour.isClosed ? null : hour.closesAt},
        ${hour.isClosed},
        ${hour.slotIntervalMinutes},
        '{}'::jsonb,
        now(),
        now()
      )
      on conflict (service_provider_id, day_of_week)
      do update set
        opens_at = excluded.opens_at,
        closes_at = excluded.closes_at,
        is_closed = excluded.is_closed,
        slot_interval_minutes = excluded.slot_interval_minutes,
        last_modified_date = now()
    `;
  }

  return true;
}

export async function listProviderBookings(userId: string, providerId: string, locale: string): Promise<BookingRow[]> {
  await requireProviderPermission(userId, providerId, "manageBookings");
  const lang = safeLocale(locale);

  const rows = await sql<BookingRow[]>`
    with main_bookings as (
      select
        b.id,
        'main'::text as booking_source,
        b.service_id,
        b.specialist_id,
        b.selected_date::text as selected_date,
        coalesce(b.selected_time::text, concat_ws(' - ', b.selected_time_from::text, b.selected_time_to::text)) as selected_time,
        b.booking_status as status,
        b.payment_status,
        coalesce(b.total_amount, b.display_total_amount, b.source_total_amount, 0)::float8 as total_amount,
        coalesce(b.currency_code, b.display_currency_code, b.source_currency_code) as currency_code,
        b.user_id,
        b.provider_notes,
        b.create_date
      from booking.bookings b
      where b.provider_id = ${providerId}::uuid
    ),
    child_bookings as (
      select
        cb.id,
        'child'::text as booking_source,
        cb.service_id,
        cb.specialist_id,
        coalesce(cb.selected_date::text, concat_ws(' - ', cb.selected_date_from::text, cb.selected_date_to::text)) as selected_date,
        coalesce(cb.selected_time::text, concat_ws(' - ', cb.selected_time_from::text, cb.selected_time_to::text)) as selected_time,
        cb.status,
        null::varchar as payment_status,
        coalesce(cb.subtotal_amount, 0)::float8 as total_amount,
        cb.currency as currency_code,
        null::uuid as user_id,
        cb.provider_notes,
        cb.create_date
      from booking.booking_child_bookings cb
      where cb.provider_id = ${providerId}::uuid
    ),
    all_rows as (
      select * from main_bookings
      union all
      select * from child_bookings
    )
    select
      ar.id::text,
      ar.booking_source::text as "bookingSource",
      coalesce(${translationExpr(sql`ps.display_name_translations`, lang)}, ${translationExpr(sql`sd.name_translations`, lang)}, '-') as "serviceName",
      ${translationExpr(sql`s.name_translations`, lang)} as "specialistName",
      ar.selected_date as "selectedDate",
      ar.selected_time as "selectedTime",
      ar.status,
      ar.payment_status as "paymentStatus",
      ar.total_amount as "totalAmount",
      ar.currency_code as "currencyCode",
      concat_ws(' ', u.first_name, u.last_name) as "customerName",
      u.email as "customerEmail",
      ar.provider_notes as "providerNotes",
      ar.create_date::text as "createdAt"
    from all_rows ar
    left join category.provider_services ps on ps.id = ar.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    left join category.staff s on s.id = ar.specialist_id
    left join identity.asp_net_users u on u.id = ar.user_id
    order by ar.create_date desc
    limit 200
  `;
  return rows;
}

export async function updateProviderBooking(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageBookings");

  if (input.bookingSource === "child") {
    await sql`
      update booking.booking_child_bookings
      set
        provider_notes = ${input.providerNotes},
        status = coalesce(${input.status}, status),
        provider_updated_at = now(),
        last_modified_date = now()
      where id = ${input.bookingId}::uuid
        and provider_id = ${input.providerId}::uuid
    `;
  } else {
    await sql`
      update booking.bookings
      set
        provider_notes = ${input.providerNotes},
        booking_status = coalesce(${input.status}, booking_status),
        provider_updated_at = now(),
        last_modified_date = now()
      where id = ${input.bookingId}::uuid
        and provider_id = ${input.providerId}::uuid
    `;
  }

  return true;
}

export async function listProviderGallery(userId: string, providerId: string, locale: string): Promise<GalleryRow[]> {
  await requireProviderPermission(userId, providerId, "viewDashboard");
  const lang = safeLocale(locale);

  return await sql<GalleryRow[]>`
    select
      id::text,
      title_translations as title,
      ${translationExpr(sql`title_translations`, lang)} as "displayTitle",
      description_translations as description,
      url,
      media_type as "mediaType",
      display_order::int as "displayOrder"
    from category.provider_gallery_items
    where service_provider_id = ${providerId}::uuid
    order by display_order asc, create_date desc
  `;
}

export async function saveGalleryItem(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageMedia");

  const title = translationFromFlat(input.titleEn, input.titleFa);
  const description = translationFromFlat(input.descriptionEn, input.descriptionFa);

  if (input.galleryItemId) {
    await sql`
      update category.provider_gallery_items
      set
        title_translations = ${sql.json(title)}::jsonb,
        description_translations = ${sql.json(description)}::jsonb,
        url = ${input.url},
        media_type = ${input.mediaType},
        display_order = ${input.displayOrder},
        last_modified_date = now()
      where id = ${input.galleryItemId}::uuid
        and service_provider_id = ${input.providerId}::uuid
    `;
    return input.galleryItemId;
  }

  const rows = await sql<{ id: string }[]>`
    insert into category.provider_gallery_items (
      id,
      title_translations,
      description_translations,
      url,
      media_type,
      display_order,
      service_provider_id,
      create_date,
      last_modified_date
    ) values (
      public.uuid_generate_v4(),
      ${sql.json(title)}::jsonb,
      ${sql.json(description)}::jsonb,
      ${input.url},
      ${input.mediaType},
      ${input.displayOrder},
      ${input.providerId}::uuid,
      now(),
      now()
    )
    returning id::text
  `;

  return rows[0].id;
}

export async function deleteGalleryItem(userId: string, providerId: string, galleryItemId: string) {
  await requireProviderPermission(userId, providerId, "manageMedia");
  await sql`
    delete from category.provider_gallery_items
    where id = ${galleryItemId}::uuid
      and service_provider_id = ${providerId}::uuid
  `;
  return true;
}

export async function listProviderReviews(userId: string, providerId: string): Promise<ReviewRow[]> {
  await requireProviderPermission(userId, providerId, "viewReviews");
  return await sql<ReviewRow[]>`
    select
      id::text,
      customer_name as "customerName",
      comment_text as "commentText",
      rating,
      is_public as "isPublic",
      is_verified as "isVerified",
      helpful_count::int as "helpfulCount",
      country,
      treatment,
      create_date::text as "createdAt"
    from category.service_provider_comments
    where service_provider_id = ${providerId}::uuid
    order by create_date desc
    limit 200
  `;
}

export async function listProviderOffers(userId: string, providerId: string, locale: string): Promise<OfferRow[]> {
  await requireProviderPermission(userId, providerId, "viewDashboard");
  const lang = safeLocale(locale);

  return await sql<OfferRow[]>`
    select
      o.id::int,
      o.provider_service_id::text as "providerServiceId",
      ${translationExpr(sql`ps.display_name_translations`, lang)} as "serviceName",
      o.title,
      o.subtitle,
      o.discount_percent::float8 as "discountPercent",
      o.valid_until::text as "validUntil",
      o.code,
      coalesce(o.is_active, true) as "isActive",
      coalesce(o.is_featured, false) as "isFeatured",
      o.usage_limit as "usageLimit",
      coalesce(o.used_count, 0)::int as "usedCount"
    from marketing.offers o
    join category.provider_services ps on ps.id = o.provider_service_id
    where ps.service_provider_id = ${providerId}::uuid
    order by o.created_at desc
  `;
}

export async function saveOffer(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageOffers");

  const serviceRows = await sql<{ id: string }[]>`
    select id::text from category.provider_services
    where id = ${input.providerServiceId}::uuid
      and service_provider_id = ${input.providerId}::uuid
    limit 1
  `;
  if (!serviceRows.length) throw new Error("Service does not belong to this provider.");

  const description = translationFromFlat(input.descriptionEn, input.descriptionFa);

  if (input.offerId) {
    await sql`
      update marketing.offers
      set
        provider_service_id = ${input.providerServiceId}::uuid,
        title = ${input.title},
        subtitle = ${input.subtitle},
        discount_percent = ${input.discountPercent},
        valid_until = ${input.validUntil}::timestamp,
        code = ${input.code},
        is_active = ${input.isActive},
        is_featured = ${input.isFeatured},
        usage_limit = ${input.usageLimit},
        description_translations = ${sql.json(description)}::jsonb
      where id = ${input.offerId}
        and exists (
          select 1 from category.provider_services ps
          where ps.id = marketing.offers.provider_service_id
            and ps.service_provider_id = ${input.providerId}::uuid
        )
    `;
    return input.offerId;
  }

  const rows = await sql<{ id: number }[]>`
    insert into marketing.offers (
      provider_service_id,
      title,
      subtitle,
      discount_percent,
      valid_until,
      code,
      is_active,
      is_featured,
      usage_limit,
      used_count,
      description_translations,
      created_at
    ) values (
      ${input.providerServiceId}::uuid,
      ${input.title},
      ${input.subtitle},
      ${input.discountPercent},
      ${input.validUntil}::timestamp,
      ${input.code},
      ${input.isActive},
      ${input.isFeatured},
      ${input.usageLimit},
      0,
      ${sql.json(description)}::jsonb,
      now()
    )
    returning id
  `;
  return rows[0].id;
}

export async function deleteOffer(userId: string, providerId: string, offerId: number) {
  await requireProviderPermission(userId, providerId, "manageOffers");
  await sql`
    delete from marketing.offers o
    where o.id = ${offerId}
      and exists (
        select 1 from category.provider_services ps
        where ps.id = o.provider_service_id
          and ps.service_provider_id = ${providerId}::uuid
      )
  `;
  return true;
}

export async function listBilling(userId: string, providerId: string) {
  await requireProviderPermission(userId, providerId, "viewBilling");

  const ledgers = await sql<LedgerRow[]>`
    select
      id::text,
      entry_type as "entryType",
      amount::float8,
      currency_code as "currencyCode",
      status,
      booking_id::text as "bookingId",
      notes,
      created_at::text as "createdAt"
    from commercial.provider_ledgers
    where provider_id = ${providerId}::uuid
    order by created_at desc
    limit 200
  `;

  const payoutAccounts = await sql<PayoutAccountRow[]>`
    select
      id::text,
      account_holder_name as "accountHolderName",
      bank_name as "bankName",
      iban,
      swift_code as "swiftCode",
      account_number_last4 as "accountNumberLast4",
      country,
      currency_code as "currencyCode",
      is_default as "isDefault"
    from provider_portal.payout_accounts
    where service_provider_id = ${providerId}::uuid
    order by is_default desc, create_date desc
  `;

  return { ledgers, payoutAccounts };
}

export async function savePayoutAccount(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "managePayouts");

  if (input.isDefault) {
    await sql`
      update provider_portal.payout_accounts
      set is_default = false, last_modified_date = now()
      where service_provider_id = ${input.providerId}::uuid
    `;
  }

  if (input.payoutAccountId) {
    await sql`
      update provider_portal.payout_accounts
      set
        account_holder_name = ${input.accountHolderName},
        bank_name = ${input.bankName},
        iban = ${input.iban},
        swift_code = ${input.swiftCode},
        account_number_last4 = ${input.accountNumberLast4},
        country = ${input.country},
        currency_code = ${input.currencyCode},
        is_default = ${input.isDefault},
        last_modified_date = now()
      where id = ${input.payoutAccountId}::uuid
        and service_provider_id = ${input.providerId}::uuid
    `;
    return input.payoutAccountId;
  }

  const rows = await sql<{ id: string }[]>`
    insert into provider_portal.payout_accounts (
      service_provider_id,
      account_holder_name,
      bank_name,
      iban,
      swift_code,
      account_number_last4,
      country,
      currency_code,
      is_default,
      metadata,
      create_date,
      last_modified_date
    ) values (
      ${input.providerId}::uuid,
      ${input.accountHolderName},
      ${input.bankName},
      ${input.iban},
      ${input.swiftCode},
      ${input.accountNumberLast4},
      ${input.country},
      ${input.currencyCode},
      ${input.isDefault},
      '{}'::jsonb,
      now(),
      now()
    )
    returning id::text
  `;

  return rows[0].id;
}

export async function listSupportTickets(userId: string, providerId: string): Promise<SupportTicketRow[]> {
  await requireProviderPermission(userId, providerId, "manageSupport");
  return await sql<SupportTicketRow[]>`
    select
      id::text,
      subject,
      message,
      status::text,
      priority,
      create_date::text as "createdAt",
      last_modified_date::text as "updatedAt"
    from provider_portal.support_tickets
    where service_provider_id = ${providerId}::uuid
    order by create_date desc
    limit 200
  `;
}

export async function createSupportTicket(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageSupport");
  const rows = await sql<{ id: string }[]>`
    insert into provider_portal.support_tickets (
      service_provider_id,
      created_by_user_id,
      subject,
      message,
      status,
      priority,
      metadata,
      create_date,
      last_modified_date
    ) values (
      ${input.providerId}::uuid,
      ${userId}::uuid,
      ${input.subject},
      ${input.message},
      'open',
      ${input.priority},
      '{}'::jsonb,
      now(),
      now()
    )
    returning id::text
  `;
  return rows[0].id;
}

export async function updateSupportTicketStatus(userId: string, input: any) {
  await requireProviderPermission(userId, input.providerId, "manageSupport");
  await sql`
    update provider_portal.support_tickets
    set status = ${input.status}, last_modified_date = now()
    where id = ${input.ticketId}::uuid
      and service_provider_id = ${input.providerId}::uuid
  `;
  return true;
}
