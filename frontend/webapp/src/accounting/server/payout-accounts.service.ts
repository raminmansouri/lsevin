import "server-only";

import db from "@/config/database/db";

/**
 * A provider's bank accounts (provider_portal.payout_accounts), entered by the accountant
 * on the provider payouts card in the financial panel. The same rows the provider portal's
 * "Payout accounts" page edits, and the account the payouts list shows is the default one.
 *
 * At most two per provider. The provider row is locked while saving, so two accountants
 * adding at the same moment cannot end up with a third.
 */

export const MAX_PAYOUT_ACCOUNTS = 2;

export type PayoutAccount = {
  id: string;
  providerId: string;
  holderName: string;
  bankName: string | null;
  cardNumber: string | null;
  iban: string | null;
  accountNumber: string | null;
  isDefault: boolean;
};

export class PayoutAccountRuleError extends Error {
  constructor(
    message: string,
    readonly code: "holder_required" | "nothing_entered" | "card_invalid" | "iban_invalid" | "account_invalid" | "limit" | "not_found"
  ) {
    super(message);
    this.name = "PayoutAccountRuleError";
  }
}

export type PayoutAccountInput = {
  holderName: string;
  bankName?: string;
  cardNumber?: string;
  iban?: string;
  accountNumber?: string;
};

/** Persian and Arabic-Indic digits to Latin, so a number typed on a Persian keyboard still validates. */
function latinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function blank(value: string | undefined): string {
  return latinDigits(String(value ?? "")).trim();
}

/** Validates and normalizes what the accountant typed. Exported for the tests. */
export function normalizePayoutAccountInput(input: PayoutAccountInput) {
  const holderName = blank(input.holderName);
  if (!holderName) throw new PayoutAccountRuleError("The account holder name is required.", "holder_required");

  const bankName = blank(input.bankName) || null;

  const card = blank(input.cardNumber).replace(/[\s-]/g, "");
  if (card && !/^\d{16}$/.test(card)) throw new PayoutAccountRuleError("The card number must be 16 digits.", "card_invalid");

  let iban = blank(input.iban).replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{24}$/.test(iban)) iban = `IR${iban}`;
  if (iban && !/^IR\d{24}$/.test(iban)) {
    throw new PayoutAccountRuleError("The Sheba number must be IR followed by 24 digits.", "iban_invalid");
  }

  const accountNumber = blank(input.accountNumber).replace(/\s/g, "");
  if (accountNumber && !/^[\d.\-/]{4,30}$/.test(accountNumber)) {
    throw new PayoutAccountRuleError("The account number may only contain digits.", "account_invalid");
  }

  if (!card && !iban && !accountNumber) {
    throw new PayoutAccountRuleError("Enter a card, Sheba or account number.", "nothing_entered");
  }

  const digits = (accountNumber || card).replace(/\D/g, "");
  return {
    holderName,
    bankName,
    cardNumber: card || null,
    iban: iban || null,
    accountNumber: accountNumber || null,
    last4: digits.length >= 4 ? digits.slice(-4) : null,
  };
}

/** Every bank account of the given providers, default first. */
export async function listPayoutAccounts(providerIds: string[]): Promise<Map<string, PayoutAccount[]>> {
  const ids = [...new Set(providerIds)];
  const result = new Map<string, PayoutAccount[]>();
  if (ids.length === 0) return result;
  const rows = await db<PayoutAccount[]>`
    select
      a.id::text as "id",
      a.service_provider_id::text as "providerId",
      a.account_holder_name as "holderName",
      a.bank_name as "bankName",
      a.card_number as "cardNumber",
      a.iban,
      a.account_number as "accountNumber",
      a.is_default as "isDefault"
    from provider_portal.payout_accounts a
    where a.service_provider_id = any(${ids}::uuid[])
    order by a.is_default desc, a.create_date asc
  `;
  for (const row of rows) {
    const list = result.get(row.providerId) ?? [];
    list.push(row);
    result.set(row.providerId, list);
  }
  return result;
}

/** Adds an account (id omitted) or edits one. The first account a provider gets is the default. */
export async function savePayoutAccount(
  input: PayoutAccountInput & {
    providerId: string;
    id?: string;
    currencyCode: string;
    makeDefault: boolean;
    actorUserId: string;
  }
): Promise<{ id: string }> {
  const fields = normalizePayoutAccountInput(input);
  const audit = { updatedBy: input.actorUserId, updatedAt: new Date().toISOString(), updatedIn: "financial_panel" };

  return db.begin(async (tx) => {
    const [provider] = await tx<{ id: string }[]>`
      select id::text as id from category.service_providers where id = ${input.providerId}::uuid for update
    `;
    if (!provider) throw new PayoutAccountRuleError("Provider not found.", "not_found");

    const existing = await tx<{ id: string }[]>`
      select id::text as id from provider_portal.payout_accounts where service_provider_id = ${input.providerId}::uuid
    `;

    let id: string;
    if (input.id) {
      const [row] = await tx<{ id: string }[]>`
        update provider_portal.payout_accounts
           set account_holder_name = ${fields.holderName},
               bank_name = ${fields.bankName},
               card_number = ${fields.cardNumber},
               iban = ${fields.iban},
               account_number = ${fields.accountNumber},
               account_number_last4 = ${fields.last4},
               metadata = coalesce(metadata, '{}'::jsonb) || ${audit as never},
               last_modified_date = now()
         where id = ${input.id}::uuid
           and service_provider_id = ${input.providerId}::uuid
         returning id::text as id
      `;
      if (!row) throw new PayoutAccountRuleError("This account no longer exists.", "not_found");
      id = row.id;
    } else {
      if (existing.length >= MAX_PAYOUT_ACCOUNTS) {
        throw new PayoutAccountRuleError("A provider can have at most two bank accounts.", "limit");
      }
      const [row] = await tx<{ id: string }[]>`
        insert into provider_portal.payout_accounts (
          service_provider_id, account_holder_name, bank_name, card_number, iban, account_number,
          account_number_last4, currency_code, is_default, metadata
        ) values (
          ${input.providerId}::uuid, ${fields.holderName}, ${fields.bankName}, ${fields.cardNumber}, ${fields.iban},
          ${fields.accountNumber}, ${fields.last4}, ${input.currencyCode}, ${existing.length === 0}, ${audit as never}
        )
        returning id::text as id
      `;
      id = row.id;
    }

    if (input.makeDefault) {
      await tx`
        update provider_portal.payout_accounts
           set is_default = (id = ${id}::uuid), last_modified_date = now()
         where service_provider_id = ${input.providerId}::uuid
      `;
    }
    return { id };
  });
}

/** Removes an account. If it was the default and another one is left, that one becomes the default. */
export async function deletePayoutAccount(input: { providerId: string; id: string }): Promise<void> {
  await db.begin(async (tx) => {
    const [row] = await tx<{ isDefault: boolean }[]>`
      delete from provider_portal.payout_accounts
       where id = ${input.id}::uuid
         and service_provider_id = ${input.providerId}::uuid
       returning is_default as "isDefault"
    `;
    if (!row) throw new PayoutAccountRuleError("This account no longer exists.", "not_found");
    if (row.isDefault) {
      await tx`
        update provider_portal.payout_accounts
           set is_default = true, last_modified_date = now()
         where id = (
           select id from provider_portal.payout_accounts
            where service_provider_id = ${input.providerId}::uuid
            order by create_date asc
            limit 1
         )
      `;
    }
  });
}
