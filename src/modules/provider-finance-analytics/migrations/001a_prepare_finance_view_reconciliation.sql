-- PostgreSQL cannot change a view column's data type through
-- CREATE OR REPLACE VIEW. Migration 001 exposes currency_code as text,
-- while the currency-aware reconciliation in 002 resolves it as varchar(10).
--
-- Keep both published migrations immutable. On databases where 002 is still
-- pending (including a clean install), remove only the replaceable reporting
-- views so 002 can recreate them with its final shape. If 002 has already been
-- recorded successfully, this migration is intentionally a no-op.
do $$
begin
  if not exists (
    select 1
    from public.lsevin_provider_portal_migrations
    where migration_key = 'src/modules/provider-finance-analytics/migrations/002_finance_views_reconciliation.sql'
  ) then
    execute 'drop view if exists provider_portal.provider_finance_kpis';
    execute 'drop view if exists provider_portal.provider_daily_report_view';
  end if;
end
$$;
