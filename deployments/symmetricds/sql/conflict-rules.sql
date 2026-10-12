-- conflict-rules.sql - run on the HUB (B). Config tables replicate to node A automatically.
-- For every synced table that has a NOT NULL "last modified" timestamp column, concurrent edits of the same
-- row resolve to the NEWEST edit on both sides (SymmetricDS USE_TIMESTAMP / NEWER_WINS), in both directions.
-- Tables without such a column keep SymmetricDS' default (apply the incoming change).
-- Candidate column names, in priority order: last_modified_date, updated_at, modified_at, last_modified, updated_on.
-- Re-runnable: existing rules are replaced.
\set ON_ERROR_STOP on
begin;
delete from sym_conflict where conflict_id like 'nw%';

with candidates as (
  select t.source_schema_name sch, t.source_table_name tbl, a.attname col,
         array_position(array['last_modified_date','updated_at','modified_at','last_modified','updated_on'], lower(a.attname::text)) prio
  from sym_trigger t
  join pg_namespace n on n.nspname = t.source_schema_name
  join pg_class c on c.relnamespace = n.oid and c.relname = t.source_table_name and c.relkind = 'r'
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped and a.attnotnull
  where lower(a.attname::text) in ('last_modified_date','updated_at','modified_at','last_modified','updated_on')
    and a.atttypid in ('timestamptz'::regtype, 'timestamp'::regtype)
), best as (
  select distinct on (sch, tbl) sch, tbl, col from candidates order by sch, tbl, prio
)
insert into sym_conflict (conflict_id, source_node_group_id, target_node_group_id, target_schema_name, target_table_name,
                          detect_type, detect_expression, resolve_type, ping_back, resolve_changes_only, resolve_row_only,
                          create_time, last_update_time)
select 'nw' || substr(md5(sch || '.' || tbl), 1, 20) || d.suffix, d.src, d.dst, sch, tbl,
       'USE_TIMESTAMP', col, 'NEWER_WINS', 'OFF', 0, 1, now(), now()
from best
cross join (values ('c', 'client', 'server'), ('s', 'server', 'client')) as d(suffix, src, dst);

commit;
select count(*) as conflict_rules, count(distinct target_schema_name || '.' || target_table_name) as tables from sym_conflict;
