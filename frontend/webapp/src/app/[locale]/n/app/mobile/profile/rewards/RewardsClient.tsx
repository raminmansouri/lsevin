"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Trophy,
  Gift,
  Users,
  ChevronRight,
  Star,
  CheckCircle2,
  Lock,
  TrendingUp,
  Award,
  Crown,
  Zap,
  Share2,
  Copy,
  Calendar,
  Tag,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { RewardsPageData, RewardsTier } from "./rewards.data";

const ICONS: Record<RewardsTier["icon"], JSX.Element> = {
  Award: <Award size={24} />,
  Star: <Star size={24} />,
  Crown: <Crown size={24} />,
  Zap: <Zap size={24} />,
};

export default function RewardsClient({ data }: { data: RewardsPageData }) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"overview" | "coupons" | "referrals">("overview");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const copyReferralCode = async () => {
    await navigator.clipboard.writeText(data.referral.code);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyCouponCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    window.setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Rewards &amp; Loyalty</h1>
          </div>
        </div>

        <div className="flex border-b border-gray-200 px-5">
          {[
            { id: "overview", label: "Overview" },
            { id: "coupons", label: "Coupons" },
            { id: "referrals", label: "Referrals" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`h-12 px-4 font-semibold text-sm transition-colors relative ${
                selectedTab === tab.id ? "text-[#083f30]" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {selectedTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#083f30]" />}
            </button>
          ))}
        </div>
      </div>

      {!data.capabilities.hasLoyaltyTables && (
        <div className="px-5 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-semibold text-amber-900 mb-1">Rewards schema is not in the database yet</div>
              <p className="text-sm text-amber-800">
                This page is production-structured and uses live offers plus derived spending, but loyalty points,
                coupon redemption history, referrals, and tier persistence need dedicated tables and APIs.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "overview" && (
        <div className="px-5 py-6 space-y-6">
          <div className={`bg-gradient-to-br ${data.tiers.find((t) => t.current)?.color} rounded-3xl p-6 text-white shadow-xl`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/90 text-sm mb-2">Your Points</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{data.user.points.toLocaleString()}</span>
                  <span className="text-white/80">pts</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {ICONS[data.tiers.find((t) => t.current)?.icon || "Award"]}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/90 text-sm font-semibold">{data.user.tier} Member</span>
                <span className="text-white/90 text-sm">{data.user.tierProgress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${data.user.tierProgress}%` }} />
              </div>
              <p className="text-white/80 text-xs">
                {data.user.nextTier ? `${data.user.pointsToNext} more points to ${data.user.nextTier}` : "Highest tier reached"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">${data.user.totalSpent.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Spent</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{data.user.referrals}</div>
              <div className="text-xs text-gray-600">Referrals</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">${data.user.referralEarnings}</div>
              <div className="text-xs text-gray-600">Earned</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Membership Tiers</h2>
            <div className="space-y-3">
              {data.tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${tier.current ? "border-[#083f30] shadow-md" : "border-gray-200"}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
                          {ICONS[tier.icon]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{tier.name}</h3>
                            {tier.current && <span className="px-2 py-0.5 bg-[#083f30] text-white text-xs font-bold rounded-full">CURRENT</span>}
                          </div>
                          <p className="text-sm text-gray-600">{tier.minPoints.toLocaleString()}+ points</p>
                        </div>
                      </div>

                      {tier.current ? (
                        <CheckCircle2 size={24} className="text-[#083f30]" />
                      ) : data.user.points >= tier.minPoints ? (
                        <CheckCircle2 size={24} className="text-green-600" />
                      ) : (
                        <Lock size={24} className="text-gray-300" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tier.benefits.map((benefit) => (
                        <span key={benefit} className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-700">
                          • {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {data.recentActivity.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">No reward activity has been recorded yet.</div>
              ) : (
                data.recentActivity.map((activity, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === "earned" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                        {activity.type === "earned" ? <TrendingUp size={20} /> : <Gift size={20} />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{activity.description}</div>
                        <div className="text-xs text-gray-600">{new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      </div>
                    </div>
                    <div className={`font-bold ${activity.type === "earned" ? "text-green-600" : "text-orange-600"}`}>{activity.points > 0 ? "+" : ""}{activity.points} pts</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === "coupons" && (
        <div className="px-5 py-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Available Coupons</h2>
            <div className="space-y-3">
              {data.coupons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">
                  No active offer-based coupons are available right now.
                </div>
              ) : (
                data.coupons.map((coupon) => {
                  const daysLeft = getDaysUntilExpiry(coupon.expiresAt);
                  const isExpiringSoon = daysLeft <= 7;
                  return (
                    <div key={coupon.id} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-[#083f30] hover:shadow-md transition-all">
                      <div className="p-4">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            {coupon.discount}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-1">{coupon.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs font-bold text-gray-900">{coupon.code}</div>
                              <button onClick={() => copyCouponCode(coupon.code)} className="text-xs font-semibold text-[#083f30] hover:underline">
                                {copiedCoupon === coupon.code ? "Copied" : "Copy"}
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                              <span className={isExpiringSoon ? "text-orange-600 font-semibold" : ""}>
                                <Calendar size={12} className="inline mr-1" />
                                Expires {new Date(coupon.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {isExpiringSoon ? ` (${daysLeft} days left)` : ""}
                              </span>
                              {coupon.minPurchase > 0 && (
                                <span>
                                  <Tag size={12} className="inline mr-1" />Min ${coupon.minPurchase}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(coupon.providerServiceId ? `/app/booking/${coupon.providerServiceId}` : "/app/explore")}
                          className="w-full h-11 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors flex items-center justify-center gap-2"
                        >
                          Use Coupon <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Used Coupons</h2>
            <div className="space-y-2">
              {data.usedCoupons.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                  Coupon redemption history cannot be shown until a customer coupon ledger exists in the database.
                </div>
              ) : (
                data.usedCoupons.map((coupon) => (
                  <div key={coupon.id} className="bg-white rounded-xl border border-gray-200 p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">{coupon.title}</div>
                        <div className="text-xs text-gray-600">Used on {new Date(coupon.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 mb-1">Saved {coupon.discount}</div>
                        <div className="text-xs text-gray-500">Code: {coupon.code}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === "referrals" && (
        <div className="px-5 py-6 space-y-6">
          <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Invite Friends</h2>
                <p className="text-white/80 text-sm">Referral program schema ready to add</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="text-white/80 text-xs mb-2">Your Referral Code</div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono font-bold text-lg">{data.referral.code}</span>
                <button onClick={copyReferralCode} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
                  {copiedCode ? <><CheckCircle2 size={16} />Copied!</> : <><Copy size={16} />Copy</>}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({
                    title: "Join LSevin",
                    text: `Use my code ${data.referral.code} when you join LSevin.`,
                    url: "https://lsevin.com",
                  });
                }
              }}
              className="w-full h-12 bg-white text-[#083f30] rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} />Share with Friends
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">How Referrals Work</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: "Share your code", description: "Send your unique referral code to friends" },
                { step: 2, title: "They sign up", description: "Your friend creates an account using your code" },
                { step: 3, title: "They book", description: "Your friend completes their first booking" },
                { step: 4, title: "You both earn", description: "Reward logic becomes live once referral tables and payout rules are added" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">{item.step}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-0.5">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Your Referral Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{data.referral.referrals}</div>
                <div className="text-sm text-green-700">Successful Referrals</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">${data.referral.referralEarnings}</div>
                <div className="text-sm text-blue-700">Total Earned</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
