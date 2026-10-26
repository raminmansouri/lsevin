-- register-schema-tables.sql - registers every table of one schema for two-way SymmetricDS replication, copying the configuration of tour.departures.
-- Run on the HUB (server B) database: psql -v schema=tour -f register-schema-tables.sql   (dry run: replace the final commit with rollback).
-- Afterwards: A pulls the configuration and both sides create their triggers by themselves; existing rows need reload requests
-- (insert into sym_table_reload_request ...). Known trap: a table with a DEFERRABLE unique constraint (tour.itinerary_stops) fails the initial load
-- with 'ON CONFLICT does not support deferrable unique constraints': skip that batch and copy the rows once with COPY in replica mode.
-- Excluded on purpose: per-user history and caches.
-- Registers the tours tables for two-way replication, exactly like tour.departures (copy of its configuration).
-- Excluded on purpose: recent_searches, recent_views (per-user history), weather_cache (cache).
begin;
create temp table _tbl on commit drop as
  select t.table_name from information_schema.tables t
  where t.table_schema=:'schema' and t.table_type='BASE TABLE'
    and t.table_name not in ('recent_searches','recent_views','weather_cache')
    and exists (select 1 from information_schema.table_constraints c where c.table_schema=:'schema' and c.table_name=t.table_name and c.constraint_type='PRIMARY KEY')
    and not exists (select 1 from sym_trigger s where s.source_schema_name=:'schema' and s.source_table_name=t.table_name);
create temp table _upd on commit drop as
  select table_name from _tbl where exists (select 1 from information_schema.columns k where k.table_schema=:'schema' and k.table_name=_tbl.table_name and k.column_name='updated_at');

insert into sym_trigger
select (jsonb_populate_record(null::sym_trigger, to_jsonb(tpl) || jsonb_build_object('trigger_id',:'schema'||'__'||tbl.table_name,'source_table_name',tbl.table_name,'create_time',now(),'last_update_time',now()))).*
from (select * from sym_trigger where trigger_id=:'schema'||'__departures') tpl cross join _tbl tbl;

insert into sym_trigger_router
select (jsonb_populate_record(null::sym_trigger_router, to_jsonb(r) || jsonb_build_object('trigger_id',:'schema'||'__'||tbl.table_name,'create_time',now(),'last_update_time',now()))).*
from sym_trigger_router r cross join _tbl tbl where r.trigger_id=:'schema'||'__departures';

insert into sym_conflict
select (jsonb_populate_record(null::sym_conflict, to_jsonb(c) || jsonb_build_object(
   'conflict_id',:'schema'||'_'||u.table_name||(case when c.source_node_group_id='client' then '_c' else '_s' end),
   'target_table_name',u.table_name,'create_time',now(),'last_update_time',now()))).*
from sym_conflict c cross join _upd u
where c.target_schema_name=:'schema' and c.target_table_name='departures';

select 'NEW triggers='||(select count(*) from sym_trigger where trigger_id like 'tour\_\_%' and create_time > now() - interval '1 minute')
    || ' routes='||(select count(*) from sym_trigger_router where trigger_id like 'tour\_\_%' and create_time > now() - interval '1 minute')
    || ' conflict rules='||(select count(*) from sym_conflict where target_schema_name=:'schema' and create_time > now() - interval '1 minute');
select 'tables to register: '||string_agg(table_name, ', ' order by table_name) from _tbl;
commit;
