-- Who added each service provider, and when (2026-11-18).
--
-- All admins share one login, so the adder cannot come from the session. The admin
-- "Add service provider" form (and "Duplicate provider") asks for the admin's name, typed
-- by hand, and stores it in added_by. added_at is the moment the row was inserted; the
-- database sets it, whatever the caller sends.
--
-- Both are locked forever once the row exists: the edit form does not show them, the save
-- action never writes them, and the trigger below rejects any UPDATE that changes either
-- one, from any code path (webapp, .NET API, psql).
--
-- Providers that existed before this migration keep NULL in both columns (no backfill),
-- and stay NULL. Providers created outside the admin form (provider portal applications,
-- the .NET API) get added_at but no added_by.

begin;

alter table category.service_providers
  add column if not exists added_by text,
  add column if not exists added_at timestamptz;

alter table category.service_providers
  drop constraint if exists service_providers_added_by_len_ck;
alter table category.service_providers
  add constraint service_providers_added_by_len_ck
  check (added_by is null or char_length(added_by) between 1 and 100);

comment on column category.service_providers.added_by is
  'Name of the admin who added this provider, typed by hand on the admin form (admins share one login). Set on insert only; the trg_service_providers_added_by_lock trigger rejects any change.';
comment on column category.service_providers.added_at is
  'When this provider was added. Always set by the database on insert; the trg_service_providers_added_by_lock trigger rejects any change.';

create or replace function category.fn_service_providers_added_by_lock() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.added_by := nullif(btrim(new.added_by), '');
    new.added_at := now();
    return new;
  end if;

  if new.added_by is distinct from old.added_by or new.added_at is distinct from old.added_at then
    raise exception 'category.service_providers.added_by / added_at cannot be changed after the provider is created'
      using errcode = 'restrict_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_service_providers_added_by_lock on category.service_providers;
create trigger trg_service_providers_added_by_lock
  before insert or update on category.service_providers
  for each row execute function category.fn_service_providers_added_by_lock();

commit;
