import "server-only";

import sql from "@/config/database/db";

export interface AdminLookupOption {
  value: string;
  label: string;
}

export interface CommercialPolicyLookups {
  providerTypes: AdminLookupOption[];
  providers: AdminLookupOption[];
  serviceDefinitions: AdminLookupOption[];
  providerServices: AdminLookupOption[];
  addons: AdminLookupOption[];
}

export async function getCommercialPolicyLookups(): Promise<CommercialPolicyLookups> {
  const [providerTypes, providers, serviceDefinitions, providerServices, addons] = await Promise.all([
    sql<AdminLookupOption[]>`
      select id::text as value, common.get_translation_t(name_translations, 'en-US', 'en') as label
      from category.provider_types
      where is_active = true
      order by label asc
      limit 200
    `,
    sql<AdminLookupOption[]>`
      select id::text as value, common.get_translation_t(name_translations, 'en-US', 'en') as label
      from category.service_providers
      where is_active = true
      order by label asc
      limit 200
    `,
    sql<AdminLookupOption[]>`
      select id::text as value, common.get_translation_t(name_translations, 'en-US', 'en') as label
      from category.service_definitions
      where is_active = true
      order by label asc
      limit 200
    `,
    sql<AdminLookupOption[]>`
      select ps.id::text as value, concat(common.get_translation_t(ps.display_name_translations, 'en-US', 'en'), ' • ', common.get_translation_t(sp.name_translations, 'en-US', 'en')) as label
      from category.provider_services ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true
      order by label asc
      limit 200
    `,
    sql<AdminLookupOption[]>`
      select id::text as value, name as label
      from category.addons
      where is_active = true
      order by name asc
      limit 200
    `,
  ]);

  return { providerTypes, providers, serviceDefinitions, providerServices, addons };
}

export async function getCommercialDashboardSummary() {
  const [counts] = await sql<any[]>`
    select
      (select count(*)::int from commercial.compensation_policies where is_active = true) as active_policies,
      (select count(*)::int from commercial.refund_requests where status = 'requested') as requested_refunds,
      (select count(*)::int from commercial.refund_requests where status = 'approved') as approved_refunds,
      (select count(*)::int from commercial.provider_ledgers where status = 'pending') as pending_ledgers,
      (select count(*)::int from commercial.provider_ledgers where status = 'approved') as approved_ledgers
  `;

  const recentRefunds = await sql<any[]>`
    select id, booking_id, reason, status, created_at::text as created_at
    from commercial.refund_requests
    order by created_at desc
    limit 8
  `;

  const recentLedgers = await sql<any[]>`
    select
      pl.id,
      pl.booking_id,
      pl.status,
      pl.amount::float8 as amount,
      pl.currency_code as currency_code,
      common.get_translation_t(sp.name_translations, 'en-US', 'en') as provider_name,
      pl.created_at::text as created_at
    from commercial.provider_ledgers pl
    join category.service_providers sp on sp.id = pl.provider_id
    order by pl.created_at desc
    limit 8
  `;

  return { counts, recentRefunds, recentLedgers };
}
