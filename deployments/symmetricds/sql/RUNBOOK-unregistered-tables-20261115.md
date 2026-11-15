# 2026-11-15: tables whose data never replicated between A and B (DONE except the items under "Still open")

## What was wrong
The SymmetricDS engine was healthy (0 failed batches, 0 ignored rows), but 37 feature tables had **no trigger**, so rows written on one
site never reached the other, and several already-registered tables had drifted (rows created on A that never reached B and the reverse).
Found with `tests/lsevin-sync-verify` logic (`table-fingerprints.sql` run on A and B, twice) plus a row-level JSON diff.

## What was done (hub = B, via `agent@202.133.90.50`; A direct)
1. `register-schema-tables.sql` now has an allow-list (`-v only=a,b,c`) and refuses `sym_*` tables. A first dry run of the unguarded script
   WOULD have registered SymmetricDS's own `sym_*` tables in schema public: always dry-run (swap the final `commit;` for `rollback;`).
2. Registered 37 tables (trigger + 2 routers each, conflict rules for `updated_at` tables), A pulled them: 804 triggers on both sides.
   * shop: api_audit_log, api_tokens, order_office_pickups, product_proposals, seller_categories, seller_order_pickups, shipping_settings
   * category.public_slug_history, consultation.video_doctor_packages, ai.knowledge_chunks
   * public (27): crm_entity_role_definitions, crm_entity_roles, integration_entities/events/sources, media_items, notification_* (5),
     organization_delegations/role_members/roles, push_devices, sales_dial_requests, work_calendar_blocks, work_google_connections,
     work_google_links, work_import_refs, work_import_runs, work_meeting_attendees/links, work_meetings, work_plan_deadline_state,
     work_planner_items, work_planner_preferences
3. Initial loads. Rule learnt: a reload request is processed only when it is created on the **source** node's own database
   (B to A: insert on the hub with source 000 / target 001 / router `server_2_client`; A to B: insert on A with source 001 / target 000 /
   router `client_2_server`; `create_table=0, delete_first=0`). The old "unprocessed" rows on A (source 000) were stale, not lost work.
   * B to A: work_planner_items, work_calendar_blocks, work_plan_deadline_state, work_planner_preferences, ai.usage_daily, ai.conversations,
     shop.cart_items, shop.order_items, public.sales_pipeline_stages, shop.product_attributes
   * A to B: category.public_slug_history, consultation.video_doctors, video_sessions, video_session_payments (real sessions and payments created on A)
   * public.organization_roles has a self-referencing FK (parent_id): a reload could insert a child first and error the channel, so its 5 rows
     were inserted on A in dependency order in one transaction with `session_replication_role = replica`.
4. Verified: row-level diff of every table above identical on A and B; 0 failed batches, 0 errors on both nodes.

## Deliberately NOT registered
sessions, password_reset_tokens, auth_captcha_used, work_google_oauth_states, background_jobs (a replicated queue would be processed twice),
schema_migrations and lsevin_provider_portal_migrations (per-site migration state), panel_*, phone_login_codes, refresh_tokens, sso_sessions,
rate_limit_hits, tour caches, location_geonames_refs (reference data), location_name_fix_* (B-only backups).

## Still open
* `public.work_items_all` (+ `work_goal_steps`, and the CRM columns on `parties`): B has CRM migrations A lacks (work/026, work/027, sales/011,
  connectors, revenue). Bring A's CRM to master first, then register them (`-v only=work_items_all,work_goal_steps`) and reload both ways.
  Registering `work_items_all` before A has its 6 report_* columns could error the channel.
* Provider portal on A is behind: `lsevin_provider_portal_migrations` 105 on A vs 111 on B, and schema `provider_consultations` (5 tables)
  exists only on B although its triggers are registered. The portal is not covered by the release sync.
* Shop platform seller: B's carts/orders use the default seller `lsevin` (ca3c93db); old rows use seller 31fffbad, and 423 products have two
  active offers (one per seller). B's version was pushed to A; whether the duplicate offers are intended needs a business decision.
* category slugs: A has `slug` for 5 staff, 1 service_provider and 21 provider_services that are NULL on B (and `provider_staffs.display_order` 0 vs 2).
  Not touched: it changes public URLs. Decide the direction, then reload that table.
* Timestamp-only differences (tour.settings/tours/departures/customer_state `updated_at`, shop.shipping_settings, category.locations
  `last_modified_date`) converge on the next write; no action.
