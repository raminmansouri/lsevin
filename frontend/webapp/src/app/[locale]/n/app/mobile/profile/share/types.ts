export type DiscountType = "percent" | "fixed";
export type CouponStatus = "issued" | "reserved" | "redeemed" | "expired" | "cancelled";
export type ReferralHistoryStatus = "invited" | "pending" | "completed";

export interface ShareFriendsStats {
  totalReferrals: number;
  pendingRewards: number;
  earnedRewards: number;
}

export interface ReferralHistoryItem {
  id: string;
  name: string;
  date: string | null;
  status: ReferralHistoryStatus;
  rewardValue: number | null;
  rewardType: DiscountType;
  rewardDisplay: string;
}

export interface CouponQueueItem {
  id: string;
  title: string;
  status: CouponStatus;
  discountType: DiscountType;
  discountValue: number;
  discountDisplay: string;
  issuedAt: string;
  queuePosition: number;
}

export interface ShareFriendsPageData {
  programName: string;
  programDescription: string | null;
  referralCode: string;
  referralLink: string;
  heroSubtitle: string;
  shareMessage: string;
  stats: ShareFriendsStats;
  referralHistory: ReferralHistoryItem[];
  couponQueue: CouponQueueItem[];
  terms: string[];
}
