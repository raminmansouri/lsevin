import "server-only";

import db from "@/config/database/db";

import { approvalLimitFor } from "./access";
import type { PanelRole } from "./permissions";

/**
 * Moves provider ledger rows through pending -> approved -> paid (or cancelled) from the
 * financial panel. The same rows and statuses /admin/commercial/provider-ledgers edits,
 * so both screens always agree.
 *
 * Approving is a decision and paying is a fact: "paid" needs the bank reference of the
 * transfer that actually went out, and is recorded for exactly the rows the accountant
 * was looking at, so an entry approved a moment later is never marked paid unseen.
 */

export class ProviderPayoutRuleError extends Error {
  constructor(
    message: string,
    readonly code:
      | "nothing_selected"
      | "changed"
      | "mixed"
      | "not_positive"
      | "reference_required"
      | "over_approval_limit"
      | "same_approver"
  ) {
    super(message);
    this.name = "ProviderPayoutRuleError";
  }
}

function cleanIds(ids: string[]): string[] {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) throw new ProviderPayoutRuleError("No entries selected.", "nothing_selected");
  return unique;
}

export async function approveProviderEntries(input: {
  ids: string[];
  actorUserId: string;
  /** The approver's panel role; an accounting manager is held to the approval limit. */
  approverRole: PanelRole;
}) {
  const ids = cleanIds(input.ids);
  return db.begin(async (tx) => {
    // Above the accounting manager's limit an entry waits for the manager. Checked per
    // entry, the same way a single withdrawal is, so "approve all" cannot sum its way
    // past the rule — and it refuses the whole batch rather than approving part of it.
    const currencies = await tx<{ currencyCode: string }[]>`
      select distinct currency_code as "currencyCode"
        from commercial.provider_ledgers
       where id = any(${ids}::uuid[])
    `;
    for (const { currencyCode } of currencies) {
      const limit = await approvalLimitFor(input.approverRole, currencyCode, tx);
      if (limit === null) continue;
      const [over] = await tx<{ count: number }[]>`
        select count(*)::int as count
          from commercial.provider_ledgers
         where id = any(${ids}::uuid[])
           and currency_code = ${currencyCode}
           and amount > ${limit}::numeric
      `;
      if (over.count > 0) {
        throw new ProviderPayoutRuleError("Above the accounting manager's approval limit.", "over_approval_limit");
      }
    }

    const rows = await tx<{ id: string }[]>`
      update commercial.provider_ledgers
         set status = 'approved',
             metadata = coalesce(metadata, '{}'::jsonb) || ${{
               approvedBy: input.actorUserId,
               approvedAt: new Date().toISOString(),
               approvedIn: "financial_panel",
             } as never},
             updated_at = now()
       where id = any(${ids}::uuid[])
         and status = 'pending'
       returning id::text as id
    `;
    if (rows.length !== ids.length) {
      throw new ProviderPayoutRuleError("Some entries were already handled.", "changed");
    }
    return { approved: rows.length };
  });
}

export async function cancelProviderEntry(input: { id: string; actorUserId: string; reason: string }) {
  const [id] = cleanIds([input.id]);
  const rows = await db<{ id: string }[]>`
    update commercial.provider_ledgers
       set status = 'cancelled',
           notes = ${input.reason},
           metadata = coalesce(metadata, '{}'::jsonb) || ${{
             cancelledBy: input.actorUserId,
             cancelledAt: new Date().toISOString(),
             cancelledIn: "financial_panel",
           } as never},
           updated_at = now()
     where id = ${id}
       and status in ('pending', 'approved')
     returning id::text as id
  `;
  if (rows.length !== 1) throw new ProviderPayoutRuleError("This entry was already handled.", "changed");
  return { cancelled: 1 };
}

export async function markProviderEntriesPaid(input: { ids: string[]; actorUserId: string; reference: string }) {
  const ids = cleanIds(input.ids);
  const reference = input.reference.trim();
  if (!reference) throw new ProviderPayoutRuleError("The transfer reference is required.", "reference_required");

  return db.begin(async (tx) => {
    const rows = await tx<
      { id: string; status: string; providerId: string; currencyCode: string; amount: string; approvedBy: string | null }[]
    >`
      select id::text as id, status, provider_id::text as "providerId", currency_code as "currencyCode",
             amount::text as amount, metadata ->> 'approvedBy' as "approvedBy"
      from commercial.provider_ledgers
      where id = any(${ids}::uuid[])
      for update
    `;
    if (rows.length !== ids.length || rows.some((r) => r.status !== "approved")) {
      throw new ProviderPayoutRuleError("Some entries changed since the page loaded.", "changed");
    }
    // Whoever approved a payout does not also record it as sent: two people see every
    // payment, the same four-eyes rule the journal applies to its documents.
    if (rows.some((r) => r.approvedBy === input.actorUserId)) {
      throw new ProviderPayoutRuleError("The approver cannot also record the payment.", "same_approver");
    }
    if (new Set(rows.map((r) => `${r.providerId}:${r.currencyCode}`)).size !== 1) {
      throw new ProviderPayoutRuleError("One transfer can only pay one provider in one currency.", "mixed");
    }
    const totalCents = rows.reduce((acc, r) => acc + Math.round(Number(r.amount) * 100), 0);
    if (totalCents <= 0) {
      throw new ProviderPayoutRuleError("Nothing is owed for these entries.", "not_positive");
    }

    await tx`
      update commercial.provider_ledgers
         set status = 'paid',
             metadata = coalesce(metadata, '{}'::jsonb) || ${{
               payoutReference: reference,
               paidAt: new Date().toISOString(),
               paidBy: input.actorUserId,
               paidIn: "financial_panel",
             } as never},
             updated_at = now()
       where id = any(${ids}::uuid[])
    `;
    return { paid: rows.length, total: (totalCents / 100).toFixed(2) };
  });
}
