-- ---------------------------------------------------------------------------
-- 0046 — let a document that never entered the books be deleted.
--
-- accounting.fn_block_ledger_mutation is the append-only guard, called by
-- trg_accounting_entries_immutable (BEFORE UPDATE OR DELETE on journal_entries)
-- and trg_accounting_lines_immutable (the same on journal_lines).
--
-- 0014 taught it that an editable document may be *updated* and that the lines of
-- an editable document may be changed or removed, but its entries branch is
-- guarded by `tg_op = 'UPDATE'`. A DELETE on journal_entries therefore falls
-- straight through to the final RAISE, whatever the document's status:
--
--     accounting.journal_entries is append-only (attempted DELETE).
--
-- So deleteDraft() removed the lines, then failed on the entry and rolled the
-- whole transaction back. Deleting a draft has never worked; the panel reported
-- it as "سند قطعی‌شده قابل تغییر نیست", which is the message for a posted
-- document and told the accountant nothing about a draft.
--
-- The fix is the same rule the lines already follow: while a document is editable
-- (draft, temporary) it may be removed, and the moment it is committed it may not.
-- Nothing else in the function changes — a posted, approved, rejected or reversed
-- document is as undeletable as it was.
-- ---------------------------------------------------------------------------

begin;

create or replace function accounting.fn_block_ledger_mutation() returns trigger
language plpgsql as $$
declare
  v_entry_status text;
begin
  if tg_table_name = 'journal_entries' then
    -- A document still in an editable state was never in the books, so there is
    -- nothing to reverse and nothing for the audit trail to lose. Anything
    -- committed is superseded with a reversing entry, never removed.
    if tg_op = 'DELETE' then
      if accounting.fn_status_is_editable(old.status) then
        return old;
      end if;
    end if;

    if tg_op = 'UPDATE' then
      if accounting.fn_status_is_editable(old.status) then
        return new;
      end if;

      -- A committed document may still record its own supersession and the
      -- workflow stamps that go with it, but nothing financial.
      if to_jsonb(new) - 'reversed_by_entry_id' - 'status' - 'posted_at' - 'posted_by'
           - 'approved_at' - 'approved_by' - 'rejected_at' - 'rejected_by'
           - 'rejection_reason'
         = to_jsonb(old) - 'reversed_by_entry_id' - 'status' - 'posted_at' - 'posted_by'
           - 'approved_at' - 'approved_by' - 'rejected_at' - 'rejected_by'
           - 'rejection_reason'
         and new.status in ('approved', 'posted', 'reversed', 'rejected')
      then
        return new;
      end if;
    end if;
  end if;

  if tg_table_name = 'journal_lines' then
    select status into v_entry_status
      from accounting.journal_entries
     where id = coalesce(new.entry_id, old.entry_id);

    -- The parent is already gone when an entry cascades away; let the cascade run.
    if v_entry_status is null then
      return coalesce(new, old);
    end if;

    if accounting.fn_status_is_editable(v_entry_status) then
      return coalesce(new, old);
    end if;
  end if;

  raise exception
    'accounting.% is append-only (attempted %). Correct a posted entry with a reversing entry.',
    tg_table_name, tg_op
    using errcode = 'restrict_violation';
end $$;

comment on function accounting.fn_block_ledger_mutation() is
  'Append-only guard for the ledger. Editable documents (draft, temporary) and their lines may still be changed or removed; committed ones may not.';

commit;
