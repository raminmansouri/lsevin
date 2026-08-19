import "server-only";
import { REPEAT_BUSINESS_QUEUE_LIMIT, REPEAT_BUSINESS_REVIEW_MIN_COMPLETED, REPEAT_BUSINESS_REVIEW_PROOF_TARGET, REPEAT_BUSINESS_WINDOW_DAYS, type ProviderRepeatBusinessPulse, type RepeatBusinessIssue } from "./marketTypes";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import type { AdminOfferItem, AdminOfferSummary, OfferAdminActionItem, OfferServiceOption, ProviderOffer } from "./types";

export async function listProviderOffers(providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ProviderOffer[]>`
    select
      o.id,
      o.provider_service_id::text as "providerServiceId",
      ${translationSql(sql`ps.display_name_translations`, locale)} as "serviceName",
      o.title,
      o.subtitle,
      o.discount_percent::text as "discountPercent",
      o.valid_until::text as "validUntil",
      o.code,
      coalesce(o.is_active, true) as "isActive",
      coalesce(o.is_featured, false) as "isFeatured",
      coalesce(o.used_count, 0)::int as "usedCount",
      o.usage_limit as "usageLimit"
    from marketing.offers o
    join category.provider_services ps on ps.id = o.provider_service_id
    where ps.service_provider_id = ${providerId}::uuid
    order by o.valid_until desc
  `;
}

export async function createOffer(input: { providerId: string; providerServiceId: string; title: string; subtitle?: string; discountPercent: number; validUntil: string; code?: string; usageLimit?: number; isFeatured: boolean; descriptionTranslations: Record<string, string> }) {
  await sql`
    insert into marketing.offers (provider_service_id, title, subtitle, discount_percent, valid_until, code, is_active, is_featured, usage_limit, used_count, description_translations)
    select ${input.providerServiceId}::uuid, ${input.title}, nullif(${input.subtitle ?? ""}, ''), ${input.discountPercent}, ${input.validUntil}::timestamp, nullif(${input.code ?? ""}, ''), true, ${input.isFeatured}, nullif(${input.usageLimit ? String(input.usageLimit) : ""}, '')::integer, 0, ${sql.json(input.descriptionTranslations)}
    where exists (select 1 from category.provider_services where id = ${input.providerServiceId}::uuid and service_provider_id = ${input.providerId}::uuid)
  `;
}

export async function deleteOffer(providerId: string, offerId: number) {
  await sql`
    delete from marketing.offers o using category.provider_services ps
    where o.provider_service_id = ps.id and ps.service_provider_id = ${providerId}::uuid and o.id = ${offerId}
  `;
}

export async function listOfferServiceOptions(providerId: string) {
  return sql<OfferServiceOption[]>`
    select
      ps.id::text,
      coalesce(common.get_translation_t(sd.name_translations, 'fa-IR', 'en-US'), ps.id::text) as "serviceDefinitionName",
      ps.display_name_translations as "displayNameTranslations"
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.service_provider_id = ${providerId}::uuid
    order by ps.create_date desc
  `;
}

export async function getAdminOfferSummary(): Promise<AdminOfferSummary> {
  const rows = await sql<AdminOfferSummary[]>`
    select
      count(*)::int as total,
      count(*) filter (where coalesce(is_active, true) and valid_until > now())::int as active,
      count(*) filter (where not coalesce(is_active, true))::int as inactive,
      count(*) filter (where coalesce(is_featured, false))::int as featured,
      count(*) filter (where valid_until <= now())::int as expired,
      count(*) filter (where usage_limit is not null and coalesce(used_count, 0) >= usage_limit)::int as exhausted
    from marketing.offers
  `;
  return rows[0] ?? { total: 0, active: 0, inactive: 0, featured: 0, expired: 0, exhausted: 0 };
}

export async function listAdminOffers(input: { query?: string; status?: string; providerId?: string; limit?: number } = {}) {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  const query = input.query?.trim() ?? "";
  const status = input.status?.trim() ?? "";
  const providerId = input.providerId?.trim() ?? "";
  return sql<AdminOfferItem[]>`
    select
      o.id,
      sp.id::text as "providerId",
      ${translationSql(sql`sp.name_translations`, locale)} as "providerName",
      sp.is_active as "providerActive",
      ps.id::text as "providerServiceId",
      coalesce(${translationSql(sql`ps.display_name_translations`, locale)}, ${translationSql(sql`sd.name_translations`, locale)}, ps.id::text) as "serviceName",
      o.title,
      o.subtitle,
      o.discount_percent::text as "discountPercent",
      o.valid_until::text as "validUntil",
      o.code,
      coalesce(o.is_active, true) as "isActive",
      coalesce(o.is_featured, false) as "isFeatured",
      coalesce(o.used_count, 0)::int as "usedCount",
      o.usage_limit as "usageLimit",
      (o.valid_until <= now()) as "isExpired",
      o.created_at::text as "createdAt"
    from marketing.offers o
    join category.provider_services ps on ps.id = o.provider_service_id
    join category.service_definitions sd on sd.id = ps.service_definition_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    where (${query} = '' or lower(o.title) like '%' || lower(${query}) || '%'
      or lower(coalesce(o.code, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`ps.display_name_translations`, locale)}, '')) like '%' || lower(${query}) || '%'
      or lower(coalesce(${translationSql(sql`sp.name_translations`, locale)}, '')) like '%' || lower(${query}) || '%')
      and (${status} = '' or (${status} = 'active' and coalesce(o.is_active, true) and o.valid_until > now())
        or (${status} = 'inactive' and not coalesce(o.is_active, true))
        or (${status} = 'featured' and coalesce(o.is_featured, false))
        or (${status} = 'expired' and o.valid_until <= now())
        or (${status} = 'exhausted' and o.usage_limit is not null and coalesce(o.used_count, 0) >= o.usage_limit))
      and (${providerId} = '' or sp.id = nullif(${providerId}, '')::uuid)
    order by o.created_at desc nulls last, o.id desc
    limit ${input.limit ?? 250}
  `;
}

export async function listOfferProviderOptions() {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR";
  return sql<{ id: string; label: string }[]>`
    select id::text as id, ${translationSql(sql`name_translations`, locale)} as label
    from category.service_providers order by label asc
  `;
}

export async function listRecentOfferAdminActions(limit = 20) {
  return sql<OfferAdminActionItem[]>`
    select aca.id::text as id, aca.entity_id as "entityId", aca.action, aca.reason,
      coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email, aca.actor_user_id::text) as "actorName", aca.created_at::text as "createdAt"
    from provider_portal.admin_catalog_actions aca
    left join identity.asp_net_users u on u.id = aca.actor_user_id
    where aca.entity_type = 'offer'
    order by aca.created_at desc
    limit ${limit}
  `;
}

export async function setOfferAdminFlag(input: { offerId: number; flag: "is_active" | "is_featured"; value: boolean; reason?: string; actorUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; isActive: boolean; isFeatured: boolean }[]>`
      select sp.id::text as "providerId", coalesce(o.is_active, true) as "isActive", coalesce(o.is_featured, false) as "isFeatured"
      from marketing.offers o
      join category.provider_services ps on ps.id = o.provider_service_id
      join category.service_providers sp on sp.id = ps.service_provider_id
      where o.id = ${input.offerId}
      for update of o
    `;
    const current = rows[0];
    if (!current) throw new Error("Offer not found.");
    if (input.flag === "is_active") {
      await tx`update marketing.offers set is_active = ${input.value} where id = ${input.offerId}`;
    } else {
      await tx`update marketing.offers set is_featured = ${input.value} where id = ${input.offerId}`;
    }
    const previousValue = input.flag === "is_active" ? current.isActive : current.isFeatured;
    await tx`
      insert into provider_portal.admin_catalog_actions(entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id)
      values ('offer', ${String(input.offerId)}, ${current.providerId}::uuid, ${`set_${input.flag}`}, nullif(${input.reason || ""}, ''), ${tx.json({ [input.flag]: previousValue })}, ${tx.json({ [input.flag]: input.value })}, ${input.actorUserId}::uuid)
    `;
  });
}

export async function expireOfferByAdmin(input: { offerId: number; reason: string; actorUserId: string }) {
  await sql.begin(async (tx) => {
    const rows = await tx<{ providerId: string; validUntil: string; isActive: boolean }[]>`
      select sp.id::text as "providerId", o.valid_until::text as "validUntil", coalesce(o.is_active, true) as "isActive"
      from marketing.offers o
      join category.provider_services ps on ps.id = o.provider_service_id
      join category.service_providers sp on sp.id = ps.service_provider_id
      where o.id = ${input.offerId}
      for update of o
    `;
    const current = rows[0];
    if (!current) throw new Error("Offer not found.");
    await tx`update marketing.offers set is_active = false, valid_until = least(valid_until, now()) where id = ${input.offerId}`;
    await tx`
      insert into provider_portal.admin_catalog_actions(entity_type, entity_id, service_provider_id, action, reason, previous_state, new_state, actor_user_id)
      values ('offer', ${String(input.offerId)}, ${current.providerId}::uuid, 'expire', ${input.reason}, ${tx.json({ valid_until: current.validUntil, is_active: current.isActive })}, ${tx.json({ valid_until: "now", is_active: false })}, ${input.actorUserId}::uuid)
    `;
  });
}


type RepeatBusinessContextRow = {
  completedBookings90d: number;
  distinctCustomers90d: number;
  repeatCustomers90d: number;
};

type RepeatBusinessRow = {
  providerServiceId: string;
  nameTranslations: Record<string, string>;
  completedBookings90d: number;
  distinctCustomers90d: number;
  repeatCustomers90d: number;
  repeatBookings90d: number;
  activeOfferCount: number;
  activeOfferUses: number;
  approvedReviewCount: number;
  averageRating: number;
};

export async function getProviderRepeatBusinessPulse(providerId: string): Promise<ProviderRepeatBusinessPulse> {
  const contextRows = await sql<RepeatBusinessContextRow[]>`
    with completed as (
      select b.service_id as provider_service_id, b.user_id
      from booking.bookings b
      where b.provider_id = ${providerId}::uuid
        and lower(coalesce(b.booking_status, '')) = 'completed'
        and coalesce(b.selected_date, b.create_date::date) >= current_date - ${REPEAT_BUSINESS_WINDOW_DAYS}::int
    ), per_service_customer as (
      select provider_service_id, user_id, count(*)::int as bookings
      from completed
      where user_id is not null
      group by provider_service_id, user_id
    )
    select
      (select count(*)::int from completed) as "completedBookings90d",
      (select count(distinct user_id)::int from completed where user_id is not null) as "distinctCustomers90d",
      (select count(distinct user_id)::int from per_service_customer where bookings >= 2) as "repeatCustomers90d"
  `;

  const rows = await sql<RepeatBusinessRow[]>`
    with completed as (
      select b.service_id as provider_service_id, b.user_id
      from booking.bookings b
      where b.provider_id = ${providerId}::uuid
        and lower(coalesce(b.booking_status, '')) = 'completed'
        and coalesce(b.selected_date, b.create_date::date) >= current_date - ${REPEAT_BUSINESS_WINDOW_DAYS}::int
    ), per_service_customer as (
      select provider_service_id, user_id, count(*)::int as bookings
      from completed
      where user_id is not null
      group by provider_service_id, user_id
    ), booking_rollup as (
      select provider_service_id,
        count(*)::int as completed_bookings,
        count(distinct user_id)::int as distinct_customers
      from completed
      group by provider_service_id
    ), repeat_rollup as (
      select provider_service_id,
        count(*) filter (where bookings >= 2)::int as repeat_customers,
        coalesce(sum(greatest(bookings - 1, 0)), 0)::int as repeat_bookings
      from per_service_customer
      group by provider_service_id
    )
    select
      ps.id::text as "providerServiceId",
      ps.display_name_translations as "nameTranslations",
      coalesce(br.completed_bookings, 0)::int as "completedBookings90d",
      coalesce(br.distinct_customers, 0)::int as "distinctCustomers90d",
      coalesce(rr.repeat_customers, 0)::int as "repeatCustomers90d",
      coalesce(rr.repeat_bookings, 0)::int as "repeatBookings90d",
      (select count(*)::int from marketing.offers o
        where o.provider_service_id = ps.id
          and o.is_active = true
          and o.valid_until > now()
          and (o.usage_limit is null or coalesce(o.used_count, 0) < o.usage_limit)) as "activeOfferCount",
      (select coalesce(sum(coalesce(o.used_count, 0)), 0)::int from marketing.offers o
        where o.provider_service_id = ps.id
          and o.is_active = true
          and o.valid_until > now()
          and (o.usage_limit is null or coalesce(o.used_count, 0) < o.usage_limit)) as "activeOfferUses",
      (select count(*)::int from category.service_provider_comments r
        where r.service_provider_id = ${providerId}::uuid
          and r.provider_service_id = ps.id
          and r.review_target = 'service'
          and r.is_public = true
          and r.moderation_status = 'approved') as "approvedReviewCount",
      coalesce((select avg(r.rating)::float8 from category.service_provider_comments r
        where r.service_provider_id = ${providerId}::uuid
          and r.provider_service_id = ps.id
          and r.review_target = 'service'
          and r.is_public = true
          and r.moderation_status = 'approved'
          and r.rating is not null), 0)::float8 as "averageRating"
    from category.provider_services ps
    left join booking_rollup br on br.provider_service_id = ps.id
    left join repeat_rollup rr on rr.provider_service_id = ps.id
    where ps.service_provider_id = ${providerId}::uuid
      and ps.is_active = true
    order by coalesce(rr.repeat_customers, 0) desc, coalesce(br.completed_bookings, 0) desc, ps.create_date desc
  `;

  const items = rows.map((row) => {
    const issues: RepeatBusinessIssue[] = [];
    if (row.repeatCustomers90d > 0 && row.activeOfferCount < 1) issues.push("repeat_demand_no_offer");
    if (row.completedBookings90d >= REPEAT_BUSINESS_REVIEW_MIN_COMPLETED && row.approvedReviewCount < REPEAT_BUSINESS_REVIEW_PROOF_TARGET) issues.push("completed_demand_low_review_proof");
    if (row.activeOfferCount > 0 && row.activeOfferUses < 1 && row.completedBookings90d > 0) issues.push("active_offer_no_recorded_use");
    return { ...row, issues };
  });

  const repeatDemand = items.filter((item) => item.repeatCustomers90d > 0);
  const repeatDemandWithOffer = repeatDemand.filter((item) => item.activeOfferCount > 0);
  const opportunities = items.filter((item) => item.issues.length > 0);
  const queue = [...opportunities]
    .sort((a, b) =>
      Number(b.issues.includes("repeat_demand_no_offer")) - Number(a.issues.includes("repeat_demand_no_offer")) ||
      b.repeatCustomers90d - a.repeatCustomers90d ||
      b.completedBookings90d - a.completedBookings90d ||
      a.activeOfferUses - b.activeOfferUses
    )
    .slice(0, REPEAT_BUSINESS_QUEUE_LIMIT);
  const context = contextRows[0] ?? { completedBookings90d: 0, distinctCustomers90d: 0, repeatCustomers90d: 0 };

  return {
    windowDays: REPEAT_BUSINESS_WINDOW_DAYS,
    completedBookings90d: context.completedBookings90d,
    distinctCustomers90d: context.distinctCustomers90d,
    repeatCustomers90d: context.repeatCustomers90d,
    servicesWithRepeatDemand: repeatDemand.length,
    repeatDemandServicesWithActiveOffer: repeatDemandWithOffer.length,
    repeatOfferCoveragePercent: repeatDemand.length > 0 ? Math.round((repeatDemandWithOffer.length / repeatDemand.length) * 100) : 0,
    servicesNeedingFollowThrough: opportunities.length,
    activeOfferUsesOnRepeatDemandServices: repeatDemand.reduce((sum, item) => sum + item.activeOfferUses, 0),
    reviewProofOpportunities: items.filter((item) => item.issues.includes("completed_demand_low_review_proof")).length,
    queue,
  };
}
