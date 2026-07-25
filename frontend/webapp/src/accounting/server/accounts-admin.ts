import "server-only";

import db from "@/config/database/db";

/**
 * Admin read/write for the chart of accounts.
 *
 * Two rules the panel must not be able to break:
 *
 *   * A seeded system account cannot be renumbered, retyped or deleted. The posting
 *     rules reference them by `system_key`, and moving one out from under a rule would
 *     silently redirect real money to a different account.
 *   * A new account is always a leaf under an existing subsidiary account. Postings
 *     belong on leaves; allowing a postable account to grow children would make every
 *     parent balance double-count.
 */

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

export async function createDetailAccount(input: {
  parentId: string;
  code: string;
  nameFa: string;
  nameEn: string;
  currencyCode?: string | null;
  actorUserId: string;
}): Promise<{ id: string }> {
  const code = input.code.trim();
  if (!/^\d{3,20}$/.test(code)) {
    throw new AccountValidationError("An account code must be 3 to 20 digits.");
  }
  if (!input.nameFa.trim()) {
    throw new AccountValidationError("The Persian name is required.");
  }

  return db.begin(async (tx) => {
    const [parent] = await tx<{ id: string; code: string; level: number; account_type: string; normal_balance: string; is_postable: boolean }[]>`
      select id::text as id, code, level, account_type, normal_balance, is_postable
      from accounting.accounts where id = ${input.parentId} limit 1
    `;
    if (!parent) throw new AccountValidationError("The parent account was not found.");
    if (parent.level !== 3) {
      throw new AccountValidationError("A new account must be created under a subsidiary (level 3) account.");
    }
    if (parent.is_postable) {
      throw new AccountValidationError("The parent already accepts postings and cannot have children.");
    }
    if (!code.startsWith(parent.code)) {
      throw new AccountValidationError(`The code must start with the parent's code (${parent.code}).`);
    }

    const [existing] = await tx<{ id: string }[]>`
      select id::text as id from accounting.accounts where code = ${code} limit 1
    `;
    if (existing) throw new AccountValidationError(`Account code ${code} already exists.`);

    // Type and normal side are inherited: a detail account under a liability parent that
    // was somehow marked as income would corrupt every report that rolls up by type.
    const [created] = await tx<{ id: string }[]>`
      insert into accounting.accounts (
        code, parent_id, level, name_translations, account_type, normal_balance,
        currency_code, is_postable, is_active, is_system, created_by
      ) values (
        ${code}, ${parent.id}, 4,
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

    return created;
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
