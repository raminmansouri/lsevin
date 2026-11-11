import "server-only";
import type { TransactionSql } from "postgres";
import db from "@/config/database/db";

export class AccountValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountValidationError";
  }
}

export type AccountRow = {
  id: string;
  code: string;
  parentId: string | null;
  level: number;
  nameTranslations: Record<string, string> | null;
  accountType: string;
  normalBalance: string;
  currencyCode: string | null;
  isPostable: boolean;
  isActive: boolean;
  isSystem: boolean;
  systemKey: string | null;
  hasPostings: boolean;
};

export async function listAccounts(): Promise<AccountRow[]> {
  return db<AccountRow[]>`
    select
      a.id::text as "id",
      a.code,
      a.parent_id::text as "parentId",
      a.level,
      a.name_translations as "nameTranslations",
      a.account_type as "accountType",
      a.normal_balance as "normalBalance",
      a.currency_code as "currencyCode",
      a.is_postable as "isPostable",
      a.is_active as "isActive",
      a.is_system as "isSystem",
      a.system_key as "systemKey",
      exists (select 1 from accounting.journal_lines l where l.account_id = a.id) as "hasPostings"
    from accounting.accounts a
    order by a.code
  `;
}

/** Subsidiary (level 3) accounts, which are the only valid parents for a new leaf. */
export async function listPostableParents(): Promise<{ id: string; code: string; name: Record<string, string> | null }[]> {
  return db<{ id: string; code: string; name: Record<string, string> | null }[]>`
    select id::text as id, code, name_translations as name
    from accounting.accounts
    where level = 3 and is_active = true
    order by code
  `;
}

const SEGMENT = /^\d{1,4}$/;
const MAX_LEVEL = 9;

type SubtreeRow = { id: string; code: string; level: number; is_system: boolean };

async function loadSubtree(tx: TransactionSql, accountId: string): Promise<SubtreeRow[]> {
  return tx<SubtreeRow[]>`
    with recursive sub as (
      select id, code, level, is_system from accounting.accounts where id = ${accountId}
      union all
      select a.id, a.code, a.level, a.is_system from accounting.accounts a join sub on a.parent_id = sub.id
    )
    select id::text as id, code, level, is_system from sub
  `;
}

async function countRefs(tx: TransactionSql, ids: string[]) {
  const [row] = await tx<{ postings: number; wallets: number; templates: number; postedCode: string | null }[]>`
    select
      (select count(*)::int from accounting.journal_lines where account_id = any(${ids}::uuid[])) as postings,
      (select count(*)::int from accounting.wallets where account_id = any(${ids}::uuid[])) as wallets,
      (select count(*)::int from accounting.entry_template_lines where account_id = any(${ids}::uuid[])) as templates,
      (select a.code from accounting.journal_lines l join accounting.accounts a on a.id = l.account_id
        where l.account_id = any(${ids}::uuid[]) limit 1) as "postedCode"
  `;
  return row;
}

export async function createChildAccount(input: {
  parentId: string;
  segment: string;
  nameFa: string;
  nameEn: string;
  currencyCode?: string | null;
  actorUserId: string;
}): Promise<{ id: string; code: string }> {
  const segment = input.segment.trim();
  if (!SEGMENT.test(segment)) throw new AccountValidationError("کد زیرحساب باید ۱ تا ۴ رقم باشد.");
  if (!input.nameFa.trim()) throw new AccountValidationError("نام فارسی الزامی است.");

  return db.begin(async (tx) => {
    const [parent] = await tx<
      { id: string; code: string; level: number; account_type: string; normal_balance: string; is_postable: boolean; is_system: boolean }[]
    >`
      select id::text as id, code, level, account_type, normal_balance, is_postable, is_system
      from accounting.accounts where id = ${input.parentId} limit 1 for update
    `;
    if (!parent) throw new AccountValidationError("حساب پدر پیدا نشد.");
    if (parent.level >= MAX_LEVEL) {
      throw new AccountValidationError(`حساب ${parent.code} در عمیق‌ترین سطح است و نمی‌تواند زیرحساب بگیرد.`);
    }

    const code = parent.code + segment;
    const [existing] = await tx<{ id: string }[]>`select id::text as id from accounting.accounts where code = ${code} limit 1`;
    if (existing) throw new AccountValidationError(`کد ${code} قبلاً استفاده شده است.`);

    if (parent.is_postable) {
      if (parent.is_system) {
        throw new AccountValidationError(
          `حساب ${parent.code} سیستمی است و سایت مستقیماً در آن ثبت می‌کند؛ نمی‌تواند زیرحساب بگیرد.`
        );
      }
      const refs = await countRefs(tx, [parent.id]);
      if (refs.postings > 0) {
        throw new AccountValidationError(
          `حساب ${parent.code} سند خورده است و نمی‌تواند زیرحساب بگیرد. اول سندهایش را به حساب دیگری منتقل کنید.`
        );
      }
      if (refs.wallets > 0 || refs.templates > 0) {
        throw new AccountValidationError(
          `حساب ${parent.code} به کیف پول یا الگوی سند وصل است و نمی‌تواند زیرحساب بگیرد.`
        );
      }
      await tx`update accounting.accounts set is_postable = false, updated_by = ${input.actorUserId} where id = ${parent.id}`;
    }

    const [created] = await tx<{ id: string }[]>`
      insert into accounting.accounts (
        code, parent_id, level, name_translations, account_type, normal_balance,
        currency_code, is_postable, is_active, is_system, created_by
      ) values (
        ${code}, ${parent.id}, ${parent.level + 1},
        ${tx.json({ "fa-IR": input.nameFa.trim(), "en-US": input.nameEn.trim() || input.nameFa.trim() } as never)},
        ${parent.account_type}, ${parent.normal_balance},
        ${input.currencyCode || null}, true, true, false, ${input.actorUserId}
      )
      returning id::text as id
    `;

    await tx`
      insert into accounting.audit_log (actor_user_id, action, entity_type, entity_id, entity_key, after_state)
      values (${input.actorUserId}, 'account.create', 'accounting_account', ${created.id}, ${code},
              ${tx.json({ code, parentCode: parent.code, nameFa: input.nameFa } as never)})
    `;

    return { id: created.id, code };
  });
}

export async function updateAccount(input: {
  accountId: string;
  segment: string;
  nameFa: string;
  nameEn: string;
  actorUserId: string;
}): Promise<{ code: string }> {
  const segment = input.segment.trim();
  if (!SEGMENT.test(segment)) throw new AccountValidationError("کد باید ۱ تا ۴ رقم باشد.");
  if (!input.nameFa.trim()) throw new AccountValidationError("نام فارسی الزامی است.");

  return db.begin(async (tx) => {
    const [account] = await tx<{ id: string; code: string; name_translations: unknown; parent_code: string | null }[]>`
      select a.id::text as id, a.code, a.name_translations, p.code as parent_code
      from accounting.accounts a left join accounting.accounts p on p.id = a.parent_id
      where a.id = ${input.accountId} limit 1 for update of a
    `;
    if (!account) throw new AccountValidationError("حساب پیدا نشد.");

    const newCode = (account.parent_code ?? "") + segment;

    if (newCode !== account.code) {
      const subtree = await loadSubtree(tx, account.id);
      const ids = subtree.map((row) => row.id);
      const newCodes = subtree.map((row) => newCode + row.code.slice(account.code.length));

      const [clash] = await tx<{ code: string }[]>`
        select code from accounting.accounts
        where code = any(${newCodes}::text[]) and not (id = any(${ids}::uuid[]))
        limit 1
      `;
      if (clash) throw new AccountValidationError(`کد ${clash.code} قبلاً استفاده شده است.`);

      await tx`update accounting.accounts set code = 'tmp:' || id::text where id = any(${ids}::uuid[])`;
      await tx`
        update accounting.accounts a
           set code = m.code, updated_by = ${input.actorUserId}
          from unnest(${ids}::uuid[], ${newCodes}::text[]) as m(id, code)
         where a.id = m.id
      `;
    }

    await tx`
      update accounting.accounts
         set name_translations = ${tx.json({
           "fa-IR": input.nameFa.trim(),
           "en-US": input.nameEn.trim() || input.nameFa.trim(),
         } as never)},
             updated_by = ${input.actorUserId}
       where id = ${account.id}
    `;

    await tx`
      insert into accounting.audit_log (actor_user_id, action, entity_type, entity_id, entity_key, before_state, after_state)
      values (${input.actorUserId}, 'account.update', 'accounting_account', ${account.id}, ${newCode},
              ${tx.json({ code: account.code, name: account.name_translations } as never)},
              ${tx.json({ code: newCode, nameFa: input.nameFa, nameEn: input.nameEn } as never)})
    `;

    return { code: newCode };
  });
}

export async function renameAccount(input: {
  accountId: string;
  nameFa: string;
  nameEn: string;
  actorUserId: string;
}): Promise<void> {
  if (!input.nameFa.trim()) throw new AccountValidationError("The Persian name is required.");

  await db.begin(async (tx) => {
    const [account] = await tx<{ id: string; code: string; name_translations: unknown }[]>`
      select id::text as id, code, name_translations
      from accounting.accounts where id = ${input.accountId} limit 1 for no key update
    `;
    if (!account) throw new AccountValidationError("The account was not found.");

    // Renaming is always allowed, including for system accounts — the code and
    // system_key are what the posting rules use, and neither is touched here.
    await tx`
      update accounting.accounts
         set name_translations = ${tx.json({
           "fa-IR": input.nameFa.trim(),
           "en-US": input.nameEn.trim() || input.nameFa.trim(),
         } as never)},
             updated_by = ${input.actorUserId},
             updated_at = now()
       where id = ${input.accountId}
    `;

    await tx`
      insert into accounting.audit_log (actor_user_id, action, entity_type, entity_id, entity_key, before_state, after_state)
      values (${input.actorUserId}, 'account.rename', 'accounting_account', ${account.id}, ${account.code},
              ${tx.json({ name: account.name_translations } as never)},
              ${tx.json({ nameFa: input.nameFa, nameEn: input.nameEn } as never)})
    `;
  });
}

export async function setAccountActive(input: {
  accountId: string;
  isActive: boolean;
  actorUserId: string;
}): Promise<void> {
  await db.begin(async (tx) => {
    const [account] = await tx<{ id: string; code: string; is_system: boolean; is_active: boolean }[]>`
      select id::text as id, code, is_system, is_active
      from accounting.accounts where id = ${input.accountId} limit 1 for no key update
    `;
    if (!account) throw new AccountValidationError("The account was not found.");

    if (account.is_system && !input.isActive) {
      throw new AccountValidationError(
        `Account ${account.code} is a system account that the posting rules depend on. Deactivating it would make deposits, refunds or fees fail at the moment money moves.`
      );
    }

    await tx`
      update accounting.accounts
         set is_active = ${input.isActive}, updated_by = ${input.actorUserId}, updated_at = now()
       where id = ${input.accountId}
    `;

    await tx`
      insert into accounting.audit_log (actor_user_id, action, entity_type, entity_id, entity_key, before_state, after_state)
      values (${input.actorUserId}, ${input.isActive ? "account.activate" : "account.deactivate"},
              'accounting_account', ${account.id}, ${account.code},
              ${tx.json({ isActive: account.is_active } as never)},
              ${tx.json({ isActive: input.isActive } as never)})
    `;
  });
}




export async function deleteAccount(input: {
  accountId: string;
  actorUserId: string;
}): Promise<{ code: string; removed: number }> {
  return db.begin(async (tx) => {
    const [account] = await tx<{ id: string; code: string; parent_id: string | null; name_translations: unknown }[]>`
      select id::text as id, code, parent_id::text as parent_id, name_translations
      from accounting.accounts where id = ${input.accountId} limit 1 for update
    `;
    if (!account) throw new AccountValidationError("حساب پیدا نشد.");

    const subtree = await loadSubtree(tx, account.id);
    const ids = subtree.map((row) => row.id);

    const system = subtree.find((row) => row.is_system);
    if (system) {
      throw new AccountValidationError(
        `حساب ${system.code} سیستمی است و سایت مستقیماً در آن ثبت می‌کند؛ قابل حذف نیست.`
      );
    }

    const refs = await countRefs(tx, ids);
    if (refs.postings > 0) {
      throw new AccountValidationError(
        `حساب ${refs.postedCode} سند خورده است؛ حذف نمی‌شود. به‌جای حذف، غیرفعالش کنید.`
      );
    }
    if (refs.wallets > 0) throw new AccountValidationError("این حساب (یا زیرحسابی از آن) به کیف پول وصل است.");
    if (refs.templates > 0) throw new AccountValidationError("این حساب (یا زیرحسابی از آن) در الگوی سند استفاده شده است.");

    await tx`
      insert into accounting.audit_log (actor_user_id, action, entity_type, entity_id, entity_key, before_state)
      values (${input.actorUserId}, 'account.delete', 'accounting_account', ${account.id}, ${account.code},
              ${tx.json({ code: account.code, name: account.name_translations, removed: subtree.map((row) => row.code) } as never)})
    `;

    const levels = [...new Set(subtree.map((row) => row.level))].sort((a, b) => b - a);
    for (const level of levels) {
      await tx`delete from accounting.accounts where id = any(${ids}::uuid[]) and level = ${level}`;
    }

    if (account.parent_id) {
      await tx`
        update accounting.accounts p
           set is_postable = true, updated_by = ${input.actorUserId}
         where p.id = ${account.parent_id}
           and p.level > 1
           and not exists (select 1 from accounting.accounts c where c.parent_id = p.id)
      `;
    }

    return { code: account.code, removed: subtree.length };
  });
}
