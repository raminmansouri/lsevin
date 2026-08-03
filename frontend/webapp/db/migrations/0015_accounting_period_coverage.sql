-- ---------------------------------------------------------------------------
-- 0015 — make sure every open fiscal year actually has periods to post into.
--
-- Found on production on 2026-08-03: the only fiscal period that existed was
-- 2026-07. The fiscal *year* was open and ran to December, but nobody had created
-- the months. postJournalEntry resolves an entry's period from its date, so from
-- 1 August the ledger could not accept a single document — not a manual one, and
-- not the automatic ones a deposit or a withdrawal posts either.
--
-- A period table that has to be topped up by hand will always eventually run out
-- on a date nobody is watching. This backfills the missing months and leaves a
-- function to call for the next year, so the failure mode becomes "run this"
-- rather than "the books silently stopped accepting entries".
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- Generates the missing monthly periods for one fiscal year.
--
-- Idempotent: months that already exist are skipped, so it is safe to run again
-- and safe to run against a year that is partly set up — which is exactly the
-- state production was in.
-- ---------------------------------------------------------------------------
create or replace function accounting.fn_ensure_monthly_periods(p_fiscal_year_id uuid)
returns integer
language plpgsql as $$
declare
  v_year    record;
  v_month   date;
  v_starts  date;
  v_ends    date;
  v_code    text;
  v_created integer := 0;
begin
  select id, code, starts_on, ends_on into v_year
    from accounting.fiscal_years
   where id = p_fiscal_year_id;

  if v_year.id is null then
    raise exception 'Unknown fiscal year %', p_fiscal_year_id;
  end if;

  v_month := date_trunc('month', v_year.starts_on)::date;

  while v_month <= v_year.ends_on loop
    -- Clamp to the year's own bounds so a fiscal year that does not start on the
    -- first of a month gets a correct short first period rather than one that
    -- overlaps the previous year and trips the no-overlap exclusion constraint.
    v_starts := greatest(v_month, v_year.starts_on);
    v_ends   := least((v_month + interval '1 month - 1 day')::date, v_year.ends_on);
    v_code   := to_char(v_month, 'YYYY-MM');

    if not exists (
      select 1 from accounting.fiscal_periods
       where fiscal_year_id = v_year.id and code = v_code
    ) then
      insert into accounting.fiscal_periods (fiscal_year_id, code, starts_on, ends_on, status)
      values (v_year.id, v_code, v_starts, v_ends, 'open');
      v_created := v_created + 1;
    end if;

    v_month := (v_month + interval '1 month')::date;
  end loop;

  return v_created;
end $$;

comment on function accounting.fn_ensure_monthly_periods(uuid) is
  'Creates any missing monthly periods for a fiscal year. Idempotent. Call it when opening a new fiscal year.';

-- ---------------------------------------------------------------------------
-- Backfill every fiscal year that is still open.
-- ---------------------------------------------------------------------------
do $$
declare
  v_year record;
  v_made integer;
  v_total integer := 0;
begin
  for v_year in
    select id, code from accounting.fiscal_years where status = 'open'
  loop
    v_made := accounting.fn_ensure_monthly_periods(v_year.id);
    v_total := v_total + v_made;
    raise notice 'Fiscal year %: % period(s) created.', v_year.code, v_made;
  end loop;

  if v_total = 0 then
    raise notice 'All open fiscal years already had their periods.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- A view that makes the gap visible before it bites.
--
-- The original failure was silent: nothing said "there is no period for today"
-- until a posting tried and failed. This answers that question directly, and is
-- cheap enough to put on the panel's dashboard.
-- ---------------------------------------------------------------------------
create or replace view accounting.v_period_coverage as
select
  (select count(*) from accounting.fiscal_periods
    where current_date between starts_on and ends_on
      and status = 'open' and lock_level <> 'hard')          as open_periods_today,
  (select max(ends_on) from accounting.fiscal_periods
    where status = 'open')                                    as covered_until,
  greatest(
    (select max(ends_on) from accounting.fiscal_periods where status = 'open')
      - current_date,
    0
  )                                                           as days_of_runway;

comment on view accounting.v_period_coverage is
  'Whether the ledger can accept a posting dated today, and how far ahead periods exist.';

commit;
