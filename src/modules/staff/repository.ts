import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import { normalizeOptionSearchLimit, normalizeOptionSearchQuery } from "@core/lib/optionSearch";
import type { AdminStaffItem, AdminStaffSummary, ProviderStaff, StaffAdminActionItem } from "./types";

export async function listProviderStaff(providerId: string) {
  return sql<ProviderStaff[]>`
    select
      ps.id::text as "providerStaffId",
      st.id::text as "staffId",
      st.name_translations as "nameTranslations",
      st.title_translations as "titleTranslations",
      st.biography_translations as "biographyTranslations",
      st.profile_image_url as "profileImageUrl",
      ps.is_active as "isActive",
      st.specialty,
      coalesce(st.rating, 0)::float8 as rating
    from category.provider_staffs ps
    join category.staff st on st.id = ps.staff_id
    where ps.service_provider_id = ${providerId}::uuid
    order by st.create_date desc
  `;
}

export async function getProviderStaff(providerId: string, providerStaffId: string) {
  const rows = await sql<ProviderStaff[]>`
    select
      ps.id::text as "providerStaffId",
      st.id::text as "staffId",
      st.name_translations as "nameTranslations",
      st.title_translations as "titleTranslations",
      st.biography_translations as "biographyTranslations",
      st.profile_image_url as "profileImageUrl",
      ps.is_active as "isActive",
      st.specialty,
      coalesce(st.rating, 0)::float8 as rating
    from category.provider_staffs ps
    join category.staff st on st.id = ps.staff_id
    where ps.service_provider_id = ${providerId}::uuid and ps.id = ${providerStaffId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function createAndLinkStaff(input: {
  providerId: string;
  nameTranslations: Record<string, string>;
  titleTranslations: Record<string, string>;
  biographyTranslations: Record<string, string>;
  profileImageUrl?: string;
  specialty?: string;
}) {
  return sql.begin(async (tx) => {
    const staffRows = await tx<{ id: string }[]>`
      insert into category.staff (
        name_translations, title_translations, biography_translations, profile_image_url,
        is_active, specialty, create_date, last_modified_date
      ) values (
        ${tx.json(input.nameTranslations)}, ${tx.json(input.titleTranslations)}, ${tx.json(input.biographyTranslations)}, ${input.profileImageUrl || null},
        true, ${input.specialty || null}, now(), now()
      ) returning id::text
    `;
    const staffId = staffRows[0].id;
    await tx`
      insert into category.provider_staffs (id, staff_id, notes_translations, is_active, service_provider_id, create_date, last_modified_date)
      values (public.uuid_generate_v4(), ${staffId}::uuid, '{}'::jsonb, true, ${input.providerId}::uuid, now(), now())
    `;
    return staffId;
  });
}

export async function updateProviderStaff(input: {
  providerId: string;
  providerStaffId: string;
  staffId: string;
  nameTranslations: Record<string, string>;
  titleTranslations: Record<string, string>;
  biographyTranslations: Record<string, string>;
  profileImageUrl?: string;
  specialty?: string;
  isActive: boolean;
}) {
  await sql.begin(async (tx) => {
    await tx`
      update category.staff set
        name_translations = ${tx.json(input.nameTranslations)},
        title_translations = ${tx.json(input.titleTranslations)},
        biography_translations = ${tx.json(input.biographyTranslations)},
        profile_image_url = nullif(${input.profileImageUrl || ""}, ''),
        specialty = nullif(${input.specialty || ""}, ''),
        is_active = ${input.isActive},
        last_modified_date = now()
      where id = ${input.staffId}::uuid
        and exists (select 1 from category.provider_staffs ps where ps.staff_id = category.staff.id and ps.id = ${input.providerStaffId}::uuid and ps.service_provider_id = ${input.providerId}::uuid)
    `;
    await tx`
      update category.provider_staffs set is_active = ${input.isActive}, last_modified_date = now()
      where id = ${input.providerStaffId}::uuid and service_provider_id = ${input.providerId}::uuid
    `;
  });
}

export async function unlinkProviderStaff(providerId: string, providerStaffId: string) {
  await sql`delete from category.provider_staffs where service_provider_id = ${providerId}::uuid and id = ${providerStaffId}::uuid`;
}

export async function getStaffProfile(staffId: string) {
  const rows = await sql<{
    staffId: string;
    nameTranslations: Record<string, string>;
    titleTranslations: Record<string, string>;
    biographyTranslations: Record<string, string>;
    profileImageUrl: string | null;
    specialty: string | null;
    isActive: boolean;
  }[]>`
    select
      st.id::text as "staffId",
      st.name_translations as "nameTranslations",
      st.title_translations as "titleTranslations",
      st.biography_translations as "biographyTranslations",
      st.profile_image_url as "profileImageUrl",
      st.specialty,
      st.is_active as "isActive"
    from category.staff st
    where st.id = ${staffId}::uuid
    limit 1
  `;
  return rows[0] ?? null;
}

export async function updateClaimedStaffProfile(input: {
  staffId: string;
  nameTranslations: Record<string, string>;
  titleTranslations: Record<string, string>;
  biographyTranslations: Record<string, string>;
  profileImageUrl?: string;
  specialty?: string;
}) {
  await sql`
    update category.staff set
      name_translations = ${sql.json(input.nameTranslations)},
      title_translations = ${sql.json(input.titleTranslations)},
      biography_translations = ${sql.json(input.biographyTranslations)},
      profile_image_url = nullif(${input.profileImageUrl || ""}, ''),
      specialty = nullif(${input.specialty || ""}, ''),
      last_modified_date = now()
    where id = ${input.staffId}::uuid
  `;
}

export async function getAdminStaffSummary(): Promise<AdminStaffSummary> {
  const rows = await sql<AdminStaffSummary[]>`
    select
      (select count(*) from category.staff)::int as "staffTotal",
      (select count(*) from category.staff where is_active)::int as "staffActive",
      (select count(*) from category.staff where not is_active)::int as "staffInactive",
      (select count(*) from category.provider_staffs)::int as "providerLinks",
      (select count(*) from category.provider_staffs where not is_active)::int as "inactiveLinks",
      (select count(*) from provider_portal_ext.profile_claims where target_type = 'staff' and status = 'approved' and clinic_review_status = 'approved' and lsevin_review_status = 'approved')::int as "approvedClaims"
  `;
  return rows[0] ?? { staffTotal: 0, staffActive: 0, staffInactive: 0, providerLinks: 0, inactiveLinks: 0, approvedClaims: 0 };
}

export async function listAdminStaff(input: { query?: string; status?: string; providerId?: string; limit?: number } = {}) {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  const query = input.query?.trim() ?? "";
  const status = input.status?.trim() ?? "";
  const providerId = input.providerId?.trim() ?? "";
  return sql<AdminStaffItem[]>`
    select
      ps.id::text as "providerStaffId",
      st.id::text as "staffId",
      ${translationSql(sql`st.name_translations`, locale)} as "staffName",
      coalesce(${translationSql(sql`st.title_translations`, locale)}, '') as title,
      st.specialty,
      st.is_active as "staffActive",
      ps.is_active as "linkActive",
      sp.id::text as "providerId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      sp.is_active as "providerActive",
      coalesce(st.rating, 0)::float8 as rating,
      coalesce(st.review_count, 0)::int as "reviewCount",
      claims.status as "claimStatus",
      greatest(st.last_modified_date, ps.last_modified_date)::text as "lastModifiedAt"
    from category.provider_staffs ps
    join category.staff st on st.id = ps.staff_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    left join lateral (
      select pc.status::text as status
      from provider_portal_ext.profile_claims pc
      where pc.target_type = 'staff' and pc.target_id = st.id
      order by pc.updated_at desc
      limit 1
    ) claims on true
    where (${query} = '' or lower(coalesce(${translationSql(sql`st.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(st.specialty, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`sp.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%')
      and (${status} = '' or (${status} = 'active' and st.is_active and ps.is_active)
        or (${status} = 'staff_inactive' and not st.is_active)
        or (${status} = 'link_inactive' and not ps.is_active)
        or (${status} = 'claimed' and claims.status = 'approved'))
      and (${providerId} = '' or sp.id = nullif(${providerId}, '')::uuid)
    order by greatest(st.last_modified_date, ps.last_modified_date) desc nulls last, st.create_date desc
    limit ${input.limit ?? 250}
  `;
}

export async function listStaffProviderOptions() {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  return sql<{ id: string; label: string }[]>`
    select id::text as id, ${translationSql(sql`name_translations`, locale)} as label
    from category.service_providers order by label asc
  `;
}

export async function listRecentStaffAdminActions(limit = 20) {
  return sql<StaffAdminActionItem[]>`
    select aca.id::text as id, aca.entity_id as "entityId", aca.action, aca.reason,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, aca.actor_user_id::text) as "actorName", aca.created_at::text as "createdAt"
    from provider_portal.admin_catalog_actions aca
    left join identity.asp_net_users u on u.id = aca.actor_user_id
    where aca.entity_type in ('staff', 'provider_staff')
    order by aca.created_at desc
    limit ${limit}
  `;
}

export async function setStaffActiveByAdmin(input: { staffId: string; value: boolean; reason?: string; actorUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ isActive: boolean }[]>`select is_active as "isActive" from category.staff where id = ${input.staffId}::uuid for update`;
    const current = rows[0];
    if (!current) throw new Error("Staff profile not found.");
    await tx`update category.staff set is_active = ${input.value}, last_modified_date = now() where id = ${input.staffId}::uuid`;
    await tx`
      insert into provider_portal.admin_catalog_actions(entity_type, entity_id, action, reason, previous_state, new_state, actor_user_id)
      values ('staff', ${input.staffId}, 'set_is_active', nullif(${input.reason || ""}, ''), ${tx.json({ is_active: current.isActive })}, ${tx.json({ is_active: input.value })}, ${input.actorUserId}::uuid)
    `;
  });
}

export async function setProviderStaffLinkActiveByAdmin(input: { providerStaffId: string; value: boolean; reason?: string; actorUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; isActive: boolean }[]>`
      select service_provider_id::text as "providerId", is_active as "isActive" from category.provider_staffs where id = ${input.providerStaffId}::uuid for update
    `;
    const current = rows[0];
    if (!current) throw new Error("Provider staff link not found.");
    await tx`update category.provider_staffs set is_active = ${input.value}, last_modified_date = now() where id = ${input.providerStaffId}::uuid`;
    await tx`
      insert into provider_portal.admin_catalog_actions(entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id)
      values ('provider_staff', ${input.providerStaffId}, ${current.providerId}::uuid, 'set_link_active', nullif(${input.reason || ""}, ''), ${tx.json({ is_active: current.isActive })}, ${tx.json({ is_active: input.value })}, ${input.actorUserId}::uuid)
    `;
  });
}


export async function searchStaffProviderOptions(input:{query?:string;selected?:string;locale?:string;limit?:number}) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const locale=input.locale||"fa-IR"; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select sp.id::text as value, coalesce(${translationSql(sql`sp.name_translations`,locale)},sp.id::text) as label,
      nullif(trim(concat_ws(' · ',sp.email,sp.phone)), '') as description
    from category.service_providers sp
    where (${query}='' or sp.id::text ilike '%'||${query}||'%' or coalesce(sp.email,'') ilike '%'||${query}||'%'
      or exists(select 1 from jsonb_each_text(coalesce(sp.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when sp.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}
