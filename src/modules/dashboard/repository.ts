import "server-only";
import { sql } from "@core/db/client";
import type { DashboardProviderSummary } from "./types";
import type { ProviderMarketReadiness } from "./marketTypes";
import { richTextToPlainText } from "@core/rich-text/codec";

export async function getUserDashboardMetrics(userId: string) {
  const rows = await sql<{ providers: number; services: number; staff: number; bookings: number; pendingApplications: number }[]>`
    with mine as (
      select service_provider_id from provider_portal.provider_members where user_id = ${userId}::uuid
    )
    select
      (select count(*)::int from mine) as providers,
      (select count(*)::int from category.provider_services ps join mine m on m.service_provider_id = ps.service_provider_id) as services,
      (select count(*)::int from category.provider_staffs psf join mine m on m.service_provider_id = psf.service_provider_id) as staff,
      (select count(*)::int from booking.bookings b join mine m on m.service_provider_id = b.provider_id) as bookings,
      (select count(*)::int from provider_portal.onboarding_applications where applicant_user_id = ${userId}::uuid and status in ('draft','submitted','in_review')) as "pendingApplications"
  `;
  return rows[0] ?? { providers: 0, services: 0, staff: 0, bookings: 0, pendingApplications: 0 };
}


export async function listDashboardProviders(userId: string, locale = "fa-IR") {
  const rows = await sql<DashboardProviderSummary[]>`
    select
      sp.id::text,
      coalesce(common.get_translation_t(sp.name_translations, ${locale}, 'en-US'), sp.email, sp.id::text) as name,
      coalesce(common.get_translation_t(sp.description_translations, ${locale}, 'en-US'), '') as description,
      coalesce(common.get_translation_t(pt.name_translations, ${locale}, 'en-US'), '') as "providerTypeName",
      sp.is_active as "isActive",
      coalesce(sp.rating, 0)::float as rating,
      pm.role::text as role,
      (select count(*)::int from category.provider_services s where s.service_provider_id = sp.id) as "serviceCount",
      (select count(*)::int from category.provider_staffs ps where ps.service_provider_id = sp.id) as "staffCount",
      (select count(*)::int from booking.bookings b where b.provider_id = sp.id) as "bookingCount"
    from provider_portal.provider_members pm
    join category.service_providers sp on sp.id = pm.service_provider_id
    left join category.provider_types pt on pt.id = sp.provider_type_id
    where pm.user_id = ${userId}::uuid
    order by pm.is_default desc, sp.create_date desc
  `;
  return rows;
}

export async function getProviderDashboardMetrics(providerId: string, locale = "fa-IR") {
  const rows = await sql<{ providerName: string; description: string; country: string | null; city: string | null; services: number; staff: number; bookings: number }[]>`
    select
      coalesce(common.get_translation_t(sp.name_translations, ${locale}, 'en-US'), sp.email, sp.id::text) as "providerName",
      coalesce(common.get_translation_t(sp.description_translations, ${locale}, 'en-US'), '') as description,
      sp.country,
      sp.city,
      (select count(*)::int from category.provider_services where service_provider_id = sp.id) as services,
      (select count(*)::int from category.provider_staffs where service_provider_id = sp.id) as staff,
      (select count(*)::int from booking.bookings where provider_id = sp.id) as bookings
    from category.service_providers sp
    where sp.id = ${providerId}::uuid
    limit 1
  `;
  const row = rows[0];
  if (!row) return { providerName: "", services: 0, staff: 0, bookings: 0, profileReady: false };
  const profileReady = Boolean(row.providerName.trim() && richTextToPlainText(row.description) && row.country?.trim() && row.city?.trim());
  return { providerName: row.providerName, services: row.services, staff: row.staff, bookings: row.bookings, profileReady };
}


type ProviderMarketRow = Omit<ProviderMarketReadiness, "readinessScore" | "profileComplete"> & {
  providerName: string;
  description: string;
  country: string | null;
  city: string | null;
};

export async function getProviderMarketReadiness(providerId: string, locale = "fa-IR"): Promise<ProviderMarketReadiness> {
  const rows = await sql<ProviderMarketRow[]>`
    select
      sp.is_active as "providerActive",
      coalesce(common.get_translation_t(sp.name_translations, ${locale}, 'en-US'), '') as "providerName",
      coalesce(common.get_translation_t(sp.description_translations, ${locale}, 'en-US'), '') as description,
      sp.country,
      sp.city,
      (select count(*)::int from category.provider_services ps where ps.service_provider_id = sp.id and ps.is_active = true) as "activeServices",
      (select count(*)::int from category.provider_staffs psf where psf.service_provider_id = sp.id and psf.is_active = true) as "activeStaff",
      (select count(*)::int from provider_portal.generic_availability_rules ar where ar.service_provider_id = sp.id and ar.is_active = true and ar.is_available = true) as "availabilityRules",
      (select count(*)::int from category.provider_gallery_items gi where gi.service_provider_id = sp.id) as "mediaItems",
      (
        select count(*)::int
        from marketing.offers o
        join category.provider_services ps on ps.id = o.provider_service_id
        where ps.service_provider_id = sp.id
          and ps.is_active = true
          and o.is_active = true
          and o.valid_until > now()
          and (o.usage_limit is null or coalesce(o.used_count, 0) < o.usage_limit)
      ) as "activeOffers",
      (select count(*)::int from booking.bookings b where b.provider_id = sp.id) as "totalBookings",
      (select count(*)::int from booking.bookings b where b.provider_id = sp.id and b.create_date >= now() - interval '30 days') as "bookings30d",
      coalesce(sp.rating, 0)::float as rating,
      coalesce(sp.review_count, 0)::int as "reviewCount",
      (select min(b.create_date)::text from booking.bookings b where b.provider_id = sp.id) as "firstBookingAt"
    from category.service_providers sp
    where sp.id = ${providerId}::uuid
    limit 1
  `;

  const row = rows[0];
  if (!row) return {
    providerActive: false, profileComplete: false, activeServices: 0, activeStaff: 0, availabilityRules: 0,
    mediaItems: 0, activeOffers: 0, totalBookings: 0, bookings30d: 0, rating: 0, reviewCount: 0, firstBookingAt: null, readinessScore: 0,
  };
  const profileComplete = Boolean(row.providerName.trim() && richTextToPlainText(row.description) && row.country?.trim() && row.city?.trim());
  const readinessScore =
    (profileComplete ? 25 : 0) +
    (row.activeServices > 0 ? 25 : 0) +
    (row.availabilityRules > 0 ? 20 : 0) +
    (row.mediaItems > 0 ? 15 : 0) +
    (row.activeOffers > 0 ? 15 : 0);
  const { providerName: _providerName, description: _description, country: _country, city: _city, ...market } = row;
  return { ...market, profileComplete, readinessScore };
}
