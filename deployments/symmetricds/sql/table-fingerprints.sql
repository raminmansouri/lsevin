-- table-fingerprints.sql - read-only. For every replicated table prints  <schema.table> | <row count> | <md5 of all rows ordered by primary key>.
-- Run the same file on A and B and diff the outputs (tests/lsevin-sync-verify does exactly that). Equal fingerprints = identical table.
-- Excluded: SymmetricDS's own tables and the tables the topology deliberately leaves node-local.
\set ON_ERROR_STOP off
\pset format unaligned
\pset tuples_only on
do $body$
declare r record; cols text; ord text; res text; fp text; n bigint;
begin
  create temp table if not exists fp_out(t text, n bigint, h text) on commit drop;
  for r in
    select c.oid, n.nspname, c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r' and n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_'
      and c.relname !~ '^sym_' and c.relname not in ('background_jobs', 'schema_migrations', '__EFMigrationsHistory', 'sessions', 'refresh_tokens',
          'phone_login_codes', 'sso_sessions', 'panel_sessions', 'panel_login_attempts', 'rate_limit_hits', 'analytics_visitor_sessions', 'Currency')
    order by 2, 3
  loop
    select string_agg(format('%I', a.attname), ',' order by k.ord) into ord
      from pg_index i cross join lateral unnest(i.indkey) with ordinality as k(attnum, ord)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
      where i.indrelid = r.oid and i.indisprimary;
    if ord is null then continue; end if;      -- tables without a primary key are not replicated
    begin
      execute format('select count(*), coalesce(md5(string_agg(x::text, %L order by %s)), %L) from %I.%I x', '|', ord, 'empty', r.nspname, r.relname) into n, fp;
      insert into fp_out values (r.nspname || '.' || r.relname, n, fp);
    exception when others then
      insert into fp_out values (r.nspname || '.' || r.relname, -1, 'error');
    end;
  end loop;
  -- results are printed by the select below (same session)
  perform 1;
  create temp table fp_keep as select * from fp_out;
end
$body$;
select t || ' | ' || n || ' | ' || h from fp_keep order by t;
