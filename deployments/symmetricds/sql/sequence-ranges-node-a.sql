-- sequence-ranges-node-a.sql
-- Prevents primary-key / counter collisions between two writable nodes WITHOUT touching node B:
-- node A (Iran) moves every auto-number sequence into a high range; node B keeps its sequences,
-- numbering and gaplessness exactly as they are today.
--   integer / smallint columns  -> A starts at 1,000,000,000
--   bigint columns               -> A starts at 1,000,000,000,000
-- Without this both sides hand out the same id and SymmetricDS silently keeps one row (rehearsal T8a).
--
-- Run ONLY on node A, once, BEFORE enabling sync (safe to re-run; never moves a sequence backwards):
--   psql -d lsevin -f sequence-ranges-node-a.sql
--
-- Covers identity columns and any column defaulting to nextval(...), including non-key business
-- counters (accounting.invoice_number, journal entry_number, wallet_ledger.seq, ...). Numbers created
-- on A therefore live in their own range (e.g. invoice 1000000000001), while B continues 1,2,3...
\set ON_ERROR_STOP on
do $$
declare
  r record; seqname text; base bigint; cur bigint; mx bigint; nxt bigint; typ text;
begin
  for r in
    select n.nspname sch, c.relname tbl, a.attname col, (a.attidentity::text <> '') is_identity,
           a.atttypid::regtype::text typ, pg_get_expr(d.adbin, d.adrelid) defexpr
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where c.relkind in ('r','p') and a.attnum > 0 and not a.attisdropped
      and n.nspname not in ('pg_catalog','information_schema') and c.relname !~ '^sym_'
      and (a.attidentity::text <> '' or pg_get_expr(d.adbin, d.adrelid) like 'nextval(%')
  loop
    typ := r.typ;
    base := case when typ = 'bigint' then 1000000000000 else 1000000000 end;
    if typ = 'smallint' then raise notice 'skip smallint %.%.%', r.sch, r.tbl, r.col; continue; end if;
    seqname := pg_get_serial_sequence(format('%I.%I', r.sch, r.tbl), r.col);
    if seqname is null and r.defexpr is not null then
      seqname := (regexp_match(r.defexpr, 'nextval\(''([^'']+)''::regclass\)'))[1];
    end if;
    if seqname is null then raise exception 'no sequence found for %.%.%', r.sch, r.tbl, r.col; end if;
    execute format('select coalesce(max(%I),0) from %I.%I', r.col, r.sch, r.tbl) into mx;
    execute format('select last_value from %s', seqname) into cur;
    nxt := greatest(base, mx + 1, cur + 1);
    if cur >= base then raise notice '% already in range (last_value %)', seqname, cur; continue; end if;
    if r.is_identity then
      execute format('alter table %I.%I alter column %I restart with %s', r.sch, r.tbl, r.col, nxt);
    else
      execute format('alter sequence %s restart with %s', seqname, nxt);
    end if;
    raise notice '%.%.% (%) -> next %', r.sch, r.tbl, r.col, typ, nxt;
  end loop;
end $$;
