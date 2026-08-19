import "server-only";
import { sql } from "@core/db/client";

export type ModuleRecord = { id: string; status?: string | null; type?: string | null; createdAt?: string | null };
export type AnalyticsMetric = { label: string; value: string | number; hint?: string };
export type SnapshotItem = {
  id: string;
  scopeType: string;
  scopeId: string | null;
  reportKey: string;
  periodStart: string | null;
  periodEnd: string | null;
  metrics: Record<string, unknown>;
  createdAt: string;
};

export async function getModuleSummary(providerId?: string) {
  const [records, metrics] = await Promise.all([listRecentRecords(providerId), getProviderMetrics(providerId)]);
  return {
    recordCount: records.length,
    providerId: providerId ?? null,
    ...metrics,
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      return sql<ModuleRecord[]>`
        select id::text as id, scope_type as status, report_key as type, created_at::text as "createdAt"
        from reporting_analytics.report_snapshots
        where scope_id = ${providerId}::uuid
        order by created_at desc
        limit 10
      `;
    }
    return sql<ModuleRecord[]>`
      select id::text as id, scope_type as status, report_key as type, created_at::text as "createdAt"
      from reporting_analytics.report_snapshots
      order by created_at desc
      limit 10
    `;
  } catch {
    return [];
  }
}

export async function listSnapshots(providerId?: string, limit = 50): Promise<SnapshotItem[]> {
  try {
    if (providerId) {
      return sql<SnapshotItem[]>`
        select id::text as id, scope_type as "scopeType", scope_id::text as "scopeId", report_key as "reportKey", period_start::text as "periodStart", period_end::text as "periodEnd", metrics, created_at::text as "createdAt"
        from reporting_analytics.report_snapshots
        where scope_id = ${providerId}::uuid
        order by created_at desc
        limit ${limit}
      `;
    }
    return sql<SnapshotItem[]>`
      select id::text as id, scope_type as "scopeType", scope_id::text as "scopeId", report_key as "reportKey", period_start::text as "periodStart", period_end::text as "periodEnd", metrics, created_at::text as "createdAt"
      from reporting_analytics.report_snapshots
      order by created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function getProviderMetrics(providerId?: string) {
  try {
    if (providerId) {
      const rows = await sql<{ bookingsCount: number; paidBookingsCount: number; reviewsCount: number; avgRating: string; ticketsCount: number; invoicesCount: number; openInvoicesCount: number; profileViews: number }[]>`
        select
          (select count(*)::int from booking.bookings b where b.provider_id = ${providerId}::uuid) as "bookingsCount",
          (select count(*)::int from booking.bookings b where b.provider_id = ${providerId}::uuid and coalesce(b.payment_status, '') in ('Paid','paid','captured','succeeded')) as "paidBookingsCount",
          (select count(*)::int from reviews.reviews r where r.service_provider_id = ${providerId}::uuid or r.target_id = ${providerId}::uuid) as "reviewsCount",
          (select coalesce(avg(r.rating), 0)::numeric(4,1)::text from reviews.reviews r where r.service_provider_id = ${providerId}::uuid or r.target_id = ${providerId}::uuid) as "avgRating",
          (select count(*)::int from ticketing.tickets t where t.service_provider_id = ${providerId}::uuid) as "ticketsCount",
          (select count(*)::int from payment_billing.invoices i where i.bill_to_entity_id = ${providerId}::uuid or i.source_entity_id = ${providerId}::uuid) as "invoicesCount",
          (select count(*)::int from payment_billing.invoices i where (i.bill_to_entity_id = ${providerId}::uuid or i.source_entity_id = ${providerId}::uuid) and i.status <> 'paid') as "openInvoicesCount",
          (select count(*)::int from reporting_analytics.profile_events e where e.scope_id = ${providerId}::uuid and e.event_name = 'profile_view') as "profileViews"
      `;
      return rows[0] ?? zeroMetrics();
    }
    const rows = await sql<{ bookingsCount: number; paidBookingsCount: number; reviewsCount: number; avgRating: string; ticketsCount: number; invoicesCount: number; openInvoicesCount: number; profileViews: number }[]>`
      select
        (select count(*)::int from booking.bookings) as "bookingsCount",
        (select count(*)::int from booking.bookings where coalesce(payment_status, '') in ('Paid','paid','captured','succeeded')) as "paidBookingsCount",
        (select count(*)::int from reviews.reviews) as "reviewsCount",
        (select coalesce(avg(rating), 0)::numeric(4,1)::text from reviews.reviews) as "avgRating",
        (select count(*)::int from ticketing.tickets) as "ticketsCount",
        (select count(*)::int from payment_billing.invoices) as "invoicesCount",
        (select count(*)::int from payment_billing.invoices where status <> 'paid') as "openInvoicesCount",
        (select count(*)::int from reporting_analytics.profile_events where event_name = 'profile_view') as "profileViews"
    `;
    return rows[0] ?? zeroMetrics();
  } catch {
    return zeroMetrics();
  }
}

function zeroMetrics() {
  return { bookingsCount: 0, paidBookingsCount: 0, reviewsCount: 0, avgRating: "0.0", ticketsCount: 0, invoicesCount: 0, openInvoicesCount: 0, profileViews: 0 };
}

export async function createSnapshot(input: { scopeType: string; scopeId?: string; reportKey: string; metrics: Record<string, unknown>; createdByUserId: string }) {
  await sql`
    insert into reporting_analytics.report_snapshots(scope_type, scope_id, report_key, period_start, period_end, metrics, created_by_user_id)
    values (${input.scopeType}, ${input.scopeId || null}::uuid, ${input.reportKey}, current_date - interval '30 days', current_date, ${sql.json(input.metrics)}, ${input.createdByUserId}::uuid)
  `;
}

export async function createExportJob(input: { snapshotId: string; exportFormat: string }) {
  await sql`
    insert into reporting_analytics.export_jobs(report_snapshot_id, export_format, status)
    values (${input.snapshotId}::uuid, ${input.exportFormat}, 'queued')
  `;
}
