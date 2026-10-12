\set ON_ERROR_STOP on
begin;
insert into sym_node_group (node_group_id, description) values ('server','B - hub, only contacted'), ('client','A - connects out') on conflict do nothing;
-- client pushes to server (P); server waits for the client to pull (W): B never opens a connection
insert into sym_node_group_link (source_node_group_id, target_node_group_id, data_event_action) values ('client','server','P'), ('server','client','W') on conflict do nothing;
insert into sym_channel (channel_id, processing_order, max_batch_size, max_batch_to_send, enabled, description) values ('business', 10, 2000, 50, 1, 'application tables') on conflict do nothing;
insert into sym_router (router_id, source_node_group_id, target_node_group_id, router_type, create_time, last_update_time) values ('server_2_client','server','client','default',now(),now()), ('client_2_server','client','server','default',now(),now()) on conflict do nothing;

-- one trigger per base table with a primary key, excluding queues / history / sessions
insert into sym_trigger (trigger_id, source_schema_name, source_table_name, channel_id, last_update_time, create_time)
select left(n.nspname||'__'||c.relname,128), n.nspname, c.relname, 'business', now(), now()
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind='r' and n.nspname not in ('pg_catalog','information_schema','pg_toast')
  and c.relname !~ '^sym_'
  and exists (select 1 from pg_constraint k where k.conrelid=c.oid and k.contype='p')
  and not (c.relname in ('background_jobs','schema_migrations','lsevin_provider_portal_migrations','__EFMigrationsHistory','sessions','refresh_tokens','phone_login_codes','sso_sessions','panel_sessions','panel_login_attempts','rate_limit_hits'))
on conflict do nothing;

insert into sym_trigger_router (trigger_id, router_id, initial_load_order, create_time, last_update_time)
select t.trigger_id, r.router_id, 100, now(), now() from sym_trigger t cross join sym_router r on conflict do nothing;
commit;
select count(*) as triggers_configured from sym_trigger;
select count(*) as trigger_router_links from sym_trigger_router;
