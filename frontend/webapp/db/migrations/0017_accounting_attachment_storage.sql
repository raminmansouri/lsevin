-- ---------------------------------------------------------------------------
-- 0017 — store journal attachments in the database.
--
-- 0014 created entry_attachments with a file_url, assuming the file would live
-- somewhere else. On this deployment it cannot: the webapp container has no
-- writable volume (only the .NET API mounts /var/lib/lsevin/uploads), and the
-- financial panel authenticates against accounting.panel_users, which is a
-- different identity system from the one the media API accepts. A panel user has
-- no credential to upload through it.
--
-- Keeping the bytes here is not a workaround, though — for this particular kind
-- of file it is the better answer:
--
--   * an attachment is the evidence for a journal entry. Storing it beside the
--     entry means one backup covers both, and a restore cannot bring back the
--     ledger without the invoices that justify it.
--   * the write joins the same transaction as the entry, so a half-attached
--     document cannot exist.
--   * deleting a draft removes its attachments by cascade. A filesystem would
--     leak them.
--
-- The trade — database size — is bounded by a hard 10 MB per file and by volume:
-- these are scans of invoices and bank advices on manual entries, not user media.
-- file_url stays for the case where a document genuinely lives elsewhere.
-- ---------------------------------------------------------------------------

begin;

alter table accounting.entry_attachments
  add column if not exists content bytea,
  -- Recomputed from the bytes on insert rather than trusted from the client, so
  -- the size shown and the size stored cannot disagree.
  add column if not exists sha256 text;

-- file_url was NOT NULL from 0014; an attachment stored inline has no URL.
alter table accounting.entry_attachments
  alter column file_url drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'entry_attachments_has_payload') then
    alter table accounting.entry_attachments
      add constraint entry_attachments_has_payload
      check (content is not null or file_url is not null);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'entry_attachments_size_limit') then
    -- 10 MB. Large enough for a multi-page scan, small enough that no single row
    -- can bloat the backup that the whole ledger depends on.
    alter table accounting.entry_attachments
      add constraint entry_attachments_size_limit
      check (content is null or octet_length(content) <= 10 * 1024 * 1024);
  end if;
end $$;

/*
 * Keeps size_bytes and sha256 honest.
 *
 * Both are derived from the bytes, so letting a caller supply them is an
 * invitation for the metadata and the payload to drift — and the checksum is the
 * only thing that would later prove an attachment was not swapped.
 */
create or replace function accounting.fn_attachment_derive() returns trigger
language plpgsql as $$
begin
  if new.content is not null then
    new.size_bytes := octet_length(new.content);
    new.sha256 := encode(digest(new.content, 'sha256'), 'hex');
  end if;
  return new;
end $$;

do $$
begin
  -- digest() lives in pgcrypto; without it the checksum silently cannot be taken,
  -- so fail loudly here rather than storing attachments with a null hash.
  if not exists (select 1 from pg_extension where extname = 'pgcrypto') then
    create extension if not exists pgcrypto;
  end if;
end $$;

drop trigger if exists trg_accounting_attachment_derive on accounting.entry_attachments;
create trigger trg_accounting_attachment_derive
  before insert or update on accounting.entry_attachments
  for each row execute function accounting.fn_attachment_derive();

/*
 * Attachments follow the document's own immutability rule.
 *
 * A posted entry cannot be edited, and its evidence cannot be swapped either —
 * otherwise the audit trail says one thing and the paperwork says another.
 */
create or replace function accounting.fn_attachments_follow_entry() returns trigger
language plpgsql as $$
declare
  v_status text;
begin
  select status into v_status
    from accounting.journal_entries
   where id = coalesce(new.entry_id, old.entry_id);

  -- The entry is already gone when it cascades; let the cascade run.
  if v_status is null then
    return coalesce(new, old);
  end if;

  if accounting.fn_status_is_editable(v_status) then
    return coalesce(new, old);
  end if;

  -- Adding evidence to a document already in the books is allowed: a bank advice
  -- often arrives after the entry. Changing or removing what is there is not.
  if tg_op = 'INSERT' then
    return new;
  end if;

  raise exception
    'Attachments of a % document cannot be changed or removed', v_status
    using errcode = 'restrict_violation';
end $$;

drop trigger if exists trg_accounting_attachments_immutable on accounting.entry_attachments;
create trigger trg_accounting_attachments_immutable
  before insert or update or delete on accounting.entry_attachments
  for each row execute function accounting.fn_attachments_follow_entry();

-- Listing attachments must never drag the bytes along.
create or replace view accounting.v_entry_attachments as
select
  id,
  entry_id,
  file_name,
  content_type,
  size_bytes,
  sha256,
  kind,
  note,
  uploaded_by,
  uploaded_at,
  file_url,
  content is not null as stored_inline
from accounting.entry_attachments;

comment on view accounting.v_entry_attachments is
  'Attachment metadata without the payload. Read the bytes only when serving one file.';

commit;
