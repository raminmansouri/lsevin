-- Auto-number sequences that collide between the two sites (2026-11-04 incident).
--
-- Both sites write and SymmetricDS copies rows both ways, so the two sites must never hand
-- out the same auto-number. deployments/symmetricds/sql/sequence-ranges-node-a.sql moved
-- node A's sequences into a high range once, before the tour schema existed; tour.audit_log
-- and tour.tracking_points kept starting at 1 on A. A's audit rows 20..35 were copied to B
-- while B's sequence stood at 19, so every tours admin save on B (each writes an audit row)
-- failed with a unique violation shown as "این مورد قبلاً وجود دارد".
--
-- public.lsevin_align_sequences() applies the same rule to every sequence, every time:
--   node A (SymmetricDS group 'client'): bigint -> from 1,000,000,000,000, integer -> from 1,000,000,000
--   node B or a database without SymmetricDS: stays in the low range, past the highest low id
-- It never moves a sequence backwards. scripts/migrate.mjs calls it after applying migrations,
-- so tables created later are aligned on both sites without a manual step.

create or replace function public.lsevin_align_sequences() returns integer
language plpgsql as $$
declare
  r record; seqname text; base bigint; cur bigint; called boolean; mx bigint; nxt bigint;
  is_a boolean := false; changed integer := 0;
begin
  if to_regclass('public.sym_node_identity') is not null and to_regclass('public.sym_node') is not null then
    execute 'select exists (select 1 from public.sym_node_identity i join public.sym_node n on n.node_id = i.node_id
                             where n.node_group_id = ''client'')' into is_a;
  end if;

  for r in
    select n.nspname sch, c.relname tbl, a.attname col, a.atttypid::regtype::text typ,
           pg_get_expr(d.adbin, d.adrelid) defexpr
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
     where c.relkind in ('r', 'p') and a.attnum > 0 and not a.attisdropped
       and n.nspname not in ('pg_catalog', 'information_schema') and c.relname !~ '^sym_'
       and (a.attidentity::text <> '' or pg_get_expr(d.adbin, d.adrelid) like 'nextval(%')
  loop
    if r.typ not in ('bigint', 'integer') then continue; end if;
    base := case when r.typ = 'bigint' then 1000000000000 else 1000000000 end;
    seqname := pg_get_serial_sequence(format('%I.%I', r.sch, r.tbl), r.col);
    if seqname is null and r.defexpr is not null then
      seqname := (regexp_match(r.defexpr, 'nextval\(''([^'']+)''::regclass\)'))[1];
    end if;
    if seqname is null then continue; end if;

    execute format('select last_value, is_called from %s', seqname) into cur, called;
    if not called then cur := cur - 1; end if;  -- cur = the last number handed out

    if is_a then
      execute format('select max(%I) from %I.%I where %I >= %s', r.col, r.sch, r.tbl, r.col, base) into mx;
      nxt := greatest(base, coalesce(mx, 0) + 1, cur + 1);
    else
      execute format('select max(%I) from %I.%I where %I < %s', r.col, r.sch, r.tbl, r.col, base) into mx;
      nxt := greatest(coalesce(mx, 0) + 1, cur + 1);
    end if;

    if nxt > cur + 1 then
      perform setval(seqname, nxt, false);
      raise notice '%.%.% -> next %', r.sch, r.tbl, r.col, nxt;
      changed := changed + 1;
    end if;
  end loop;
  return changed;
end $$;

comment on function public.lsevin_align_sequences() is
  'Keeps auto-numbers of the two SymmetricDS sites in disjoint ranges (A high, B low); never moves a sequence backwards. Called by scripts/migrate.mjs.';

select public.lsevin_align_sequences();
