import "server-only";

import type { TransactionSql } from "postgres";

import db from "@/config/database/db";

import type {
  JournalLineInput,
  PostJournalEntryInput,
  PostJournalEntryResult,
} from "../types";
import { getBaseCurrency } from "./settings.repository";

type SqlClient = typeof db;
// postgres.js overloads `begin`, so deriving the callback argument from it resolves to
// the string-options overload. Use the exported transaction type directly.
type Tx = TransactionSql<Record<string, never>>;

/**
 * The only place in the application that writes to the ledger.
 *
 * Everything money-related goes through here — deposits, booking payments, refunds,
 * fees, withdrawals, adjustments. That is the point: the invariants (balanced entry,
 * idempotency, wallet balance moved under a lock, FX snapshotted) are enforced once,
 * here and in the database, instead of being re-implemented per feature and forgotten
 * in one of them. The existing codebase has that exact failure — five different places
 * update a balance and only two of them lock the row.
 *
 * Everything below runs in ONE transaction. If a caller passes its own `tx`, the work
 * joins that transaction so the caller can post an entry and update its own tables
 * atomically with it.
 */
export async function postJournalEntry(
  input: PostJournalEntryInput,
  tx?: Tx
): Promise<PostJournalEntryResult> {
  if (!input.idempotencyKey?.trim()) {
    throw new Error("postJournalEntry requires an idempotencyKey.");
  }
  if (!input.lines?.length) {
    throw new Error("postJournalEntry requires at least one line.");
  }

  const run = (client: Tx) => postWithin(client, input);
  return tx ? run(tx) : db.begin((client) => run(client as Tx));
}

async function postWithin(tx: Tx, input: PostJournalEntryInput): Promise<PostJournalEntryResult> {
  const baseCurrency = await getBaseCurrency(tx as unknown as SqlClient);
  const entryDate = input.entryDate ?? new Date();

  // Idempotency first, before any work. A replayed gateway webhook, a double-clicked
  // approve button and a retried job all land here and all return the original entry
  // rather than posting a second one.
  const existing = await tx<{ id: string; entry_number: string }[]>`
    select id::text as id, entry_number::text as entry_number
    from accounting.journal_entries
    where idempotency_key = ${input.idempotencyKey}
    limit 1
  `;
  if (existing.length) {
    return { entryId: existing[0].id, entryNumber: existing[0].entry_number, alreadyPosted: true };
  }

  const [period] = await tx<{ id: string; status: string }[]>`
    select id::text as id, status
    from accounting.fiscal_periods
    where ${entryDate}::timestamptz::date between starts_on and ends_on
    limit 1
  `;
  if (!period) {
    throw new Error(
      `No fiscal period covers ${entryDate.toISOString().slice(0, 10)}. Create one before posting.`
    );
  }
  if (period.status === "closed") {
    throw new Error(`The fiscal period covering ${entryDate.toISOString().slice(0, 10)} is closed.`);
  }

  const [entry] = await tx<{ id: string; entry_number: string }[]>`
    insert into accounting.journal_entries (
      entry_date, fiscal_period_id, description, source_type, source_id,
      idempotency_key, base_currency_code, created_by, reverses_entry_id, metadata
    ) values (
      ${entryDate}, ${period.id}, ${input.description ?? null}, ${input.sourceType},
      ${input.sourceId ?? null}, ${input.idempotencyKey}, ${baseCurrency},
      ${input.actorUserId ?? null}, ${input.reversesEntryId ?? null},
      ${tx.json((input.metadata ?? {}) as never)}
    )
    returning id::text as id, entry_number::text as entry_number
  `;

  let lineNo = 0;
  for (const line of input.lines) {
    lineNo += 1;
    await insertLine(tx, entry.id, lineNo, line, baseCurrency, input);
  }

  return { entryId: entry.id, entryNumber: entry.entry_number, alreadyPosted: false };
}

async function insertLine(
  tx: Tx,
  entryId: string,
  lineNo: number,
  line: JournalLineInput,
  baseCurrency: string,
  input: PostJournalEntryInput
): Promise<void> {
  const accountId = await resolveAccountId(tx, line);
  const currency = String(line.currencyCode).toUpperCase();
  // Kept as text the whole way: parsing into a JS number here would quietly round an
  // 18-decimal amount, and the rounding would only show up as a balance that no longer
  // reconciles months later.
  const amount = String(line.amount);
  const isDebit = line.direction === "debit";

  // FX snapshot. The rate is resolved once, now, and stored on the line — a rate that
  // changes tomorrow must not move a document that was posted today.
  const rate = currency === baseCurrency ? null : await resolveRate(tx, currency, baseCurrency);

  const [inserted] = await tx<{ id: string }[]>`
    insert into accounting.journal_lines (
      entry_id, line_no, account_id, party_type, party_id, wallet_id, wallet_bucket,
      currency_code, debit_amount, credit_amount,
      base_currency_code, base_debit_amount, base_credit_amount,
      exchange_rate, exchange_rate_id, rate_as_of, memo, metadata
    ) values (
      ${entryId}, ${lineNo}, ${accountId}, ${line.partyType ?? null}, ${line.partyId ?? null},
      ${line.walletId ?? null}, ${line.walletId ? line.walletBucket ?? "available" : null},
      ${currency},
      ${isDebit ? amount : 0}::numeric, ${isDebit ? 0 : amount}::numeric,
      ${baseCurrency},
      ${isDebit ? amount : "0"}::numeric * ${rate?.rate ?? "1"}::numeric,
      ${isDebit ? "0" : amount}::numeric * ${rate?.rate ?? "1"}::numeric,
      ${rate?.rate ?? "1"}::numeric, ${rate?.rateId ?? null}, ${rate?.asOf ?? null},
      ${line.memo ?? null}, ${tx.json((line.metadata ?? {}) as never)}
    )
    returning id::text as id
  `;

  if (line.walletId) {
    await applyWalletMovement(tx, entryId, inserted.id, line, amount, currency, input);
  }
}

async function resolveAccountId(tx: Tx, line: JournalLineInput): Promise<string> {
  if (line.accountId) return line.accountId;
  if (!line.accountKey) {
    throw new Error("Each journal line needs an accountKey or an accountId.");
  }

  const [account] = await tx<{ id: string }[]>`
    select id::text as id from accounting.accounts where system_key = ${line.accountKey} limit 1
  `;
  if (!account) {
    throw new Error(`No account is registered under system_key '${line.accountKey}'.`);
  }
  return account.id;
}

/**
 * finance.get_latest_rate RAISES when no active rate exists rather than returning null.
 * That is deliberate and we keep it: silently posting at rate 1 would misstate the
 * ledger, and the existing app already has a bug where a missing rate renders prices as
 * zero. Fail loudly, with a message that says how to fix it.
 */
async function resolveRate(
  tx: Tx,
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: string; rateId: string | null; asOf: Date | null }> {
  try {
    const [row] = await tx<{ base_rate: string; exchange_rate_ids: string[] | null; as_of: Date }[]>`
      select base_rate::text as base_rate, exchange_rate_ids, as_of
      from finance.get_latest_rate(${fromCurrency}, ${toCurrency})
      limit 1
    `;
    if (!row?.base_rate) throw new Error("no rate row");
    return {
      rate: row.base_rate,
      rateId: row.exchange_rate_ids?.[0] ?? null,
      asOf: row.as_of ?? null,
    };
  } catch (error) {
    throw new Error(
      `No exchange rate from ${fromCurrency} to ${toCurrency}. Add it in Admin → Finance → Exchange Rates before posting this entry. (${
        error instanceof Error ? error.message : String(error)
      })`
    );
  }
}

/**
 * Move the wallet balance and write the customer's statement line, in the same
 * transaction as the journal line that justifies it.
 *
 * The wallet row is locked before it is read, so two concurrent debits serialise instead
 * of both seeing the same balance. `for no key update` rather than `for update` so this
 * does not block the key-share locks other writers take through foreign keys.
 */
async function applyWalletMovement(
  tx: Tx,
  entryId: string,
  journalLineId: string,
  line: JournalLineInput,
  amount: string,
  currency: string,
  input: PostJournalEntryInput
): Promise<void> {
  const bucket = line.walletBucket ?? "available";
  const isCredit = line.direction === "credit";
  const column =
    bucket === "available" ? "available_balance" : bucket === "reserved" ? "reserved_balance" : "pending_balance";

  const [wallet] = await tx<{ id: string; currency_code: string }[]>`
    select id::text as id, currency_code
    from accounting.wallets
    where id = ${line.walletId!}
    limit 1
    for no key update
  `;
  if (!wallet) throw new Error(`Wallet ${line.walletId} was not found.`);
  if (wallet.currency_code !== currency) {
    throw new Error(
      `Wallet ${line.walletId} holds ${wallet.currency_code}, but the line is in ${currency}.`
    );
  }

  // A credit raises the bucket, a debit lowers it. The database's non-negative CHECK is
  // the backstop if a caller tries to spend more than the wallet holds.
  // `column` and the sign are interpolated, never the values: both come from a closed
  // set decided above (walletBucket and direction are typed unions), and the amount and
  // ids stay bound parameters.
  const [updated] = await tx.unsafe<{ available_balance: string }[]>(
    `update accounting.wallets
        set ${column} = ${column} ${isCredit ? "+" : "-"} $1::numeric,
            last_entry_id = $2,
            updated_at = now()
      where id = $3
      returning available_balance::text as available_balance`,
    [amount, entryId, line.walletId!]
  );

  await tx`
    insert into accounting.wallet_ledger (
      wallet_id, entry_id, journal_line_id, direction, bucket, amount, currency_code,
      balance_after, movement_type, reference_type, reference_id, description
    ) values (
      ${line.walletId!}, ${entryId}, ${journalLineId}, ${line.direction}, ${bucket},
      ${amount}::numeric, ${currency}, ${updated.available_balance}::numeric,
      ${line.movementType ?? "adjustment"}, ${input.sourceType}, ${input.sourceId ?? null},
      ${line.memo ?? input.description ?? null}
    )
  `;
}

/**
 * Reverse a posted entry by posting its mirror image. Nothing is edited or deleted —
 * this is the only correction mechanism, and it leaves both documents in the history.
 */
export async function reverseJournalEntry(
  params: { entryId: string; reason: string; actorUserId?: string },
  tx?: Tx
): Promise<PostJournalEntryResult> {
  const run = async (client: Tx): Promise<PostJournalEntryResult> => {
    const [original] = await client<
      { id: string; source_type: string; source_id: string | null; reversed_by_entry_id: string | null }[]
    >`
      select id::text as id, source_type, source_id::text as source_id,
             reversed_by_entry_id::text as reversed_by_entry_id
      from accounting.journal_entries
      where id = ${params.entryId}
      limit 1
      for no key update
    `;
    if (!original) throw new Error(`Journal entry ${params.entryId} was not found.`);
    if (original.reversed_by_entry_id) {
      throw new Error(`Journal entry ${params.entryId} has already been reversed.`);
    }

    const lines = await client<
      {
        account_id: string;
        party_type: string | null;
        party_id: string | null;
        wallet_id: string | null;
        wallet_bucket: string | null;
        currency_code: string;
        debit_amount: string;
        credit_amount: string;
        memo: string | null;
      }[]
    >`
      select account_id::text as account_id, party_type, party_id::text as party_id,
             wallet_id::text as wallet_id, wallet_bucket, currency_code,
             debit_amount::text as debit_amount, credit_amount::text as credit_amount, memo
      from accounting.journal_lines
      where entry_id = ${params.entryId}
      order by line_no
    `;

    const reversal = await postJournalEntry(
      {
        idempotencyKey: `reversal:${params.entryId}`,
        sourceType: original.source_type,
        sourceId: original.source_id ?? undefined,
        description: params.reason,
        actorUserId: params.actorUserId,
        reversesEntryId: params.entryId,
        lines: lines.map((l) => ({
          accountId: l.account_id,
          // Swap the sides — that is the whole of a reversing entry.
          direction: Number(l.debit_amount) > 0 ? ("credit" as const) : ("debit" as const),
          amount: Number(l.debit_amount) > 0 ? l.debit_amount : l.credit_amount,
          currencyCode: l.currency_code,
          partyType: (l.party_type as never) ?? undefined,
          partyId: l.party_id ?? undefined,
          walletId: l.wallet_id ?? undefined,
          // The reversal must move the SAME balance back. Defaulting to `available`
          // here would credit available and debit available on a withdrawal hold,
          // leaving the reserve stranded and the customer short.
          walletBucket: (l.wallet_bucket as never) ?? undefined,
          movementType: "reversal" as const,
          memo: params.reason,
        })),
      },
      client
    );

    // The one update a posted entry permits: stamping the pointer to its reversal.
    await client`
      update accounting.journal_entries
         set reversed_by_entry_id = ${reversal.entryId}, status = 'reversed'
       where id = ${params.entryId}
    `;

    return reversal;
  };

  return tx ? run(tx) : db.begin((client) => run(client as Tx));
}
