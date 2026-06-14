export type DiscountType = "percent" | "fixed";
export type RewardTrigger =
  | "signup"
  | "profile_completed"
  | "referral_joined"
  | "first_booking_completed";
export type RewardRecipient = "referrer" | "referee";

export interface ReferralAdminInvitationItem {
  id: string;
  referrer: string;
  referee: string;
  status: string;
  invitedAt: string | null;
  signedUpAt: string | null;
  qualifiedAt: string | null;
}

export interface ReferralAdminCouponItem {
  id: string;
  customerName: string;
  title: string;
  discountDisplay: string;
  status: string;
  issuedAt: string | null;
  redeemedAt: string | null;
}

export interface ReferralAdminDashboardData {
  program: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  summary: {
    activeCodes: number;
    invitations: number;
    registrations: number;
    profileCompletions: number;
    qualifiedReferrals: number;
    couponsIssued: number;
    couponsRedeemed: number;
  };
  invitations: ReferralAdminInvitationItem[];
  coupons: ReferralAdminCouponItem[];
}

export interface ReferralPolicyRule {
  id: string;
  trigger: RewardTrigger;
  recipient: RewardRecipient;
  referralOrdinal: number | null;
  discountType: DiscountType;
  discountValue: number;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  requiresPreviousCouponRedeemed: boolean;
}

export interface ReferralPoliciesData {
  program: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
    allowStacking: boolean;
    requirePreviousCouponRedeemed: boolean;
    maxReferralsPerReferrer: number | null;
  };
  rules: ReferralPolicyRule[];
}

export interface SaveReferralPoliciesInput {
  programId: string;
  name: string;
  description: string | null;
  allowStacking: boolean;
  requirePreviousCouponRedeemed: boolean;
  maxReferralsPerReferrer: number | null;
  rules: ReferralPolicyRule[];
}

export interface SaveReferralPoliciesResult {
  ok: boolean;
  message: string;
}
