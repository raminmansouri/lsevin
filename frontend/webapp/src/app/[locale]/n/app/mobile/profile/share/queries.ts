import { type Sql } from "postgres";

import sharedSql from "@/config/database/db";

import type {
  CouponQueueItem,
  DiscountType,
  ReferralHistoryItem,
  ShareFriendsPageData,
} from "./types";
import { formatDiscountValue } from "./utils";

export interface ResolvedCustomer {
  identityUserId: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumberCountryCode: string;
  phoneNumber: string;
}

interface ReferralProgramRow {
  id: string;
  name: string;
  description: string | null;
  allow_stacking: boolean;
  require_previous_coupon_redeemed: boolean;
  max_referrals_per_referrer: number | null;
}

interface ReferralRuleRow {
  trigger: string;
  recipient: string;
  referral_ordinal: number | null;
  discount_type: DiscountType;
  discount_value: string | number;
  title: string;
  is_active: boolean;
}

// Every caller used to build its own `postgres()` client here — a fresh
// connection pool per server action, none of which was ever `.end()`ed. Under
// load that leaks pools until PgBouncer's max_client_conn is reached. The shared
// client in @/config/database/db is the single pool for the whole process and
// already reads DATABASE_URL (which points at PgBouncer in production), so it is
// also the only place where pooling and prepare settings have to stay correct.
export function createReferralSqlClient(): Sql {
  return sharedSql;
}

export async function getShareFriendsPageData(
  sql: Sql,
  identityUserId: string,
  appBaseUrl: string
): Promise<ShareFriendsPageData> {
  const customer = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const program = await getActiveReferralProgram(sql);
  const referralCode = await ensureReferralCode(sql, {
    customer,
    programId: program.id,
  });
  const rules = await getProgramRules(sql, program.id);

  const statsRows = await sql<{
    total_referrals: number;
    pending_rewards: string;
    earned_rewards: string;
  }[]>`
    SELECT
      COUNT(*) FILTER (WHERE ri.signed_up_at IS NOT NULL) AS total_referrals,
      COALESCE(SUM(CASE WHEN c.status IN ('issued', 'reserved') THEN c.discount_value ELSE 0 END), 0) AS pending_rewards,
      COALESCE(SUM(CASE WHEN c.status = 'redeemed' THEN c.discount_value ELSE 0 END), 0) AS earned_rewards
    FROM marketing.referral_invitations ri
    LEFT JOIN marketing.user_discount_coupons c
      ON c.referral_invitation_id = ri.id
     AND c.customer_id = ri.referrer_customer_id
    WHERE ri.program_id = ${program.id}
      AND ri.referrer_customer_id = ${customer.customerId}
  `;

  const historyRows = await sql<{
    id: string;
    name: string;
    event_date: string | null;
    status: string;
    discount_type: DiscountType | null;
    discount_value: string | null;
    currency_code: string | null;
  }[]>`
    SELECT
      ri.id,
      COALESCE(
        NULLIF(BTRIM(CONCAT(COALESCE(rc.first_name, ''), ' ', COALESCE(rc.last_name, ''))), ''),
        NULLIF(BTRIM(ri.referee_email), ''),
        NULLIF(BTRIM(ri.referee_phone), ''),
        'Invited friend'
      ) AS name,
      COALESCE(
        ri.first_booking_completed_at,
        ri.qualified_at,
        ri.profile_completed_at,
        ri.signed_up_at,
        ri.invited_at
      )::text AS event_date,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM marketing.user_discount_coupons uc
          WHERE uc.referral_invitation_id = ri.id
            AND uc.customer_id = ri.referrer_customer_id
            AND uc.status = 'redeemed'
        ) OR ri.first_booking_completed_at IS NOT NULL OR ri.qualified_at IS NOT NULL
          THEN 'completed'
        WHEN ri.signed_up_at IS NOT NULL OR ri.profile_completed_at IS NOT NULL
          THEN 'pending'
        ELSE 'invited'
      END AS status,
      latest_coupon.discount_type,
      latest_coupon.discount_value::text,
      latest_coupon.currency_code
    FROM marketing.referral_invitations ri
    LEFT JOIN customer.customers rc
      ON rc.id = ri.referee_customer_id
    LEFT JOIN LATERAL (
      SELECT uc.discount_type, uc.discount_value, uc.currency_code
      FROM marketing.user_discount_coupons uc
      WHERE uc.referral_invitation_id = ri.id
        AND uc.customer_id = ri.referrer_customer_id
      ORDER BY uc.issued_at DESC
      LIMIT 1
    ) AS latest_coupon ON TRUE
    WHERE ri.program_id = ${program.id}
      AND ri.referrer_customer_id = ${customer.customerId}
    ORDER BY COALESCE(ri.first_booking_completed_at, ri.qualified_at, ri.profile_completed_at, ri.signed_up_at, ri.invited_at) DESC
    LIMIT 20
  `;

  const couponQueueRows = await sql<{
    id: string;
    title: string;
    status: string;
    discount_type: DiscountType;
    discount_value: string;
    currency_code: string | null;
    issued_at: string;
    queue_position: number;
  }[]>`
    SELECT
      id,
      title,
      status,
      discount_type,
      discount_value::text,
      currency_code,
      issued_at::text,
      queue_position
    FROM marketing.user_discount_coupons
    WHERE customer_id = ${customer.customerId}
      AND status IN ('issued', 'reserved')
    ORDER BY queue_position ASC, issued_at ASC
    LIMIT 5
  `;

  const statsRow = statsRows[0] ?? {
    total_referrals: 0,
    pending_rewards: "0",
    earned_rewards: "0",
  };

  const history: ReferralHistoryItem[] = historyRows.map((row) => {
    const rewardValue = row.discount_value === null ? null : Number(row.discount_value);
    const rewardType = row.discount_type ?? "percent";

    return {
      id: row.id,
      name: row.name,
      date: row.event_date,
      status: normalizeHistoryStatus(row.status),
      rewardValue,
      rewardType,
      rewardDisplay:
        rewardValue === null
          ? "—"
          : formatDiscountValue(rewardType, rewardValue, row.currency_code ?? "USD"),
    };
  });

  const couponQueue: CouponQueueItem[] = couponQueueRows.map((row) => ({
    id: row.id,
    title: row.title,
    status: normalizeCouponStatus(row.status),
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    discountDisplay: formatDiscountValue(
      row.discount_type,
      Number(row.discount_value),
      row.currency_code ?? "USD"
    ),
    issuedAt: row.issued_at,
    queuePosition: row.queue_position,
  }));

  const referrerRuleValues = rules
    .filter((rule) => rule.is_active && rule.recipient === "referrer")
    .sort((a, b) => (a.referral_ordinal ?? 9999) - (b.referral_ordinal ?? 9999))
    .map((rule) => formatDiscountValue(rule.discount_type, Number(rule.discount_value), "USD"));

  const refereeRuleValues = rules
    .filter((rule) => rule.is_active && rule.recipient === "referee")
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((rule) => `${rule.title}: ${formatDiscountValue(rule.discount_type, Number(rule.discount_value), "USD")}`);

  const heroSubtitle = referrerRuleValues.length > 0
    ? `Current rewards unlock in sequence: ${referrerRuleValues.join(", ")}.`
    : "Share your code and earn referral rewards based on the active program.";

  const referralLink = `${appBaseUrl.replace(/\/$/, "")}/ref/${referralCode}`;

  return {
    programName: program.name,
    programDescription: program.description,
    referralCode,
    referralLink,
    heroSubtitle,
    shareMessage: `Join LSevin with my referral code ${referralCode}. ${heroSubtitle} Sign up here: ${referralLink}`,
    stats: {
      totalReferrals: Number(statsRow.total_referrals ?? 0),
      pendingRewards: Number(statsRow.pending_rewards ?? 0),
      earnedRewards: Number(statsRow.earned_rewards ?? 0),
    },
    referralHistory: history,
    couponQueue,
    terms: buildTerms({
      allowStacking: program.allow_stacking,
      requirePreviousCouponRedeemed: program.require_previous_coupon_redeemed,
      maxReferralsPerReferrer: program.max_referrals_per_referrer,
      referrerRuleValues,
      refereeRuleValues,
    }),
  };
}


type IdentityUserForCustomer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number_country_code: string;
  phone_number: string;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  is_profile_confirmed: boolean;
  profile_confirmed_at: string | null;
};

type CustomerRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number_country_code: string;
  phone_number: string;
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

async function getIdentityUserForCustomer(
  sql: Sql,
  identityUserId: string
): Promise<IdentityUserForCustomer> {
  const rows = await sql<IdentityUserForCustomer[]>`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone_number_country_code,
      phone_number,
      birth_date,
      gender,
      address,
      city,
      country,
      is_profile_confirmed,
      profile_confirmed_at
    FROM identity.asp_net_users
    WHERE id = ${identityUserId}
    LIMIT 1
  `;

  const identityUser = rows[0];

  if (!identityUser) {
    throw new Error("Authenticated user was not found.");
  }

  return identityUser;
}

export async function findCustomerForIdentityUser(
  sql: Sql,
  identityUser: IdentityUserForCustomer
): Promise<CustomerRecord | null> {
  const rows = await sql<CustomerRecord[]>`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone_number_country_code,
      phone_number
    FROM customer.customers
    WHERE id = ${identityUser.id}
       OR email = ${identityUser.email}
       OR (
         phone_number_country_code = ${identityUser.phone_number_country_code}
         AND phone_number = ${identityUser.phone_number}
       )
    ORDER BY
      CASE
        WHEN id = ${identityUser.id} THEN 0
        WHEN email = ${identityUser.email} THEN 1
        ELSE 2
      END,
      create_date ASC
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createCustomerFromIdentityUser(
  sql: Sql,
  identityUser: IdentityUserForCustomer
): Promise<CustomerRecord> {
  const streetTranslations = identityUser.address?.trim()
    ? JSON.stringify({ en: identityUser.address.trim() })
    : null;

  try {
    const rows = await sql<CustomerRecord[]>`
      INSERT INTO customer.customers (
        id,
        phone_number,
        phone_number_country_code,
        email,
        birth_date,
        street_translations,
        city,
        country,
        detail_translations,
        zip_code,
        first_name,
        last_name,
        create_date,
        last_modified_date,
        gender,
        is_active,
        latitude,
        longitude,
        is_profile_confirmed,
        profile_confirmed_at
      )
      VALUES (
        ${identityUser.id},
        ${identityUser.phone_number},
        ${identityUser.phone_number_country_code},
        ${identityUser.email},
        ${identityUser.birth_date},
        ${streetTranslations}::jsonb,
        ${identityUser.city},
        ${identityUser.country},
        ${null}::jsonb,
        ${null},
        ${identityUser.first_name},
        ${identityUser.last_name},
        now(),
        now(),
        ${identityUser.gender},
        true,
        ${null},
        ${null},
        ${identityUser.is_profile_confirmed},
        ${identityUser.profile_confirmed_at}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING
        id,
        first_name,
        last_name,
        email,
        phone_number_country_code,
        phone_number
    `;

    if (rows[0]) {
      return rows[0];
    }

    const existingCustomer = await findCustomerForIdentityUser(sql, identityUser);

    if (existingCustomer) {
      return existingCustomer;
    }

    throw new Error("Customer could not be created or resolved.");
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existingCustomer = await findCustomerForIdentityUser(sql, identityUser);

      if (existingCustomer) {
        return existingCustomer;
      }
    }

    throw error;
  }
}

export async function ensureCustomerFromIdentityUser(
  sql: Sql,
  identityUser: IdentityUserForCustomer
): Promise<CustomerRecord> {
  const existingCustomer = await findCustomerForIdentityUser(sql, identityUser);

  if (existingCustomer) {
    return existingCustomer;
  }

  return createCustomerFromIdentityUser(sql, identityUser);
}

export async function resolveCustomerFromIdentityUser(
  sql: Sql,
  identityUserId: string
): Promise<ResolvedCustomer> {
  const identityUser = await getIdentityUserForCustomer(sql, identityUserId);
  const customer = await ensureCustomerFromIdentityUser(sql, identityUser);

  return {
    identityUserId: identityUser.id,
    customerId: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    phoneNumberCountryCode: customer.phone_number_country_code,
    phoneNumber: customer.phone_number,
  };
}

async function getActiveReferralProgram(
  sql: Sql
): Promise<ReferralProgramRow> {
  const rows = await sql<ReferralProgramRow[]>`
    SELECT
      id,
      name,
      description,
      allow_stacking,
      require_previous_coupon_redeemed,
      max_referrals_per_referrer
    FROM marketing.referral_programs
    WHERE status = 'active'
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at >= NOW())
    ORDER BY is_default DESC, create_date DESC
    LIMIT 1
  `;

  const program = rows[0];

  if (!program) {
    throw new Error(
      "No active marketing.referral_programs row was found. Run the migration and activate a program first."
    );
  }

  return program;
}

async function getProgramRules(
  sql: Sql,
  programId: string
): Promise<ReferralRuleRow[]> {
  return sql<ReferralRuleRow[]>`
    SELECT
      trigger,
      recipient,
      referral_ordinal,
      discount_type,
      discount_value,
      title,
      is_active
    FROM marketing.referral_reward_rules
    WHERE program_id = ${programId}
    ORDER BY sort_order ASC, referral_ordinal ASC NULLS LAST, create_date ASC
  `;
}

async function ensureReferralCode(
  sql: Sql,
  args: {
    customer: ResolvedCustomer;
    programId: string;
  }
): Promise<string> {
  const existingRows = await sql<{ code: string }[]>`
    SELECT code
    FROM marketing.referral_codes
    WHERE customer_id = ${args.customer.customerId}
      AND program_id = ${args.programId}
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1
  `;

  const existing = existingRows[0];

  if (existing) {
    return existing.code;
  }

  const base = `${sanitizeCodePart(args.customer.firstName)}${sanitizeCodePart(
    args.customer.lastName
  )}`.slice(0, 8) || "LSEVIN";

  for (let index = 0; index < 10; index += 1) {
    const code = `${base}${randomUppercase(4)}`;

    try {
      await sql`
        INSERT INTO marketing.referral_codes (
          program_id,
          customer_id,
          code,
          is_active
        ) VALUES (
          ${args.programId},
          ${args.customer.customerId},
          ${code},
          true
        )
      `;

      return code;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("referral_codes_code_key")) {
        continue;
      }
    }
  }

  throw new Error("Unable to generate a unique referral code.");
}

function buildTerms(args: {
  allowStacking: boolean;
  requirePreviousCouponRedeemed: boolean;
  maxReferralsPerReferrer: number | null;
  referrerRuleValues: string[];
  refereeRuleValues: string[];
}): string[] {
  const terms: string[] = [];

  terms.push(
    args.allowStacking
      ? "This program currently allows combinable discounts."
      : "Discounts cannot be combined in the same checkout."
  );

  if (args.requirePreviousCouponRedeemed) {
    terms.push("A newly earned discount unlocks only after the previous discount is redeemed.");
  }

  if (args.referrerRuleValues.length > 0) {
    terms.push(`Referrer reward sequence: ${args.referrerRuleValues.join(", ")}.`);
  }

  if (args.refereeRuleValues.length > 0) {
    terms.push(`Invitee onboarding rewards: ${args.refereeRuleValues.join(" • ")}.`);
  }

  if (args.maxReferralsPerReferrer !== null) {
    terms.push(`Each referrer can qualify for up to ${args.maxReferralsPerReferrer} referral rewards under the active program.`);
  }

  terms.push("LSevin can update the active referral policy at any time from admin.");

  return terms;
}

function normalizeHistoryStatus(value: string): "invited" | "pending" | "completed" {
  if (value === "completed") {
    return "completed";
  }

  if (value === "pending") {
    return "pending";
  }

  return "invited";
}

function normalizeCouponStatus(value: string) {
  switch (value) {
    case "reserved":
    case "redeemed":
    case "expired":
    case "cancelled":
      return value;
    default:
      return "issued";
  }
}

function sanitizeCodePart(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function randomUppercase(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return output;
}
