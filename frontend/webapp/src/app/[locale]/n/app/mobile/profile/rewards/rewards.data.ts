import sql from "@/config/database/db";
import {
  computeEarnedPoints,
  getPointsEarnDivisor,
} from "@/features/marketing-loyalty/server/loyalty-settings.repository";
import { getSession } from "@/lib/auth/session";
import { unstable_noStore as noStore } from "next/cache";

export type RewardsTab = "overview" | "coupons" | "referrals";

export type RewardsTier = {
  name: string;
  minPoints: number;
  color: string;
  icon: "Award" | "Star" | "Crown" | "Zap";
  benefits: string[];
  current?: boolean;
};

export type RewardCoupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  expiresAt: string;
  minPurchase: number;
  status: "active" | "used" | "expired";
  type: "percentage" | "fixed";
  providerServiceId?: string | null;
};

export type RewardActivity = {
  type: "earned" | "redeemed";
  points: number;
  description: string;
  date: string;
};

export type RewardReferralSummary = {
  code: string;
  referrals: number;
  referralEarnings: number;
};

export type RewardUserSummary = {
  points: number;
  tier: string;
  tierProgress: number;
  nextTier: string | null;
  pointsToNext: number;
  totalSpent: number;
  referrals: number;
  referralEarnings: number;
};

export type RewardsCapabilities = {
  hasLoyaltyTables: boolean;
  hasReferralTables: boolean;
  hasCouponRedemptionTables: boolean;
};

export type RewardsPageData = {
  user: RewardUserSummary;
  tiers: RewardsTier[];
  coupons: RewardCoupon[];
  usedCoupons: RewardCoupon[];
  recentActivity: RewardActivity[];
  referral: RewardReferralSummary;
  capabilities: RewardsCapabilities;
};

const TIER_DEFS: Omit<RewardsTier, "current">[] = [
  {
    name: "Silver",
    minPoints: 0,
    color: "from-gray-300 to-gray-400",
    icon: "Award",
    benefits: ["5% cashback", "Birthday reward", "Email support"],
  },
  {
    name: "Gold",
    minPoints: 1000,
    color: "from-[#eacb7f] to-[#d4a942]",
    icon: "Star",
    benefits: ["10% cashback", "Free shipping", "Priority support", "Exclusive offers"],
  },
  {
    name: "Platinum",
    minPoints: 3000,
    color: "from-slate-300 to-slate-400",
    icon: "Crown",
    benefits: ["15% cashback", "VIP lounge access", "24/7 concierge", "Early access", "Partner perks"],
  },
  {
    name: "Diamond",
    minPoints: 10000,
    color: "from-blue-400 to-purple-500",
    icon: "Zap",
    benefits: ["20% cashback", "Dedicated manager", "Premium events", "Luxury gifts", "Lifetime benefits"],
  },
];

function normalizeLocale(locale?: string) {
  return locale?.trim() || "fa";
}

async function resolveCurrentUserId(): Promise<string | null> {
  const session= await getSession();
   
  return session.user?.id;
}

function getTier(points: number) {
  let current = TIER_DEFS[0];
  let next: (typeof TIER_DEFS)[number] | null = null;

  for (let i = 0; i < TIER_DEFS.length; i += 1) {
    const tier = TIER_DEFS[i];
    if (points >= tier.minPoints) {
      current = tier;
      next = TIER_DEFS[i + 1] ?? null;
    }
  }

  const progress = next
    ? Math.max(
        0,
        Math.min(
          100,
          ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100,
        ),
      )
    : 100;

  return {
    current,
    next,
    progress: Math.round(progress),
    pointsToNext: next ? Math.max(0, next.minPoints - points) : 0,
  };
}

function formatDiscount(discountPercent: number | null, maybeFixed: number | null) {
  if (discountPercent != null && discountPercent > 0) return `${Number(discountPercent)}%`;
  if (maybeFixed != null && maybeFixed > 0) return `$${Number(maybeFixed).toLocaleString("en-US")}`;
  return "Deal";
}

function deriveReferralCode(userId: string | null) {
  const suffix = (userId ?? "guest").replace(/-/g, "").slice(0, 8).toUpperCase() || "GUEST";
  return `LSEVIN-${suffix}`;
}

export async function getRewardsPageData(locale: string): Promise<RewardsPageData> {
  noStore();
  const lang = normalizeLocale(locale);
  const userId = await resolveCurrentUserId();

  const capabilityRows = await sql<{
  has_loyalty_tables: boolean;
  has_referral_tables: boolean;
  has_coupon_redemption_tables: boolean;
}[]>`
  select
    (
      to_regclass('loyalty.accounts') is not null
      and to_regclass('loyalty.tiers') is not null
      and to_regclass('loyalty.ledger') is not null
    ) as has_loyalty_tables,
    (
      to_regclass('loyalty.referrals') is not null
    ) as has_referral_tables,
    (
      to_regclass('loyalty.coupons') is not null
      and to_regclass('loyalty.customer_coupons') is not null
    ) as has_coupon_redemption_tables
`;

const capabilities: RewardsCapabilities = {
  hasLoyaltyTables: Boolean(capabilityRows[0]?.has_loyalty_tables),
  hasReferralTables: Boolean(capabilityRows[0]?.has_referral_tables),
  hasCouponRedemptionTables: Boolean(
    capabilityRows[0]?.has_coupon_redemption_tables,
  ),
};

  const spendingRows = userId
    ? await sql<{ total_spent: number | null; bookings_count: number | null; last_booking_date: string | null }[]>`
        select
          coalesce(sum(ps.value), 0)::float as total_spent,
          count(*)::int as bookings_count,
          max(b.create_date)::text as last_booking_date
        from booking.bookings b
        join category.provider_services ps on ps.id = b.service_id
        where b.user_id = ${userId}::uuid
          and coalesce(b.booking_status, '') <> 'Cancelled'
      `
    : [{ total_spent: 0, bookings_count: 0, last_booking_date: null }];

  const totalSpent = Number(spendingRows[0]?.total_spent ?? 0);
  const bookingsCount = Number(spendingRows[0]?.bookings_count ?? 0);
  // Earn rate is admin-configurable (loyalty.settings, /admin/loyalty):
  // points = floor(spend_in_rial / divisor). Because the balance is derived
  // here at read time (never persisted per booking), changing the divisor
  // rescales displayed balances at the new rate without touching stored data.
  const earnRateDivisor = await getPointsEarnDivisor();
  const points = computeEarnedPoints(totalSpent, earnRateDivisor);
  const tierState = getTier(points);

  const tiers: RewardsTier[] = TIER_DEFS.map((tier) => ({
    ...tier,
    current: tier.name === tierState.current.name,
  }));

  const offerRows = await sql<{
    id: number;
    code: string | null;
    title: string;
    subtitle: string | null;
    discount_percent: number | null;
    valid_until: string;
    service_value: number | null;
    service_id: string | null;
  }[]>`
    select
      o.id,
      o.code,
      o.title,
      o.subtitle,
      o.discount_percent::float as discount_percent,
      o.valid_until::text as valid_until,
      ps.value::float as service_value,
      ps.id::text as service_id
    from marketing.offers o
    join category.provider_services ps on ps.id = o.provider_service_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    where coalesce(o.is_active, true) = true
      and o.valid_until >= now()
      and sp.is_active = true
      and ps.is_active = true
    order by coalesce(o.is_featured, false) desc, o.valid_until asc
    limit 12
  `;

  const coupons: RewardCoupon[] = offerRows.map((row) => ({
    id: String(row.id),
    code: row.code || `OFFER-${row.id}`,
    title: row.title,
    description: row.subtitle || "Limited-time offer on eligible bookings",
    discount: formatDiscount(row.discount_percent, null),
    expiresAt: row.valid_until,
    minPurchase: Number(row.service_value ?? 0),
    status: "active",
    type: row.discount_percent ? "percentage" : "fixed",
    providerServiceId: row.service_id,
  }));

  const usedCoupons: RewardCoupon[] = [];

  const recentActivity: RewardActivity[] = [];
  if (bookingsCount > 0) {
    recentActivity.push({
      type: "earned",
      points,
      description: `${bookingsCount} completed booking${bookingsCount > 1 ? "s" : ""}`,
      date: spendingRows[0]?.last_booking_date || new Date().toISOString(),
    });
  }
  if (coupons.length > 0) {
    recentActivity.push({
      type: "redeemed",
      points: -50,
      description: `Offer available: ${coupons[0].code}`,
      date: coupons[0].expiresAt,
    });
  }

  const user: RewardUserSummary = {
    points,
    tier: tierState.current.name,
    tierProgress: tierState.progress,
    nextTier: tierState.next?.name ?? null,
    pointsToNext: tierState.pointsToNext,
    totalSpent,
    referrals: 0,
    referralEarnings: 0,
  };

  return {
    user,
    tiers,
    coupons,
    usedCoupons,
    recentActivity,
    referral: {
      code: deriveReferralCode(userId),
      referrals: 0,
      referralEarnings: 0,
    },
    capabilities,
  };
}
