import "server-only";

import db from "@/config/database/db";

/**
 * What the platform owes doctors, hotels and other providers, read straight from
 * commercial.provider_ledgers.
 *
 * Checkout writes one 'earning' row per charge line (the provider's share), a refund
 * writes a negative 'reversal', and an admin can add an 'adjustment'. Each row moves
 * pending -> approved -> paid (or cancelled). The withdrawal queue used to read only
 * accounting.withdrawal_requests, which nothing writes, so none of this was visible.
 *
 * An earning only becomes payable once the customer has actually paid something for the
 * booking: checkout writes the earning before payment, and an abandoned or cancelled
 * booking owes the provider nothing.
 */

const PANEL_TRANSLATION_LOCALE = "fa-IR";

export type ProviderPayoutEntry = {
  id: string;
  entryType: "earning" | "adjustment" | "reversal" | "payout";
  status: "pending" | "approved" | "paid" | "cancelled";
  amount: string;
  currencyCode: string;
  notes: string | null;
  createdAt: string;
  bookingId: string | null;
  confirmationCode: string | null;
  serviceName: string | null;
  selectedDate: string | null;
  customerName: string | null;
  /** full / deposit / partial / unpaid: how much of the booking the customer has paid. */
  customerPayment: "full" | "deposit" | "partial" | "unpaid" | null;
  payoutReference: string | null;
  paidAt: string | null;
};

export type ProviderPayoutGroup = {
  providerId: string;
  providerName: string;
  providerType: string | null;
  providerEmail: string | null;
  providerPhone: string | null;
  currencyCode: string;
  payoutAccount: {
    holderName: string;
    bankName: string | null;
    iban: string | null;
    accountNumberLast4: string | null;
  } | null;
  pendingTotal: string;
  approvedTotal: string;
  entries: ProviderPayoutEntry[];
};

type Row = ProviderPayoutEntry & {
  providerId: string;
  providerName: string;
  providerType: string | null;
  providerEmail: string | null;
  providerPhone: string | null;
  accountHolderName: string | null;
  accountBankName: string | null;
  accountIban: string | null;
  accountLast4: string | null;
};

function entryColumns() {
  return db`
    pl.id::text as "id",
    pl.entry_type as "entryType",
    pl.status,
    pl.amount::text as "amount",
    pl.currency_code as "currencyCode",
    pl.notes,
    pl.created_at::text as "createdAt",
    pl.booking_id::text as "bookingId",
    b.confirmation_code as "confirmationCode",
    coalesce(
      nullif(common.get_translation_t(ps.display_name_translations, ${PANEL_TRANSLATION_LOCALE}, 'en-US'), ''),
      nullif(common.get_translation_t(sd.name_translations, ${PANEL_TRANSLATION_LOCALE}, 'en-US'), '')
    ) as "serviceName",
    b.selected_date::text as "selectedDate",
    nullif(trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), '') as "customerName",
    case
      when b.id is null then null
      when coalesce(b.paid_amount, 0) <= 0 then 'unpaid'
      when coalesce(b.paid_amount, 0) >= coalesce(b.total_amount, b.display_total_amount, 0) - 0.005 then 'full'
      when lower(coalesce(b.payment_status, '')) in ('partiallypaid', 'partially_paid', 'partial') then 'partial'
      else 'deposit'
    end as "customerPayment",
    pl.metadata->>'payoutReference' as "payoutReference",
    pl.metadata->>'paidAt' as "paidAt",
    pl.provider_id::text as "providerId",
    coalesce(nullif(common.get_translation_t(sp.name_translations, ${PANEL_TRANSLATION_LOCALE}, 'en-US'), ''), '-') as "providerName",
    nullif(common.get_translation_t(pt.name_translations, ${PANEL_TRANSLATION_LOCALE}, 'en-US'), '') as "providerType",
    sp.email as "providerEmail",
    nullif(concat(sp.phone_number_country_code, sp.phone_number), '') as "providerPhone",
    pa.account_holder_name as "accountHolderName",
    pa.bank_name as "accountBankName",
    pa.iban as "accountIban",
    pa.account_number_last4 as "accountLast4"
  `;
}

function entryJoins() {
  return db`
    left join booking.bookings b on b.id = pl.booking_id
    left join category.service_providers sp on sp.id = pl.provider_id
    left join category.provider_types pt on pt.id = sp.provider_type_id
    left join category.provider_services ps on ps.id = b.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    left join identity.asp_net_users u on u.id = b.user_id
    left join lateral (
      select a.account_holder_name, a.bank_name, a.iban, a.account_number_last4
      from provider_portal.payout_accounts a
      where a.service_provider_id = pl.provider_id
      order by a.is_default desc, (a.currency_code = pl.currency_code) desc, a.last_modified_date desc
      limit 1
    ) pa on true
  `;
}

function sum(values: string[]): string {
  // Two-decimal money: add in integer cents so a long list does not drift.
  const cents = values.reduce((acc, v) => acc + BigInt(Math.round(Number(v) * 100)), 0n);
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  return `${negative ? "-" : ""}${abs / 100n}.${String(abs % 100n).padStart(2, "0")}`;
}

function group(rows: Row[]): ProviderPayoutGroup[] {
  const groups = new Map<string, ProviderPayoutGroup>();
  for (const row of rows) {
    const key = `${row.providerId}:${row.currencyCode}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        providerId: row.providerId,
        providerName: row.providerName,
        providerType: row.providerType,
        providerEmail: row.providerEmail,
        providerPhone: row.providerPhone,
        currencyCode: row.currencyCode,
        payoutAccount: row.accountHolderName
          ? {
              holderName: row.accountHolderName,
              bankName: row.accountBankName,
              iban: row.accountIban,
              accountNumberLast4: row.accountLast4,
            }
          : null,
        pendingTotal: "0.00",
        approvedTotal: "0.00",
        entries: [],
      };
      groups.set(key, g);
    }
    g.entries.push({
      id: row.id,
      entryType: row.entryType,
      status: row.status,
      amount: row.amount,
      currencyCode: row.currencyCode,
      notes: row.notes,
      createdAt: row.createdAt,
      bookingId: row.bookingId,
      confirmationCode: row.confirmationCode,
      serviceName: row.serviceName,
      selectedDate: row.selectedDate,
      customerName: row.customerName,
      customerPayment: row.customerPayment,
      payoutReference: row.payoutReference,
      paidAt: row.paidAt,
    });
  }
  for (const g of groups.values()) {
    g.pendingTotal = sum(g.entries.filter((e) => e.status === "pending").map((e) => e.amount));
    g.approvedTotal = sum(g.entries.filter((e) => e.status === "approved").map((e) => e.amount));
  }
  return [...groups.values()];
}

/**
 * Provider money still to settle: pending (to approve) and approved (to pay), grouped by
 * provider and currency. Earnings on bookings the customer has not paid anything for, or
 * that were cancelled, are left out until that changes. Earnings whose booking was deleted
 * are left out for good.
 */
export async function listProviderPayoutsDue(limit = 2000): Promise<ProviderPayoutGroup[]> {
  const rows = await db<Row[]>`
    select ${entryColumns()}
    from commercial.provider_ledgers pl
    ${entryJoins()}
    where pl.status in ('pending', 'approved')
      and pl.entry_type <> 'payout'
      and (
        -- A manual adjustment has no booking. An earning without a booking is left over from
        -- a booking that was deleted (booking_id is set null on delete): nothing is owed on it.
        (pl.booking_id is null and pl.entry_type = 'adjustment')
        or (
          coalesce(b.paid_amount, 0) > 0
          and lower(coalesce(b.booking_status, '')) not in ('cancelled', 'canceled', 'rejected')
        )
        -- A reversal still nets against the provider even when the booking was cancelled.
        or pl.entry_type = 'reversal'
      )
    order by pl.created_at asc
    limit ${limit}
  `;
  return group(rows);
}

/** Provider entries marked paid in the last `days` days, newest first. */
export async function listRecentProviderPayouts(days = 30, limit = 500): Promise<ProviderPayoutGroup[]> {
  const rows = await db<Row[]>`
    select ${entryColumns()}
    from commercial.provider_ledgers pl
    ${entryJoins()}
    where pl.status = 'paid'
      and pl.updated_at >= now() - make_interval(days => ${days})
    order by pl.updated_at desc
    limit ${limit}
  `;
  return group(rows);
}
