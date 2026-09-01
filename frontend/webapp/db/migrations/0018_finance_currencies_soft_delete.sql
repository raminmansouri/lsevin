-- B3: soft delete for finance.currencies.
--
-- The admin panel had no way to remove a currency at all. A hard delete is not an
-- option here: seven tables carry a foreign key to finance.currencies (addons,
-- provider_services, service_definitions, country_currency_defaults, exchange_rates,
-- fx_pair_margins, fx_quotes), and dozens more store a currency code without one, so
-- removing a row would either be refused by the database or leave money rows pointing
-- at a currency that no longer exists.
--
-- deleted_at rather than is_deleted: when a currency was retired is worth knowing on
-- financial data and cannot be reconstructed afterwards.
--
-- Nullable with no default, so every existing row reads as "not deleted" and all
-- current code keeps working unchanged. Nothing is back-filled.

begin;

alter table finance.currencies
  add column if not exists deleted_at timestamptz null;

comment on column finance.currencies.deleted_at is
  'Soft-delete marker. Null means live. Set by the admin currency delete action, which refuses to delete a currency still referenced by any table.';

-- Every read filters on `deleted_at is null`, so give that predicate an index rather
-- than making each currency listing scan the table. Partial, because the live rows are
-- the only ones ever listed.
create index if not exists ix_finance_currencies_live
  on finance.currencies (sort_order, code)
  where deleted_at is null;

commit;
