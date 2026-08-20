import { type Sql } from "postgres";

import sharedSql from "@/config/database/db";

// import { getCurrentUserIdOrThrow } from "../../share/auth";
import type {
  ReferralAdminDashboardData,
  ReferralPoliciesData,
  SaveReferralPoliciesInput,
} from "./types";
import { getCurrentUserIdOrThrow } from "@/app/[locale]/n/app/mobile/profile/wallet/auth";

function formatDiscount(discountType: "percent" | "fixed", discountValue: number): string {
  return discountType === "percent" ? `${discountValue}%` : `$${discountValue.toFixed(2)}`;
}

// This used to build a fresh `postgres()` client per call and nothing ever
// `.end()`ed it, so every admin referral action leaked a pool. The shared client
// in @/config/database/db is the single pool for the process and already reads
// DATABASE_URL — which points at PgBouncer in production.
export function createReferralAdminSqlClient(): Sql {
  return sharedSql;
}

export async function requireReferralAdminAccess(sql: Sql): Promise<string> {
  const userId = await getCurrentUserIdOrThrow();

  const rows = await sql<{ normalized_name: string | null }[]>`
    SELECT r.normalized_name
    FROM identity.asp_net_user_roles ur
    JOIN identity.asp_net_roles r
      ON r.id = ur.role_id
    WHERE ur.user_id = ${userId}
  `;

  const allowed = new Set([
    "ADMIN",
    "SUPERADMIN",
    "MARKETINGADMIN",
    "MARKETING_MANAGER",
  ]);

  const hasAccess = rows.some((row) => row.normalized_name && allowed.has(row.normalized_name));

  if (!hasAccess) {
    throw new Error("You do not have permission to manage referral programs.");
  }

  return userId;
}

export async function getReferralAdminDashboardData(
  sql: Sql
): Promise<ReferralAdminDashboardData> {
  await requireReferralAdminAccess(sql);

  const programRows = await sql<{
    id: string;
    name: string;
    code: string;
    status: string;
  }[]>`
    SELECT id, name, code, status
    FROM marketing.referral_programs
    WHERE status = 'active'
    ORDER BY is_default DESC, create_date DESC
    LIMIT 1
  `;

  const program = programRows[0];

  if (!program) {
    throw new Error("No active referral program was found.");
  }

  const summaryRows = await sql<{
    active_codes: number;
    invitations: number;
    registrations: number;
    profile_completions: number;
    qualified_referrals: number;
    coupons_issued: number;
    coupons_redeemed: number;
  }[]>`
    SELECT
      (SELECT COUNT(*) FROM marketing.referral_codes WHERE program_id = ${program.id} AND is_active = true) AS active_codes,
      (SELECT COUNT(*) FROM marketing.referral_invitations WHERE program_id = ${program.id}) AS invitations,
      (SELECT COUNT(*) FROM marketing.referral_invitations WHERE program_id = ${program.id} AND signed_up_at IS NOT NULL) AS registrations,
      (SELECT COUNT(*) FROM marketing.referral_invitations WHERE program_id = ${program.id} AND profile_completed_at IS NOT NULL) AS profile_completions,
      (SELECT COUNT(*) FROM marketing.referral_invitations WHERE program_id = ${program.id} AND qualified_at IS NOT NULL) AS qualified_referrals,
      (SELECT COUNT(*) FROM marketing.user_discount_coupons WHERE program_id = ${program.id}) AS coupons_issued,
      (SELECT COUNT(*) FROM marketing.user_discount_coupons WHERE program_id = ${program.id} AND status = 'redeemed') AS coupons_redeemed
  `;

  const invitationRows = await sql<{
    id: string;
    referrer: string;
    referee: string;
    status: string;
    invited_at: string | null;
    signed_up_at: string | null;
    qualified_at: string | null;
  }[]>`
    SELECT
      ri.id,
      COALESCE(NULLIF(BTRIM(CONCAT(rf.first_name, ' ', rf.last_name)), ''), rf.email, ri.referrer_customer_id::text) AS referrer,
      COALESCE(NULLIF(BTRIM(CONCAT(rc.first_name, ' ', rc.last_name)), ''), ri.referee_email, ri.referee_phone, 'Unknown') AS referee,
      ri.status::text AS status,
      ri.invited_at::text,
      ri.signed_up_at::text,
      ri.qualified_at::text
    FROM marketing.referral_invitations ri
    LEFT JOIN customer.customers rf ON rf.id = ri.referrer_customer_id
    LEFT JOIN customer.customers rc ON rc.id = ri.referee_customer_id
    WHERE ri.program_id = ${program.id}
    ORDER BY ri.invited_at DESC
    LIMIT 20
  `;

  const couponRows = await sql<{
    id: string;
    customer_name: string;
    title: string;
    discount_type: "percent" | "fixed";
    discount_value: string;
    status: string;
    issued_at: string | null;
    redeemed_at: string | null;
  }[]>`
    SELECT
      c.id,
      COALESCE(NULLIF(BTRIM(CONCAT(cc.first_name, ' ', cc.last_name)), ''), cc.email, c.customer_id::text) AS customer_name,
      c.title,
      c.discount_type,
      c.discount_value::text,
      c.status::text,
      c.issued_at::text,
      c.redeemed_at::text
    FROM marketing.user_discount_coupons c
    LEFT JOIN customer.customers cc ON cc.id = c.customer_id
    WHERE c.program_id = ${program.id}
    ORDER BY c.issued_at DESC
    LIMIT 20
  `;

  const summary = summaryRows[0];

  return {
    program,
    summary: {
      activeCodes: Number(summary?.active_codes ?? 0),
      invitations: Number(summary?.invitations ?? 0),
      registrations: Number(summary?.registrations ?? 0),
      profileCompletions: Number(summary?.profile_completions ?? 0),
      qualifiedReferrals: Number(summary?.qualified_referrals ?? 0),
      couponsIssued: Number(summary?.coupons_issued ?? 0),
      couponsRedeemed: Number(summary?.coupons_redeemed ?? 0),
    },
    invitations: invitationRows.map((row) => ({
      id: row.id,
      referrer: row.referrer,
      referee: row.referee,
      status: row.status,
      invitedAt: row.invited_at,
      signedUpAt: row.signed_up_at,
      qualifiedAt: row.qualified_at,
    })),
    coupons: couponRows.map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      title: row.title,
      discountDisplay: formatDiscount(row.discount_type, Number(row.discount_value)),
      status: row.status,
      issuedAt: row.issued_at,
      redeemedAt: row.redeemed_at,
    })),
  };
}

export async function getReferralPoliciesData(
  sql: Sql
): Promise<ReferralPoliciesData> {
  await requireReferralAdminAccess(sql);

  const programRows = await sql<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    allow_stacking: boolean;
    require_previous_coupon_redeemed: boolean;
    max_referrals_per_referrer: number | null;
  }[]>`
    SELECT
      id,
      name,
      code,
      description,
      status,
      allow_stacking,
      require_previous_coupon_redeemed,
      max_referrals_per_referrer
    FROM marketing.referral_programs
    WHERE status = 'active'
    ORDER BY is_default DESC, create_date DESC
    LIMIT 1
  `;

  const program = programRows[0];

  if (!program) {
    throw new Error("No active referral program was found.");
  }

  const rules = await sql<{
    id: string;
    trigger: any;
    recipient: any;
    referral_ordinal: number | null;
    discount_type: any;
    discount_value: string;
    title: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    requires_previous_coupon_redeemed: boolean;
  }[]>`
    SELECT
      id,
      trigger,
      recipient,
      referral_ordinal,
      discount_type,
      discount_value::text,
      title,
      description,
      sort_order,
      is_active,
      requires_previous_coupon_redeemed
    FROM marketing.referral_reward_rules
    WHERE program_id = ${program.id}
    ORDER BY sort_order ASC, referral_ordinal ASC NULLS LAST, create_date ASC
  `;

  return {
    program: {
      id: program.id,
      name: program.name,
      code: program.code,
      description: program.description,
      status: program.status,
      allowStacking: program.allow_stacking,
      requirePreviousCouponRedeemed: program.require_previous_coupon_redeemed,
      maxReferralsPerReferrer: program.max_referrals_per_referrer,
    },
    rules: rules.map((rule) => ({
      id: rule.id,
      trigger: rule.trigger,
      recipient: rule.recipient,
      referralOrdinal: rule.referral_ordinal,
      discountType: rule.discount_type,
      discountValue: Number(rule.discount_value),
      title: rule.title,
      description: rule.description,
      sortOrder: rule.sort_order,
      isActive: rule.is_active,
      requiresPreviousCouponRedeemed: rule.requires_previous_coupon_redeemed,
    })),
  };
}

export async function saveReferralPolicies(
  sql: Sql,
  input: SaveReferralPoliciesInput
): Promise<void> {
  await requireReferralAdminAccess(sql);

  await sql.begin(async (tx) => {
    await tx`
      UPDATE marketing.referral_programs
      SET
        name = ${input.name},
        description = ${input.description},
        allow_stacking = ${input.allowStacking},
        require_previous_coupon_redeemed = ${input.requirePreviousCouponRedeemed},
        max_referrals_per_referrer = ${input.maxReferralsPerReferrer},
        last_modified_date = NOW()
      WHERE id = ${input.programId}
    `;

    await tx`
      DELETE FROM marketing.referral_reward_rules
      WHERE program_id = ${input.programId}
    `;

    for (const rule of input.rules) {
      await tx`
        INSERT INTO marketing.referral_reward_rules (
          id,
          program_id,
          trigger,
          recipient,
          referral_ordinal,
          discount_type,
          discount_value,
          title,
          description,
          sort_order,
          is_active,
          requires_previous_coupon_redeemed
        ) VALUES (
          ${rule.id},
          ${input.programId},
          ${rule.trigger},
          ${rule.recipient},
          ${rule.referralOrdinal},
          ${rule.discountType},
          ${rule.discountValue},
          ${rule.title},
          ${rule.description},
          ${rule.sortOrder},
          ${rule.isActive},
          ${rule.requiresPreviousCouponRedeemed}
        )
      `;
    }
  });
}
