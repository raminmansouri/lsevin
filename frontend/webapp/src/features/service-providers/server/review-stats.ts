import "server-only";

import sql from "@/config/database/db";

export async function refreshProviderReviewStats(providerId: string) {
  await sql`
    update category.service_providers sp
    set
      rating = stats.avg_rating::numeric(3,2),
      review_count = stats.total,
      last_modified_date = now()
    from (
      select round(coalesce(avg(c.rating), 0)::numeric, 2) as avg_rating, count(*)::int as total
      from category.service_provider_comments c
      where c.service_provider_id = ${providerId}::uuid
        and c.is_public = true
        and coalesce(c.moderation_status, case when c.is_public then 'approved' else 'pending' end) = 'approved'
    ) stats
    where sp.id = ${providerId}::uuid
  `;
}

export async function refreshServiceReviewStats(
  providerServiceId?: string | null,
) {
  if (!providerServiceId) return;

  await sql`
    update category.provider_services ps
    set
      rating = stats.avg_rating::numeric(3,2),
      review_count = stats.total,
      last_modified_date = now()
    from (
      select round(coalesce(avg(c.rating), 0)::numeric, 2) as avg_rating, count(*)::int as total
      from category.service_provider_comments c
      where c.provider_service_id = ${providerServiceId}::uuid
        and c.is_public = true
        and coalesce(c.moderation_status, case when c.is_public then 'approved' else 'pending' end) = 'approved'
    ) stats
    where ps.id = ${providerServiceId}::uuid
  `;
}

export async function refreshStaffReviewStats(staffId?: string | null) {
  if (!staffId) return;

  await sql`
    update category.staff s
    set
      rating = stats.avg_rating::numeric(3,2),
      review_count = stats.total,
      last_modified_date = now()
    from (
      select round(coalesce(avg(c.rating), 0)::numeric, 2) as avg_rating, count(*)::int as total
      from category.service_provider_comments c
      where c.staff_id = ${staffId}::uuid
        and c.is_public = true
        and coalesce(c.moderation_status, case when c.is_public then 'approved' else 'pending' end) = 'approved'
    ) stats
    where s.id = ${staffId}::uuid
  `;
}

export async function refreshReviewStats(input: {
  providerId: string;
  providerServiceId?: string | null;
  staffId?: string | null;
}) {
  await Promise.all([
    refreshProviderReviewStats(input.providerId),
    refreshServiceReviewStats(input.providerServiceId),
    refreshStaffReviewStats(input.staffId),
  ]);
}
