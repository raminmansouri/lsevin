-- Brings a test database cloned from the local dev database closer to PRODUCTION's schema.
--
-- The local dev database lags production: some columns there were created by the .NET (EF)
-- migrations, which these scripts do not run. Each line below is a column production has
-- (checked read-only on 2026-10-20/21) that queries in the webapp depend on. Idempotent.
-- When a test fails with "column ... does not exist", compare with production and add it here.

alter table category.provider_services add column if not exists search_text text;
alter table category.provider_services add column if not exists value_toman numeric;
alter table category.service_providers add column if not exists search_text text;
