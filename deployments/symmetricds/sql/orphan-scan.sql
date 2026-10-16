-- orphan-scan.sql - read-only. Lists every foreign key that has rows pointing at a parent row that does not exist.
-- Replication runs with session_replication_role=replica (foreign keys are not checked while applying), so a parent row that never
-- arrived leaves "orphans" that PostgreSQL itself would have refused; pg_restore then also fails to re-create that foreign key.
-- Run on A and on B (tests/lsevin-sync-verify does both). Expected result: 0 foreign keys with orphans.
\set ON_ERROR_STOP off
create temp table orphan_report(constraint_name text, child text, parent text, orphans bigint);
do $body$
declare r record; n bigint; cond text; nn text;
begin
  for r in
    select c.conname, c.conrelid::regclass as child, c.confrelid::regclass as parent, c.conkey, c.confkey, c.conrelid, c.confrelid as pid
    from pg_constraint c
    where c.contype = 'f' and c.connamespace::regnamespace::text not in ('pg_catalog', 'information_schema')
  loop
    select string_agg(format('c.%I = p.%I', a.attname, fa.attname), ' and '),
           string_agg(format('c.%I is not null', a.attname), ' and ')
      into cond, nn
      from unnest(r.conkey, r.confkey) as k(ck, fk)
      join pg_attribute a on a.attrelid = r.conrelid and a.attnum = k.ck
      join pg_attribute fa on fa.attrelid = r.pid and fa.attnum = k.fk;
    begin
      execute format('select count(*) from %s c where %s and not exists (select 1 from %s p where %s)', r.child, nn, r.parent, cond) into n;
      if n > 0 then insert into orphan_report values (r.conname, r.child::text, r.parent::text, n); end if;
    exception when others then null;
    end;
  end loop;
end
$body$;
\pset format unaligned
\pset tuples_only on
select 'ORPHANS ' || orphans || ' : ' || child || ' -> ' || parent || '  (' || constraint_name || ')' from orphan_report order by orphans desc;
select 'foreign keys with orphans: ' || count(*) || ', orphan rows: ' || coalesce(sum(orphans), 0) from orphan_report;
