import "server-only";
import { sql } from "@core/db/client";
import type { FinanceSummary, LedgerEntry, PayoutAccount } from "./types";

export async function getFinanceSummary(providerId: string) {
  const rows = await sql<FinanceSummary[]>`
    select
      coalesce(sum(amount) filter (where status = 'pending' and entry_type in ('earning','adjustment')), 0)::text as "pendingEarnings",
      coalesce(sum(amount) filter (where status = 'approved' and entry_type in ('earning','adjustment')), 0)::text as "approvedEarnings",
      coalesce(sum(abs(amount)) filter (where status = 'paid' or entry_type = 'payout'), 0)::text as "paidAmount",
      coalesce(max(currency_code), 'USD') as "currencyCode"
    from commercial.provider_ledgers
    where provider_id = ${providerId}::uuid
  `;
  return rows[0] ?? { pendingEarnings: "0", approvedEarnings: "0", paidAmount: "0", currencyCode: "USD" };
}

export async function listLedger(providerId: string) {
  return sql<LedgerEntry[]>`
    select id::text, entry_type as "entryType", amount::text, currency_code as "currencyCode", status, notes, created_at::text as "createdAt"
    from commercial.provider_ledgers
    where provider_id = ${providerId}::uuid
    order by created_at desc
    limit 100
  `;
}

export async function listPayoutAccounts(providerId: string) {
  return sql<PayoutAccount[]>`
    select id::text, account_holder_name as "accountHolderName", bank_name as "bankName", iban, currency_code as "currencyCode", is_default as "isDefault"
    from provider_portal.payout_accounts
    where service_provider_id = ${providerId}::uuid
    order by is_default desc, create_date desc
  `;
}

export async function addPayoutAccount(input: { providerId: string; accountHolderName: string; bankName: string; iban: string; swiftCode: string; country: string; currencyCode: string; isDefault: boolean }) {
  await sql.begin(async (tx) => {
    if (input.isDefault) {
      await tx`update provider_portal.payout_accounts set is_default = false, last_modified_date = now() where service_provider_id = ${input.providerId}::uuid`;
    }
    await tx`
      insert into provider_portal.payout_accounts (service_provider_id, account_holder_name, bank_name, iban, swift_code, country, currency_code, is_default, metadata, create_date, last_modified_date)
      values (${input.providerId}::uuid, ${input.accountHolderName}, ${input.bankName}, ${input.iban}, ${input.swiftCode}, ${input.country}, ${input.currencyCode}, ${input.isDefault}, '{}'::jsonb, now(), now())
    `;
  });
}

export async function setDefaultPayoutAccount(providerId: string, accountId: string) {
  await sql.begin(async (tx) => {
    await tx`update provider_portal.payout_accounts set is_default = false, last_modified_date = now() where service_provider_id = ${providerId}::uuid`;
    await tx`update provider_portal.payout_accounts set is_default = true, last_modified_date = now() where service_provider_id = ${providerId}::uuid and id = ${accountId}::uuid`;
  });
}

export async function deletePayoutAccount(providerId: string, accountId: string) {
  await sql`delete from provider_portal.payout_accounts where service_provider_id = ${providerId}::uuid and id = ${accountId}::uuid`;
}
