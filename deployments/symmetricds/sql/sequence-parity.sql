-- sequence-parity.sql
-- Prevents primary-key collisions between two writable nodes by giving each node its own
-- number space: node A (Iran) generates ODD numbers, node B generates EVEN numbers.
-- Without this, both sides hand out the same id for different rows and SymmetricDS silently
-- keeps only one of them (verified in rehearsal test T8a).
--
-- Usage (run once per database, BEFORE enabling bidirectional sync, safe to re-run):
--   psql -d lsevin -v parity=1 -f sequence-parity.sql    # node A  -> odd
--   psql -d lsevin -v parity=0 -f sequence-parity.sql    # node B  -> even
--
-- Covers every identity column and every column defaulting to nextval(...), including
-- non-key business counters (accounting.invoice_number, journal entry_number, ledger seq).
-- Each sequence is restarted ABOVE the current max by a safety margin of 1000.
-- NOTE: numbers become non-contiguous (gaps). If any counter must be gapless (e.g. legal
-- invoice numbering), that counter must be written on ONE node only instead.
\set ON_ERROR_STOP on
select set_config('lsevin.parity', :'parity', false);

do $$
declare
  r record; par int := current_setting('lsevin.parity')::int;
  mx bigint; nxt bigint; seqname text;
begin
  if par not in (0,1) then raise exception 'parity must be 0 (even) or 1 (odd)'; end if;
  for r in
    select n.nspname sch, c.relname tbl, a.attname col, (a.attidentity::text <> '') is_identity,
           pg_get_expr(d.adbin, d.adrelid) defexpr
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where c.relkind in ('r','p') and a.attnum > 0 and not a.attisdropped
      and n.nspname not in ('pg_catalog','information_schema') and c.relname !~ '^sym_'
      and (a.attidentity::text <> '' or pg_get_expr(d.adbin, d.adrelid) like 'nextval(%')
  loop
    execute format('select coalesce(max(%I),0) from %I.%I', r.col, r.sch, r.tbl) into mx;
    seqname := pg_get_serial_sequence(format('%I.%I', r.sch, r.tbl), r.col);
    -- sequences not owned by the column: read the name from nextval('schema.seq'::regclass)
    if seqname is null and r.defexpr is not null then
      seqname := (regexp_match(r.defexpr, 'nextval\(''([^'']+)''::regclass\)'))[1];
    end if;
    if seqname is null then raise exception 'no sequence found for %.%.%', r.sch, r.tbl, r.col; end if;
    execute format('select last_value from %s', seqname) into nxt;
    mx := greatest(mx, nxt);
    nxt := mx + 1000;
    if nxt % 2 <> par then nxt := nxt + 1; end if;
    if r.is_identity then
      execute format('alter table %I.%I alter column %I set increment by 2', r.sch, r.tbl, r.col);
      execute format('alter table %I.%I alter column %I restart with %s', r.sch, r.tbl, r.col, nxt);
    else
      execute format('alter sequence %s increment by 2 restart with %s', seqname, nxt);
    end if;
    raise notice '% .% .% -> next % (every 2)', r.sch, r.tbl, r.col, nxt;
  end loop;
end $$;
