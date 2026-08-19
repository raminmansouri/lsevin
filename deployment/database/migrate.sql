\set ON_ERROR_STOP on
\pset pager off

-- Scriptless migration publication for the Providers Portal.
-- psql is the migration process. Docker/Kubernetes provide process lifecycle;
-- PostgreSQL provides locking, transactions, and durable migration history.

\echo [migrate] checking LSevin database baseline

-- Count the shared LSevin relations that must exist before portal migrations.
SELECT
  ((to_regclass('category.service_providers') IS NOT NULL)::int +
   (to_regclass('category.provider_services') IS NOT NULL)::int +
   (to_regclass('category.staff') IS NOT NULL)::int +
   (to_regclass('identity.asp_net_users') IS NOT NULL)::int +
   (to_regclass('booking.bookings') IS NOT NULL)::int +
   (to_regclass('commercial.provider_ledgers') IS NOT NULL)::int +
   (to_regclass('commercial.booking_charge_lines') IS NOT NULL)::int +
   (to_regclass('media.media_library') IS NOT NULL)::int) AS lsevin_base_present_count,
  ((to_regclass('category.service_providers') IS NOT NULL) OR
   (to_regclass('category.provider_services') IS NOT NULL) OR
   (to_regclass('category.staff') IS NOT NULL) OR
   (to_regclass('identity.asp_net_users') IS NOT NULL) OR
   (to_regclass('booking.bookings') IS NOT NULL) OR
   (to_regclass('commercial.provider_ledgers') IS NOT NULL) OR
   (to_regclass('commercial.booking_charge_lines') IS NOT NULL) OR
   (to_regclass('media.media_library') IS NOT NULL)) AS lsevin_base_any,
  (to_regclass('category.service_providers') IS NOT NULL AND
   to_regclass('category.provider_services') IS NOT NULL AND
   to_regclass('category.staff') IS NOT NULL AND
   to_regclass('identity.asp_net_users') IS NOT NULL AND
   to_regclass('booking.bookings') IS NOT NULL AND
   to_regclass('commercial.provider_ledgers') IS NOT NULL AND
   to_regclass('commercial.booking_charge_lines') IS NOT NULL AND
   to_regclass('media.media_library') IS NOT NULL) AS lsevin_base_ready
\gset

\if :lsevin_base_ready
  \echo [migrate] LSevin baseline found
\else
  \if :allow_bootstrap
    \if :lsevin_base_any
      \echo [migrate] ERROR: database is partially initialized. Refusing to restore a full backup over existing LSevin objects.
      \echo [migrate] Use the correct database/volume or restore it explicitly before publishing.
      \quit 3
    \else
      \echo [migrate] no LSevin baseline found; restoring local bootstrap database
      BEGIN;
      \ir /bootstrap/database-backup.sql
      COMMIT;
      \echo [migrate] local bootstrap restore completed
    \endif
  \else
    \echo [migrate] ERROR: target is not an initialized LSevin database and automatic bootstrap is disabled.
    \quit 3
  \endif
\endif

-- Recheck after an optional local bootstrap restore.
SELECT
  (to_regclass('category.service_providers') IS NOT NULL AND
   to_regclass('category.provider_services') IS NOT NULL AND
   to_regclass('category.staff') IS NOT NULL AND
   to_regclass('identity.asp_net_users') IS NOT NULL AND
   to_regclass('booking.bookings') IS NOT NULL AND
   to_regclass('commercial.provider_ledgers') IS NOT NULL AND
   to_regclass('commercial.booking_charge_lines') IS NOT NULL AND
   to_regclass('media.media_library') IS NOT NULL) AS lsevin_base_ready,
  (to_regclass('provider_portal.provider_members') IS NOT NULL AND
   to_regclass('provider_portal.provider_operating_hours') IS NOT NULL AND
   to_regclass('provider_portal.onboarding_applications') IS NOT NULL AND
   to_regclass('provider_portal.support_tickets') IS NOT NULL AND
   to_regclass('provider_portal.bookable_resources') IS NOT NULL AND
   to_regclass('provider_portal.generic_availability_rules') IS NOT NULL AND
   to_regclass('provider_portal.payout_accounts') IS NOT NULL) AS provider_foundation_ready
\gset

\if :lsevin_base_ready
\else
  \echo [migrate] ERROR: LSevin bootstrap/preflight did not produce the required shared schema.
  \quit 3
\endif

\if :provider_foundation_ready
  \echo [migrate] provider_portal foundation found
\else
  \echo [migrate] ERROR: LSevin database exists but the provider_portal foundation is incomplete.
  \echo [migrate] Refusing to invent or overlay foundation tables onto a partial database.
  \echo [migrate] For local development use the clean Compose volume supplied by this release; for staging/production restore the correct LSevin database.
  \quit 3
\endif

-- One publisher at a time. This is a session lock so it remains held while
-- each migration uses its own transaction. If psql dies, PostgreSQL releases it.
SET statement_timeout = '120s';
SELECT pg_advisory_lock(761602180001::bigint);
SET statement_timeout = 0;

-- Preserve the historical migration contract. Never truncate this table.
CREATE TABLE IF NOT EXISTS public.lsevin_provider_portal_migrations (
  migration_key text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- Fail clearly rather than trying to reshape an unknown historical table.
SELECT
  (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lsevin_provider_portal_migrations' AND column_name='migration_key') AND
   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lsevin_provider_portal_migrations' AND column_name='checksum') AND
   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lsevin_provider_portal_migrations' AND column_name='applied_at')) AS history_shape_ok
\gset
\if :history_shape_ok
\else
  \echo [migrate] ERROR: public.lsevin_provider_portal_migrations has an unsupported shape; it was not modified.
  SELECT pg_advisory_unlock(761602180001::bigint);
  \quit 3
\endif

CREATE TEMP TABLE expected_active_migrations (
  sequence_no integer PRIMARY KEY,
  migration_key text UNIQUE NOT NULL,
  checksum text NOT NULL
) ON COMMIT PRESERVE ROWS;

INSERT INTO expected_active_migrations(sequence_no, migration_key, checksum) VALUES
  (1, 'src/core/migrations/001_provider_portal_hardening.sql', '65089cd7335a53de173c9506e3b83d408211d5ba0897781fea660e4f62941fc9'),
  (2, 'src/core/migrations/002_provider_portal_management.sql', 'c81fc6d73de24c9d054bbc743199454479c851fe83608e42b2073a6601450f88'),
  (3, 'src/core/migrations/003_admin_catalog_actions.sql', '7c98778fce3f939297dd370d4a23972e0b8c913ae0d2aec9a06e1a71db7ace20'),
  (4, 'src/core/migrations/004_lsevin_media_ownership.sql', '3b1a7650fd79eeffe02ad4da1f29ef02336f1d8efb26586b99e57ab0f999ec40'),
  (5, 'src/core/migrations/005_module_runtime_state.sql', 'a6519232590c24ed1f9ef569b243e3d88f03b658bb9fa4a91be81ac0a0c8be7f'),
  (6, 'src/core/migrations/005_staff_shared_provider_media.sql', 'ca1e99dad641cdd1b8ea38c35ee790b79f00919e2e7e356fb83cc03ec16ef46b'),
  (7, 'src/core/migrations/009_lsevin_sso_sessions.sql', '08eb19a9341934a88b165d7bf9cb07d16a81246e0e4bacf6bd12889e73875158'),
  (8, 'src/core/migrations/010_provider_phone_country_codes.sql', 'e569e78025508531a0642ac2ee14bbfcbeef3ad6f37e9b45218fa7a54bac52c2'),
  (9, 'src/modules/admin-governance/migrations/001_admin_governance.sql', '4cce9588f4f9d8f03109a36ebda4bed32df1d23c2e6f6da68b3ac2743f34fdc7'),
  (10, 'src/modules/booking-management/migrations/001_booking_management.sql', '302d66710cb0509ae86ea9d7603e3b4fe3d565059f585a28c544a9e4c91aaf49'),
  (11, 'src/modules/booking-management/migrations/002_booking_management_hardening.sql', 'fd3151a0c67e298ba958e6c2e4f605a93aede48a53da35ab0fbf2d5f7933fdc1'),
  (12, 'src/modules/booking-management/migrations/003_booking_change_workflow.sql', '61d9536def0dac74cb9917e24687bda2b44963ff5a0439d41edba9585cb117f4'),
  (13, 'src/modules/media-library/migrations/001_media_library.sql', '97992bc67ff51f30fefca31c5d5f69c042d38b204c3cf479559ab936cd859ac7'),
  (14, 'src/modules/notifications-module/migrations/001_notifications_module.sql', 'ca8174735bbe08060c55a9aedbf50f09e72c6c77e9da7e5cb3b041d67cf69c18'),
  (15, 'src/modules/notifications-module/migrations/002_notifications_bridge.sql', '132ea342aa7014baf4c1bb28b0eccc7d8e37fc9e56e7efa65bf2e96db2605294'),
  (16, 'src/modules/notifications-module/migrations/031_reviews_workflow_templates.sql', '9caf587583e88e456253a850110c6a5fc2db94cea32d847199e705399310058f'),
  (17, 'src/modules/notifications-module/migrations/032_booking_lifecycle_templates.sql', '477702bc364dd5fa1f3ad4386d37014d49729d9d8bd719776beccfc975487187'),
  (18, 'src/modules/onboarding/migrations/001_onboarding_admin.sql', '20ab8044490d06562012328a36eb828b46bbb76022ea6ecaa5e6b42813456cb7'),
  (19, 'src/modules/onboarding/migrations/002_application_draft_workflow.sql', '61fbc68bd8922b05245c45f7b1ada9c7ae9c7957377b80b38aa7b9fbee31f118'),
  (20, 'src/modules/payment-billing/migrations/001_payment_billing.sql', '802a3140b636620651aec01535fe6038e812610e577b91d2a5b97c7cf956af3a'),
  (21, 'src/modules/payment-billing/migrations/002_payment_integrity.sql', '6bf564514b53ca8f9f3d049c6e856f60295308f896787f2acd771ef64e9f5ea7'),
  (22, 'src/modules/provider-access/migrations/001_provider_membership_lifecycle.sql', '4f5d81eae61bcc5256a7dca30191208b91e1a49067b2edc2d538786216f53cf6'),
  (23, 'src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql', '3f429e6a87e39d1fa2b4981a2a80dc6881e867cc07f1e4cdfb653e52c3665f84'),
  (24, 'src/modules/provider-finance-analytics/migrations/001a_prepare_finance_view_reconciliation.sql', '9580b6e0b6993a90705cc4008225625282801e2c76f76e626d0a37cf63e01091'),
  (25, 'src/modules/provider-finance-analytics/migrations/002_finance_views_reconciliation.sql', '3e79e3a688379f7692271e505146b855c3569b564f4766bf466d2033005c1fb6'),
  (26, 'src/modules/provider-finance-analytics/migrations/002_staff_compensation.sql', '1e3613c15f6c61784e75804e2e02e769f067b4ab7a992a6619ad0128125931ba'),
  (27, 'src/modules/provider-portal/migrations/001_provider_portal.sql', 'b05f7f5915c5ecc695666e3153b8f219ae859812f36ac9e74ae53d9c9dc5e3e1'),
  (28, 'src/modules/reporting-analytics/migrations/001_reporting_analytics.sql', '642b3a85bdb125fd3745342af7f346ae0459fdb7a005023890c138d2ce814096'),
  (29, 'src/modules/reviews/migrations/001_provider_staff_review_workflow.sql', '97f3a448257ec5aba2721126c40f766b99a9c7fe4ff1f4f559037685e3019e87'),
  (30, 'src/modules/reviews/migrations/001_review_reply_roles.sql', '883b1d7833b7967d53145591d7cbc05780902a1fa8349addc2dd4d5b6ecd83e2'),
  (31, 'src/modules/reviews-standalone/migrations/001_reviews_standalone.sql', '53ae33820749ceafa0b7b3c026b84ec1c461f0c12b1e7cd8a07525e280faa78c'),
  (32, 'src/modules/ticketing/migrations/001_ticketing.sql', 'd1cbe12505d5f057c3a6884212c82c0474d8e97a58465a3854df6f973d8e67f1');

-- Check all active history rows before applying anything. A changed applied SQL
-- file is a deployment error, not something the publisher is allowed to repair.
SELECT (count(*) > 0) AS active_drift
FROM public.lsevin_provider_portal_migrations h
JOIN expected_active_migrations e USING (migration_key)
WHERE lower(h.checksum) <> e.checksum
\gset

\if :active_drift
  \echo [migrate] ERROR: checksum drift detected in an already-applied active migration.
  SELECT h.migration_key, h.checksum AS recorded_checksum, e.checksum AS expected_checksum
  FROM public.lsevin_provider_portal_migrations h
  JOIN expected_active_migrations e USING (migration_key)
  WHERE lower(h.checksum) <> e.checksum
  ORDER BY e.sequence_no;
  SELECT pg_advisory_unlock(761602180001::bigint);
  \quit 4
\endif

\echo [migrate] active migration checksums verified

\set migration_key 'src/core/migrations/001_provider_portal_hardening.sql'
\set migration_checksum '65089cd7335a53de173c9506e3b83d408211d5ba0897781fea660e4f62941fc9'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/001_provider_portal_hardening.sql
\else
  \echo [migrate] apply src/core/migrations/001_provider_portal_hardening.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/001_provider_portal_hardening.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/001_provider_portal_hardening.sql
\endif

\set migration_key 'src/core/migrations/002_provider_portal_management.sql'
\set migration_checksum 'c81fc6d73de24c9d054bbc743199454479c851fe83608e42b2073a6601450f88'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/002_provider_portal_management.sql
\else
  \echo [migrate] apply src/core/migrations/002_provider_portal_management.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/002_provider_portal_management.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/002_provider_portal_management.sql
\endif

\set migration_key 'src/core/migrations/003_admin_catalog_actions.sql'
\set migration_checksum '7c98778fce3f939297dd370d4a23972e0b8c913ae0d2aec9a06e1a71db7ace20'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/003_admin_catalog_actions.sql
\else
  \echo [migrate] apply src/core/migrations/003_admin_catalog_actions.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/003_admin_catalog_actions.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/003_admin_catalog_actions.sql
\endif

\set migration_key 'src/core/migrations/004_lsevin_media_ownership.sql'
\set migration_checksum '3b1a7650fd79eeffe02ad4da1f29ef02336f1d8efb26586b99e57ab0f999ec40'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/004_lsevin_media_ownership.sql
\else
  \echo [migrate] apply src/core/migrations/004_lsevin_media_ownership.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/004_lsevin_media_ownership.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/004_lsevin_media_ownership.sql
\endif

\set migration_key 'src/core/migrations/005_module_runtime_state.sql'
\set migration_checksum 'a6519232590c24ed1f9ef569b243e3d88f03b658bb9fa4a91be81ac0a0c8be7f'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/005_module_runtime_state.sql
\else
  \echo [migrate] apply src/core/migrations/005_module_runtime_state.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/005_module_runtime_state.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/005_module_runtime_state.sql
\endif

\set migration_key 'src/core/migrations/005_staff_shared_provider_media.sql'
\set migration_checksum 'ca1e99dad641cdd1b8ea38c35ee790b79f00919e2e7e356fb83cc03ec16ef46b'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/005_staff_shared_provider_media.sql
\else
  \echo [migrate] apply src/core/migrations/005_staff_shared_provider_media.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/005_staff_shared_provider_media.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/005_staff_shared_provider_media.sql
\endif

\set migration_key 'src/core/migrations/009_lsevin_sso_sessions.sql'
\set migration_checksum '08eb19a9341934a88b165d7bf9cb07d16a81246e0e4bacf6bd12889e73875158'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/009_lsevin_sso_sessions.sql
\else
  \echo [migrate] apply src/core/migrations/009_lsevin_sso_sessions.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/009_lsevin_sso_sessions.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/009_lsevin_sso_sessions.sql
\endif

\set migration_key 'src/core/migrations/010_provider_phone_country_codes.sql'
\set migration_checksum 'e569e78025508531a0642ac2ee14bbfcbeef3ad6f37e9b45218fa7a54bac52c2'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/core/migrations/010_provider_phone_country_codes.sql
\else
  \echo [migrate] apply src/core/migrations/010_provider_phone_country_codes.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir core/010_provider_phone_country_codes.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/core/migrations/010_provider_phone_country_codes.sql
\endif

\set migration_key 'src/modules/admin-governance/migrations/001_admin_governance.sql'
\set migration_checksum '4cce9588f4f9d8f03109a36ebda4bed32df1d23c2e6f6da68b3ac2743f34fdc7'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/admin-governance/migrations/001_admin_governance.sql
\else
  \echo [migrate] apply src/modules/admin-governance/migrations/001_admin_governance.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/admin-governance/migrations/001_admin_governance.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/admin-governance/migrations/001_admin_governance.sql
\endif

\set migration_key 'src/modules/booking-management/migrations/001_booking_management.sql'
\set migration_checksum '302d66710cb0509ae86ea9d7603e3b4fe3d565059f585a28c544a9e4c91aaf49'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/booking-management/migrations/001_booking_management.sql
\else
  \echo [migrate] apply src/modules/booking-management/migrations/001_booking_management.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/booking-management/migrations/001_booking_management.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/booking-management/migrations/001_booking_management.sql
\endif

\set migration_key 'src/modules/booking-management/migrations/002_booking_management_hardening.sql'
\set migration_checksum 'fd3151a0c67e298ba958e6c2e4f605a93aede48a53da35ab0fbf2d5f7933fdc1'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/booking-management/migrations/002_booking_management_hardening.sql
\else
  \echo [migrate] apply src/modules/booking-management/migrations/002_booking_management_hardening.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/booking-management/migrations/002_booking_management_hardening.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/booking-management/migrations/002_booking_management_hardening.sql
\endif

\set migration_key 'src/modules/booking-management/migrations/003_booking_change_workflow.sql'
\set migration_checksum '61d9536def0dac74cb9917e24687bda2b44963ff5a0439d41edba9585cb117f4'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/booking-management/migrations/003_booking_change_workflow.sql
\else
  \echo [migrate] apply src/modules/booking-management/migrations/003_booking_change_workflow.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/booking-management/migrations/003_booking_change_workflow.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/booking-management/migrations/003_booking_change_workflow.sql
\endif

\set migration_key 'src/modules/media-library/migrations/001_media_library.sql'
\set migration_checksum '97992bc67ff51f30fefca31c5d5f69c042d38b204c3cf479559ab936cd859ac7'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/media-library/migrations/001_media_library.sql
\else
  \echo [migrate] apply src/modules/media-library/migrations/001_media_library.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/media-library/migrations/001_media_library.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/media-library/migrations/001_media_library.sql
\endif

\set migration_key 'src/modules/notifications-module/migrations/001_notifications_module.sql'
\set migration_checksum 'ca8174735bbe08060c55a9aedbf50f09e72c6c77e9da7e5cb3b041d67cf69c18'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/notifications-module/migrations/001_notifications_module.sql
\else
  \echo [migrate] apply src/modules/notifications-module/migrations/001_notifications_module.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/notifications-module/migrations/001_notifications_module.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/notifications-module/migrations/001_notifications_module.sql
\endif

\set migration_key 'src/modules/notifications-module/migrations/002_notifications_bridge.sql'
\set migration_checksum '132ea342aa7014baf4c1bb28b0eccc7d8e37fc9e56e7efa65bf2e96db2605294'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/notifications-module/migrations/002_notifications_bridge.sql
\else
  \echo [migrate] apply src/modules/notifications-module/migrations/002_notifications_bridge.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/notifications-module/migrations/002_notifications_bridge.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/notifications-module/migrations/002_notifications_bridge.sql
\endif

\set migration_key 'src/modules/notifications-module/migrations/031_reviews_workflow_templates.sql'
\set migration_checksum '9caf587583e88e456253a850110c6a5fc2db94cea32d847199e705399310058f'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/notifications-module/migrations/031_reviews_workflow_templates.sql
\else
  \echo [migrate] apply src/modules/notifications-module/migrations/031_reviews_workflow_templates.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/notifications-module/migrations/031_reviews_workflow_templates.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/notifications-module/migrations/031_reviews_workflow_templates.sql
\endif

\set migration_key 'src/modules/notifications-module/migrations/032_booking_lifecycle_templates.sql'
\set migration_checksum '477702bc364dd5fa1f3ad4386d37014d49729d9d8bd719776beccfc975487187'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/notifications-module/migrations/032_booking_lifecycle_templates.sql
\else
  \echo [migrate] apply src/modules/notifications-module/migrations/032_booking_lifecycle_templates.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/notifications-module/migrations/032_booking_lifecycle_templates.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/notifications-module/migrations/032_booking_lifecycle_templates.sql
\endif

\set migration_key 'src/modules/onboarding/migrations/001_onboarding_admin.sql'
\set migration_checksum '20ab8044490d06562012328a36eb828b46bbb76022ea6ecaa5e6b42813456cb7'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/onboarding/migrations/001_onboarding_admin.sql
\else
  \echo [migrate] apply src/modules/onboarding/migrations/001_onboarding_admin.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/onboarding/migrations/001_onboarding_admin.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/onboarding/migrations/001_onboarding_admin.sql
\endif

\set migration_key 'src/modules/onboarding/migrations/002_application_draft_workflow.sql'
\set migration_checksum '61fbc68bd8922b05245c45f7b1ada9c7ae9c7957377b80b38aa7b9fbee31f118'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/onboarding/migrations/002_application_draft_workflow.sql
\else
  \echo [migrate] apply src/modules/onboarding/migrations/002_application_draft_workflow.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/onboarding/migrations/002_application_draft_workflow.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/onboarding/migrations/002_application_draft_workflow.sql
\endif

\set migration_key 'src/modules/payment-billing/migrations/001_payment_billing.sql'
\set migration_checksum '802a3140b636620651aec01535fe6038e812610e577b91d2a5b97c7cf956af3a'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/payment-billing/migrations/001_payment_billing.sql
\else
  \echo [migrate] apply src/modules/payment-billing/migrations/001_payment_billing.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/payment-billing/migrations/001_payment_billing.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/payment-billing/migrations/001_payment_billing.sql
\endif

\set migration_key 'src/modules/payment-billing/migrations/002_payment_integrity.sql'
\set migration_checksum '6bf564514b53ca8f9f3d049c6e856f60295308f896787f2acd771ef64e9f5ea7'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/payment-billing/migrations/002_payment_integrity.sql
\else
  \echo [migrate] apply src/modules/payment-billing/migrations/002_payment_integrity.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/payment-billing/migrations/002_payment_integrity.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/payment-billing/migrations/002_payment_integrity.sql
\endif

\set migration_key 'src/modules/provider-access/migrations/001_provider_membership_lifecycle.sql'
\set migration_checksum '4f5d81eae61bcc5256a7dca30191208b91e1a49067b2edc2d538786216f53cf6'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/provider-access/migrations/001_provider_membership_lifecycle.sql
\else
  \echo [migrate] apply src/modules/provider-access/migrations/001_provider_membership_lifecycle.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/provider-access/migrations/001_provider_membership_lifecycle.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/provider-access/migrations/001_provider_membership_lifecycle.sql
\endif

\set migration_key 'src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql'
\set migration_checksum '3f429e6a87e39d1fa2b4981a2a80dc6881e867cc07f1e4cdfb653e52c3665f84'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql
\else
  \echo [migrate] apply src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/provider-finance-analytics/migrations/001_provider_finance_analytics.sql
\endif

\set migration_key 'src/modules/provider-finance-analytics/migrations/001a_prepare_finance_view_reconciliation.sql'
\set migration_checksum '9580b6e0b6993a90705cc4008225625282801e2c76f76e626d0a37cf63e01091'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/provider-finance-analytics/migrations/001a_prepare_finance_view_reconciliation.sql
\else
  \echo [migrate] apply src/modules/provider-finance-analytics/migrations/001a_prepare_finance_view_reconciliation.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/provider-finance-analytics/migrations/001a_prepare_finance_view_reconciliation.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/provider-finance-analytics/migrations/001a_prepare_finance_view_reconciliation.sql
\endif

\set migration_key 'src/modules/provider-finance-analytics/migrations/002_finance_views_reconciliation.sql'
\set migration_checksum '3e79e3a688379f7692271e505146b855c3569b564f4766bf466d2033005c1fb6'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/provider-finance-analytics/migrations/002_finance_views_reconciliation.sql
\else
  \echo [migrate] apply src/modules/provider-finance-analytics/migrations/002_finance_views_reconciliation.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/provider-finance-analytics/migrations/002_finance_views_reconciliation.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/provider-finance-analytics/migrations/002_finance_views_reconciliation.sql
\endif

\set migration_key 'src/modules/provider-finance-analytics/migrations/002_staff_compensation.sql'
\set migration_checksum '1e3613c15f6c61784e75804e2e02e769f067b4ab7a992a6619ad0128125931ba'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/provider-finance-analytics/migrations/002_staff_compensation.sql
\else
  \echo [migrate] apply src/modules/provider-finance-analytics/migrations/002_staff_compensation.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/provider-finance-analytics/migrations/002_staff_compensation.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/provider-finance-analytics/migrations/002_staff_compensation.sql
\endif

\set migration_key 'src/modules/provider-portal/migrations/001_provider_portal.sql'
\set migration_checksum 'b05f7f5915c5ecc695666e3153b8f219ae859812f36ac9e74ae53d9c9dc5e3e1'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/provider-portal/migrations/001_provider_portal.sql
\else
  \echo [migrate] apply src/modules/provider-portal/migrations/001_provider_portal.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/provider-portal/migrations/001_provider_portal.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/provider-portal/migrations/001_provider_portal.sql
\endif

\set migration_key 'src/modules/reporting-analytics/migrations/001_reporting_analytics.sql'
\set migration_checksum '642b3a85bdb125fd3745342af7f346ae0459fdb7a005023890c138d2ce814096'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/reporting-analytics/migrations/001_reporting_analytics.sql
\else
  \echo [migrate] apply src/modules/reporting-analytics/migrations/001_reporting_analytics.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/reporting-analytics/migrations/001_reporting_analytics.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/reporting-analytics/migrations/001_reporting_analytics.sql
\endif

\set migration_key 'src/modules/reviews/migrations/001_provider_staff_review_workflow.sql'
\set migration_checksum '97f3a448257ec5aba2721126c40f766b99a9c7fe4ff1f4f559037685e3019e87'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/reviews/migrations/001_provider_staff_review_workflow.sql
\else
  \echo [migrate] apply src/modules/reviews/migrations/001_provider_staff_review_workflow.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/reviews/migrations/001_provider_staff_review_workflow.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/reviews/migrations/001_provider_staff_review_workflow.sql
\endif

\set migration_key 'src/modules/reviews/migrations/001_review_reply_roles.sql'
\set migration_checksum '883b1d7833b7967d53145591d7cbc05780902a1fa8349addc2dd4d5b6ecd83e2'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/reviews/migrations/001_review_reply_roles.sql
\else
  \echo [migrate] apply src/modules/reviews/migrations/001_review_reply_roles.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/reviews/migrations/001_review_reply_roles.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/reviews/migrations/001_review_reply_roles.sql
\endif

\set migration_key 'src/modules/reviews-standalone/migrations/001_reviews_standalone.sql'
\set migration_checksum '53ae33820749ceafa0b7b3c026b84ec1c461f0c12b1e7cd8a07525e280faa78c'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/reviews-standalone/migrations/001_reviews_standalone.sql
\else
  \echo [migrate] apply src/modules/reviews-standalone/migrations/001_reviews_standalone.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/reviews-standalone/migrations/001_reviews_standalone.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/reviews-standalone/migrations/001_reviews_standalone.sql
\endif

\set migration_key 'src/modules/ticketing/migrations/001_ticketing.sql'
\set migration_checksum 'd1cbe12505d5f057c3a6884212c82c0474d8e97a58465a3854df6f973d8e67f1'
SELECT EXISTS (SELECT 1 FROM public.lsevin_provider_portal_migrations WHERE migration_key = :'migration_key') AS migration_applied \gset
\if :migration_applied
  \echo [migrate] skip src/modules/ticketing/migrations/001_ticketing.sql
\else
  \echo [migrate] apply src/modules/ticketing/migrations/001_ticketing.sql
  BEGIN;
  SET LOCAL lock_timeout = '60s';
  \ir modules/ticketing/migrations/001_ticketing.sql
  INSERT INTO public.lsevin_provider_portal_migrations(migration_key, checksum, applied_at) VALUES (:'migration_key', :'migration_checksum', now());
  COMMIT;
  \echo [migrate] applied src/modules/ticketing/migrations/001_ticketing.sql
\endif

SELECT (count(*) = 32) AS migration_set_complete
FROM expected_active_migrations e
JOIN public.lsevin_provider_portal_migrations h USING (migration_key)
WHERE lower(h.checksum) = e.checksum
\gset

\if :migration_set_complete
  \echo [migrate] success: all 32 active migrations are recorded with expected checksums
\else
  \echo [migrate] ERROR: active migration set is incomplete after publication.
  SELECT e.sequence_no, e.migration_key
  FROM expected_active_migrations e
  LEFT JOIN public.lsevin_provider_portal_migrations h
    ON h.migration_key=e.migration_key AND lower(h.checksum)=e.checksum
  WHERE h.migration_key IS NULL
  ORDER BY e.sequence_no;
  SELECT pg_advisory_unlock(761602180001::bigint);
  \quit 5
\endif

SELECT pg_advisory_unlock(761602180001::bigint);
\echo [migrate] complete
