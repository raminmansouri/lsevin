import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import { normalizeOptionSearchLimit, normalizeOptionSearchQuery } from "@core/lib/optionSearch";
import type {
  AdminApplicationSummary,
  ApplicationReviewEvent,
  ExistingProviderOption,
  ProviderApplication,
  ProviderTypeOption,
} from "./types";

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";

export async function listProviderTypes(locale = DEFAULT_LOCALE) {
  return sql<ProviderTypeOption[]>`
    select id::text as id,
      ${translationSql(sql`name_translations`, locale)} as label,
      ${translationSql(sql`description_translations`, locale)} as description
    from category.provider_types
    where is_active = true
    order by label asc
  `;
}

export async function listMyApplications(userId: string, locale = DEFAULT_LOCALE) {
  return sql<ProviderApplication[]>`
    select
      app.id::text as id,
      app.application_number as "applicationNumber",
      app.provider_type_id::text as "providerTypeId",
      coalesce(${translationSql(sql`pt.name_translations`, locale)}, '[Missing provider type]') as "providerTypeName",
      (pt.id is not null) as "providerTypeExists",
      app.legal_name as "legalName",
      ${translationSql(sql`app.display_name_translations`, locale)} as "displayName",
      app.status::text as status,
      app.review_reason as "reviewReason",
      app.create_date::text as "createdAt",
      app.submitted_at::text as "submittedAt",
      app.reviewed_at::text as "reviewedAt",
      app.service_provider_id::text as "serviceProviderId"
    from provider_portal.onboarding_applications app
    left join category.provider_types pt on pt.id = app.provider_type_id
    where app.applicant_user_id = ${userId}::uuid
    order by app.create_date desc
  `;
}

export async function createApplication(input: {
  userId: string;
  providerTypeId: string;
  legalName: string;
  displayNameTranslations: Record<string, string>;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  addressText: string;
  websiteUrl?: string;
  submissionPayload?: Record<string, unknown>;
}) {
  const rows = await sql<{ id: string }[]>`
    insert into provider_portal.onboarding_applications (
      applicant_user_id, provider_type_id, legal_name, display_name_translations,
      email, phone_number_country_code, phone_number, address_text, website_url,
      submission_payload, status, submitted_at
    ) values (
      ${input.userId}::uuid, ${input.providerTypeId}::uuid, ${input.legalName}, ${sql.json(input.displayNameTranslations)},
      ${input.email}, ${input.phoneCountryCode}, ${input.phoneNumber}, ${input.addressText}, ${input.websiteUrl || null},
      ${sql.json(input.submissionPayload ?? {})}, 'submitted', now()
    ) returning id::text
  `;
  return rows[0].id;
}

export async function getAdminApplicationSummary(): Promise<AdminApplicationSummary> {
  const rows = await sql<AdminApplicationSummary[]>`
    select
      count(*)::int as total,
      count(*) filter (where app.status = 'submitted')::int as submitted,
      count(*) filter (where app.status = 'in_review')::int as "inReview",
      count(*) filter (where app.status = 'approved')::int as approved,
      count(*) filter (where app.status = 'rejected')::int as rejected,
      count(*) filter (where pt.id is null)::int as "orphanedProviderTypes"
    from provider_portal.onboarding_applications app
    left join category.provider_types pt on pt.id = app.provider_type_id
  `;
  return rows[0] ?? { total: 0, submitted: 0, inReview: 0, approved: 0, rejected: 0, orphanedProviderTypes: 0 };
}

export async function listAdminApplications(input: { status?: string; query?: string; limit?: number } = {}, locale = DEFAULT_LOCALE) {
  const status = input.status?.trim() || "";
  const query = input.query?.trim() || "";
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 500);
  return sql<ProviderApplication[]>`
    select
      app.id::text as id,
      app.application_number as "applicationNumber",
      app.provider_type_id::text as "providerTypeId",
      coalesce(${translationSql(sql`pt.name_translations`, locale)}, '[Missing provider type]') as "providerTypeName",
      (pt.id is not null) as "providerTypeExists",
      app.applicant_user_id::text as "applicantUserId",
      trim(concat_ws(' ', u.first_name, u.last_name)) as "applicantName",
      u.email as "applicantEmail",
      app.legal_name as "legalName",
      ${translationSql(sql`app.display_name_translations`, locale)} as "displayName",
      app.email,
      concat_ws(' ', app.phone_number_country_code, app.phone_number) as phone,
      app.status::text as status,
      app.review_reason as "reviewReason",
      app.internal_note as "internalNote",
      app.create_date::text as "createdAt",
      app.submitted_at::text as "submittedAt",
      app.reviewed_at::text as "reviewedAt",
      app.service_provider_id::text as "serviceProviderId"
    from provider_portal.onboarding_applications app
    left join category.provider_types pt on pt.id = app.provider_type_id
    left join identity.asp_net_users u on u.id = app.applicant_user_id
    where (${status} = '' or app.status::text = ${status})
      and (
        ${query} = ''
        or coalesce(app.application_number, '') ilike '%' || ${query} || '%'
        or coalesce(app.legal_name, '') ilike '%' || ${query} || '%'
        or coalesce(app.email, '') ilike '%' || ${query} || '%'
        or coalesce(u.email, '') ilike '%' || ${query} || '%'
        or coalesce(u.first_name, '') ilike '%' || ${query} || '%'
        or coalesce(u.last_name, '') ilike '%' || ${query} || '%'
      )
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
    limit ${limit}
  `;
}

export async function getAdminApplication(applicationId: string, locale = DEFAULT_LOCALE) {
  const rows = await sql<ProviderApplication[]>`
    select
      app.id::text as id,
      app.application_number as "applicationNumber",
      app.provider_type_id::text as "providerTypeId",
      coalesce(${translationSql(sql`pt.name_translations`, locale)}, '[Missing provider type]') as "providerTypeName",
      (pt.id is not null) as "providerTypeExists",
      app.applicant_user_id::text as "applicantUserId",
      trim(concat_ws(' ', u.first_name, u.last_name)) as "applicantName",
      u.email as "applicantEmail",
      app.legal_name as "legalName",
      ${translationSql(sql`app.display_name_translations`, locale)} as "displayName",
      app.email,
      concat_ws(' ', app.phone_number_country_code, app.phone_number) as phone,
      app.status::text as status,
      app.review_reason as "reviewReason",
      app.internal_note as "internalNote",
      app.create_date::text as "createdAt",
      app.submitted_at::text as "submittedAt",
      app.reviewed_at::text as "reviewedAt",
      app.service_provider_id::text as "serviceProviderId",
      app.submission_payload as "submissionPayload"
    from provider_portal.onboarding_applications app
    left join category.provider_types pt on pt.id = app.provider_type_id
    left join identity.asp_net_users u on u.id = app.applicant_user_id
    where app.id = ${applicationId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function listExistingProviders(locale = DEFAULT_LOCALE): Promise<ExistingProviderOption[]> {
  return sql<ExistingProviderOption[]>`
    select
      sp.id::text as id,
      coalesce(${translationSql(sql`sp.name_translations`, locale)}, sp.email, sp.id::text) as label,
      sp.provider_type_id::text as "providerTypeId",
      sp.is_active as "isActive"
    from category.service_providers sp
    order by label asc
    limit 500
  `;
}

export async function listApplicationReviewEvents(applicationId: string): Promise<ApplicationReviewEvent[]> {
  try {
    return await sql<ApplicationReviewEvent[]>`
      select
        r.id::text as id,
        r.action,
        r.previous_status as "previousStatus",
        r.new_status as "newStatus",
        r.reason,
        r.note,
        trim(concat_ws(' ', u.first_name, u.last_name)) as "reviewerName",
        r.service_provider_id::text as "serviceProviderId",
        r.created_at::text as "createdAt"
      from provider_portal.onboarding_application_reviews r
      left join identity.asp_net_users u on u.id = r.reviewer_user_id
      where r.application_id = ${applicationId}::uuid
      order by r.created_at desc
    `;
  } catch {
    return [];
  }
}

async function recordReview(tx: any, input: {
  applicationId: string;
  reviewerUserId: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason?: string;
  note?: string;
  serviceProviderId?: string | null;
}) {
  await tx`
    insert into provider_portal.onboarding_application_reviews (
      application_id, reviewer_user_id, action, previous_status, new_status,
      reason, note, service_provider_id
    ) values (
      ${input.applicationId}::uuid, ${input.reviewerUserId}::uuid, ${input.action},
      ${input.previousStatus}, ${input.newStatus}, nullif(${input.reason || ""}, ''),
      nullif(${input.note || ""}, ''), ${input.serviceProviderId || null}::uuid
    )
  `;
}

export async function markApplicationInReview(input: { applicationId: string; reviewerUserId: string; note?: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ status: string }[]>`
      select status::text as status
      from provider_portal.onboarding_applications
      where id = ${input.applicationId}::uuid
      for update
    `;
    const application = rows[0];
    if (!application) throw new Error("Application not found.");
    if (application.status === "approved" || application.status === "disabled") throw new Error("This application can no longer enter review.");
    await tx`
      update provider_portal.onboarding_applications
      set status = 'in_review', reviewed_by = ${input.reviewerUserId}::uuid,
          internal_note = nullif(${input.note || ""}, ''), last_modified_date = now()
      where id = ${input.applicationId}::uuid
    `;
    await recordReview(tx, {
      applicationId: input.applicationId,
      reviewerUserId: input.reviewerUserId,
      action: "opened",
      previousStatus: application.status,
      newStatus: "in_review",
      note: input.note,
    });
  });
}

export async function requestApplicationChanges(input: { applicationId: string; reviewerUserId: string; reason: string; note?: string }) {
  if (!input.reason.trim()) throw new Error("A customer-visible change request is required.");
  await sql.begin(async (tx) => {
    const rows = await tx<{ status: string }[]>`
      select status::text as status from provider_portal.onboarding_applications
      where id = ${input.applicationId}::uuid for update
    `;
    const application = rows[0];
    if (!application) throw new Error("Application not found.");
    if (application.status === "approved" || application.status === "disabled") throw new Error("This application can no longer be changed.");
    await tx`
      update provider_portal.onboarding_applications
      set status = 'in_review', review_reason = ${input.reason},
          internal_note = nullif(${input.note || ""}, ''), reviewed_by = ${input.reviewerUserId}::uuid,
          reviewed_at = now(), last_modified_date = now()
      where id = ${input.applicationId}::uuid
    `;
    await recordReview(tx, {
      applicationId: input.applicationId,
      reviewerUserId: input.reviewerUserId,
      action: "changes_requested",
      previousStatus: application.status,
      newStatus: "in_review",
      reason: input.reason,
      note: input.note,
    });
  });
}

export async function rejectApplication(input: { applicationId: string; reviewerUserId: string; reason: string; note?: string }) {
  if (!input.reason.trim()) throw new Error("A rejection reason is required.");
  await sql.begin(async (tx) => {
    const rows = await tx<{ status: string }[]>`
      select status::text as status from provider_portal.onboarding_applications
      where id = ${input.applicationId}::uuid for update
    `;
    const application = rows[0];
    if (!application) throw new Error("Application not found.");
    if (application.status === "approved") throw new Error("An approved application cannot be rejected.");
    await tx`
      update provider_portal.onboarding_applications
      set status = 'rejected', review_reason = ${input.reason},
          internal_note = nullif(${input.note || ""}, ''), reviewed_by = ${input.reviewerUserId}::uuid,
          reviewed_at = now(), last_modified_date = now()
      where id = ${input.applicationId}::uuid
    `;
    await recordReview(tx, {
      applicationId: input.applicationId,
      reviewerUserId: input.reviewerUserId,
      action: "rejected",
      previousStatus: application.status,
      newStatus: "rejected",
      reason: input.reason,
      note: input.note,
    });
  });
}

type ResolvedLocation = { id: string; code: string };

async function assertOnboardingApprovalSchema(tx: any) {
  const rows = await tx<{ reviewTable: string | null }[]>`
    select to_regclass('provider_portal.onboarding_application_reviews')::text as "reviewTable"
  `;
  if (!rows[0]?.reviewTable) {
    throw new Error("Missing relation provider_portal.onboarding_application_reviews. Publish the database migration container before approving applications.");
  }
}

async function resolveLocation(
  tx: any,
  input: string,
  locationTypeId: number,
  parentId?: string,
): Promise<ResolvedLocation | null> {
  const value = input.trim();
  if (!value) return null;
  const rows = await tx<ResolvedLocation[]>`
    select l.id::text as id, l.code::text as code
    from category.locations l
    where l.location_type_id = ${locationTypeId}
      and (${parentId || null}::uuid is null or l.parent_id = ${parentId || null}::uuid)
      and (
        lower(l.code::text) = lower(${value})
        or exists (
          select 1
          from jsonb_each_text(coalesce(l.value_translations, '{}'::jsonb)) translated
          where lower(translated.value) = lower(${value})
        )
      )
    order by case when lower(l.code::text) = lower(${value}) then 0 else 1 end, l.display_order nulls last
    limit 1
  `;
  return rows[0] ?? null;
}

function normalizedProviderTranslations(application: any) {
  const translations = application.display_name_translations && typeof application.display_name_translations === "object"
    ? application.display_name_translations as Record<string, unknown>
    : {};
  if (Object.values(translations).some((value) => typeof value === "string" && value.trim())) return translations;
  const fallback = String(application.legal_name || "Provider").trim() || "Provider";
  return { "fa-IR": fallback, "en-US": fallback };
}

export async function approveApplication(input: {
  applicationId: string;
  reviewerUserId: string;
  mode: "create" | "attach";
  existingProviderId?: string;
  country?: string;
  city?: string;
  timezoneId?: string;
  reviewNote?: string;
}) {
  return sql.begin(async (tx) => {
    const rows = await tx<any[]>`
      select app.*
      from provider_portal.onboarding_applications app
      where app.id = ${input.applicationId}::uuid
      for update
    `;
    const application = rows[0];
    if (!application) throw new Error("Application not found.");
    if (application.status === "approved" && application.service_provider_id) return String(application.service_provider_id);

    const providerTypeRows = await tx<{ exists: boolean }[]>`
      select exists (
        select 1
        from category.provider_types pt
        where pt.id = ${String(application.provider_type_id)}::uuid
      ) as exists
    `;
    if (!providerTypeRows[0]?.exists) throw new Error("The application references a missing provider type. Repair the provider type before approval.");
    await assertOnboardingApprovalSchema(tx);

    let providerId = input.existingProviderId?.trim() || "";
    let action = "approved_attached";
    let resolvedCountryId: string | null = null;
    let resolvedCityId: string | null = null;

    if (input.mode === "attach") {
      if (!providerId) throw new Error("Choose an existing provider to attach.");
      const providerRows = await tx<{ id: string; providerTypeId: string }[]>`
        select id::text as id, provider_type_id::text as "providerTypeId"
        from category.service_providers
        where id = ${providerId}::uuid
        limit 1
      `;
      if (!providerRows[0]) throw new Error("The selected provider does not exist.");
      if (providerRows[0].providerTypeId !== String(application.provider_type_id)) {
        throw new Error("The selected provider type does not match the application provider type.");
      }
    } else {
      const payload = (application.submission_payload && typeof application.submission_payload === "object")
        ? application.submission_payload as Record<string, unknown>
        : {};
      const countryInput = input.country?.trim() || String(payload.country || "").trim();
      const cityInput = input.city?.trim() || String(payload.city || "").trim();
      const notes = String(payload.notes || "").trim();
      if (!countryInput || !cityInput) throw new Error("Country and city are required when creating a provider.");

      const country = await resolveLocation(tx, countryInput, 1);
      if (!country) throw new Error(`Country not found in the LSevin location catalog: ${countryInput}`);
      const city = await resolveLocation(tx, cityInput, 2, country.id);
      if (!city) throw new Error(`City not found under country ${country.code}: ${cityInput}`);
      resolvedCountryId = country.id;
      resolvedCityId = city.id;

      const phoneCountryCode = String(application.phone_number_country_code || "+98").trim();
      const phoneNumber = String(application.phone_number || "").trim();
      if (phoneCountryCode.length > 8) throw Object.assign(new Error("Phone country code is too long for category.service_providers."), { code: "22001" });
      if (phoneNumber.length > 15) throw Object.assign(new Error("Phone number is too long for category.service_providers."), { code: "22001" });

      const providerRows = await tx<{ id: string }[]>`
        insert into category.service_providers (
          id, name_translations, description_translations, is_active, provider_type_id,
          city, country, detail_translations, street_translations, zip_code,
          email, phone_number_country_code, phone_number, create_date, last_modified_date,
          timezone_id
        ) values (
          gen_random_uuid(),
          ${sql.json(normalizedProviderTranslations(application))}::jsonb,
          ${sql.json({ "en-US": notes })}::jsonb,
          false,
          ${String(application.provider_type_id)}::uuid,
          ${city.code}, ${country.code}, '{}'::jsonb,
          ${sql.json({ "en-US": String(application.address_text || "") })}::jsonb,
          null,
          ${String(application.email || "")},
          ${phoneCountryCode},
          ${phoneNumber},
          now(), now(), ${input.timezoneId?.trim() || "Asia/Tehran"}
        )
        returning id::text
      `;
      providerId = providerRows[0].id;
      action = "approved_created";
    }

    await tx`
      insert into provider_portal.provider_members (
        service_provider_id, user_id, role, is_default, metadata, create_date, last_modified_date
      ) values (
        ${providerId}::uuid, ${String(application.applicant_user_id)}::uuid, 'owner',
        not exists (
          select 1 from provider_portal.provider_members
          where user_id = ${String(application.applicant_user_id)}::uuid and is_default = true
        ),
        ${sql.json({ source: "onboarding_application", applicationId: input.applicationId })}::jsonb,
        now(), now()
      )
      on conflict (service_provider_id, user_id)
      do update set role = 'owner', last_modified_date = now(),
        metadata = coalesce(provider_portal.provider_members.metadata, '{}'::jsonb) || excluded.metadata
    `;

    await tx`
      update provider_portal.onboarding_applications
      set status = 'approved', service_provider_id = ${providerId}::uuid,
          country_location_id = coalesce(${resolvedCountryId}::uuid, country_location_id),
          city_location_id = coalesce(${resolvedCityId}::uuid, city_location_id),
          review_reason = null, internal_note = nullif(${input.reviewNote || ""}, ''),
          reviewed_by = ${input.reviewerUserId}::uuid, reviewed_at = now(), last_modified_date = now()
      where id = ${input.applicationId}::uuid
    `;

    await recordReview(tx, {
      applicationId: input.applicationId,
      reviewerUserId: input.reviewerUserId,
      action,
      previousStatus: String(application.status),
      newStatus: "approved",
      note: input.reviewNote,
      serviceProviderId: providerId,
    });

    return providerId;
  });
}


export async function searchExistingProviderOptions(input:{providerTypeId:string;query?:string;selected?:string;locale?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const locale=input.locale||DEFAULT_LOCALE; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select sp.id::text as value, coalesce(${translationSql(sql`sp.name_translations`,locale)},sp.email,sp.id::text) as label,
      nullif(trim(concat_ws(' · ',sp.email,sp.phone)), '') as description
    from category.service_providers sp
    where sp.provider_type_id=${input.providerTypeId}::uuid
      and (${query}='' or sp.id::text ilike '%'||${query}||'%' or coalesce(sp.email,'') ilike '%'||${query}||'%'
        or exists(select 1 from jsonb_each_text(coalesce(sp.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when sp.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}
