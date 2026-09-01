import "server-only";

import sql from "@/config/database/db";

/**
 * Tiered referral commission.
 *
 * The percentage comes from marketing.referral_commission_tiers, never from a
 * constant here, and it applies to the PLATFORM COMMISSION on a referred user's
 * booking rather than to the transaction total.
 *
 * The rate is resolved at the moment the commission is earned and written into the
 * row. A referrer who later climbs a tier does not have their past earnings
 * recalculated, and one who drops does not lose them.
 */

export type ReferralTier = {
  minReferrals: number;
  maxReferrals: number | null;
  commissionPercent: number;
};

export type ReferralStanding = {
  qualifiedReferrals: number;
  commissionPercent: number;
  nextTierAt: number | null;
  referralsToNextTier: number | null;
};

/** How many people this customer has brought in who actually qualified. */
export async function countQualifiedReferrals(referrerCustomerId: string): Promise<number> {
  const [row] = await sql<{ total: number }[]>`
    select count(*)::int as total
    from marketing.referral_invitations ri
    where ri.referrer_customer_id = ${referrerCustomerId}::uuid
      and ri.referee_customer_id is not null
      and ri.qualified_at is not null
  `;
  return Number(row?.total ?? 0);
}

export async function listReferralTiers(): Promise<ReferralTier[]> {
  const rows = await sql<{ minReferrals: number; maxReferrals: number | null; commissionPercent: string }[]>`
    select min_referrals as "minReferrals",
           max_referrals as "maxReferrals",
           commission_percent as "commissionPercent"
    from marketing.referral_commission_tiers
    where is_active
    order by min_referrals asc
  `;
  return rows.map((row) => ({
    minReferrals: Number(row.minReferrals),
    maxReferrals: row.maxReferrals === null ? null : Number(row.maxReferrals),
    commissionPercent: Number(row.commissionPercent),
  }));
}

/**
 * Where the referrer stands: their current rate and how far the next step is.
 * Below the first band the rate is zero rather than an error, so a customer with
 * no qualified referrals simply earns nothing.
 */
export async function getReferralStanding(referrerCustomerId: string): Promise<ReferralStanding> {
  const [qualifiedReferrals, tiers] = await Promise.all([
    countQualifiedReferrals(referrerCustomerId),
    listReferralTiers(),
  ]);

  const current = tiers.find(
    (tier) =>
      qualifiedReferrals >= tier.minReferrals &&
      (tier.maxReferrals === null || qualifiedReferrals <= tier.maxReferrals),
  );

  const next = tiers.find((tier) => tier.minReferrals > qualifiedReferrals);

  return {
    qualifiedReferrals,
    commissionPercent: current?.commissionPercent ?? 0,
    nextTierAt: next?.minReferrals ?? null,
    referralsToNextTier: next ? next.minReferrals - qualifiedReferrals : null,
  };
}

/**
 * Who, if anyone, gets paid for this customer's booking.
 *
 * Self-referral and mutual referral are both rejected here rather than at sign-up,
 * because either can be created by editing rows directly and this is the last point
 * before money moves.
 */
export async function findCommissionableReferrer(
  refereeCustomerId: string,
): Promise<{ referrerCustomerId: string } | null> {
  const [row] = await sql<{ referrerCustomerId: string }[]>`
    select ri.referrer_customer_id::text as "referrerCustomerId"
    from marketing.referral_invitations ri
    where ri.referee_customer_id = ${refereeCustomerId}::uuid
      and ri.qualified_at is not null
      and ri.referrer_customer_id <> ri.referee_customer_id
      -- Two accounts naming each other pay nobody.
      and not exists (
        select 1
        from marketing.referral_invitations back
        where back.referrer_customer_id = ri.referee_customer_id
          and back.referee_customer_id = ri.referrer_customer_id
      )
    order by ri.qualified_at asc
    limit 1
  `;
  return row ?? null;
}

/**
 * Record what a booking earned. Returns null when there is no referrer, no tier or
 * nothing to pay.
 *
 * The unique index on booking_id makes this safe to call more than once: a replayed
 * settlement conflicts instead of paying twice.
 */
export async function recordReferralCommission(input: {
  refereeCustomerId: string;
  bookingId: string;
  platformCommissionAmount: number;
  currencyCode: string;
}): Promise<{ commissionId: string; commissionAmount: number; commissionPercent: number } | null> {
  if (!(input.platformCommissionAmount > 0)) return null;

  const referrer = await findCommissionableReferrer(input.refereeCustomerId);
  if (!referrer) return null;

  const standing = await getReferralStanding(referrer.referrerCustomerId);
  if (!(standing.commissionPercent > 0)) return null;

  const commissionAmount =
    Math.round(input.platformCommissionAmount * standing.commissionPercent) / 100;
  if (!(commissionAmount > 0)) return null;

  const rows = await sql<{ id: string }[]>`
    insert into marketing.referral_commissions (
      referrer_customer_id, referee_customer_id, booking_id,
      platform_commission_amount, currency_code,
      qualified_referrals_at_time, commission_percent, commission_amount, status
    ) values (
      ${referrer.referrerCustomerId}::uuid,
      ${input.refereeCustomerId}::uuid,
      ${input.bookingId}::uuid,
      ${input.platformCommissionAmount},
      ${input.currencyCode},
      ${standing.qualifiedReferrals},
      ${standing.commissionPercent},
      ${commissionAmount},
      'pending'
    )
    on conflict (booking_id) do nothing
    returning id::text as id
  `;

  if (!rows.length) return null;

  return {
    commissionId: rows[0].id,
    commissionAmount,
    commissionPercent: standing.commissionPercent,
  };
}

/** Commission history for the referrer's own panel. */
export async function listReferralCommissions(referrerCustomerId: string, limit = 50) {
  return sql<
    {
      id: string;
      bookingId: string;
      commissionAmount: string;
      commissionPercent: string;
      currencyCode: string;
      status: string;
      createdAt: string;
    }[]
  >`
    select id::text as id,
           booking_id::text as "bookingId",
           commission_amount as "commissionAmount",
           commission_percent as "commissionPercent",
           currency_code as "currencyCode",
           status,
           created_at::text as "createdAt"
    from marketing.referral_commissions
    where referrer_customer_id = ${referrerCustomerId}::uuid
    order by created_at desc
    limit ${limit}
  `;
}
