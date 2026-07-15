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
import { useLocale, useTranslations } from "next-intl";

import type { RewardsPageData, RewardsTier } from "./rewards.data";

const ICONS: Record<RewardsTier["icon"], JSX.Element> = {
  Award: <Award size={24} />,
  Star: <Star size={24} />,
  Crown: <Crown size={24} />,
  Zap: <Zap size={24} />,
};

export default function RewardsClient({ data }: { data: RewardsPageData }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MobileProfile.rewards");
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
            <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
          </div>
        </div>

        <div className="flex border-b border-gray-200 px-5">
          {[
            { id: "overview", label: t("tabs.overview") },
            { id: "coupons", label: t("tabs.coupons") },
            { id: "referrals", label: t("tabs.referrals") },
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
              <div className="font-semibold text-amber-900 mb-1">{t("schemaNotice.title")}</div>
              <p className="text-sm text-amber-800">
                {t("schemaNotice.description")}
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
                <p className="text-white/90 text-sm mb-2">{t("overview.yourPoints")}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{data.user.points.toLocaleString(locale)}</span>
                  <span className="text-white/80">{t("overview.pointsAbbr")}</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {ICONS[data.tiers.find((t) => t.current)?.icon || "Award"]}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/90 text-sm font-semibold">{t("overview.member", { tier: data.user.tier })}</span>
                <span className="text-white/90 text-sm">{data.user.tierProgress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${data.user.tierProgress}%` }} />
              </div>
              <p className="text-white/80 text-xs">
                {data.user.nextTier ? t("overview.pointsToNext", { points: data.user.pointsToNext, tier: data.user.nextTier }) : t("overview.highestTierReached")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">${data.user.totalSpent.toLocaleString(locale)}</div>
              <div className="text-xs text-gray-600">{t("overview.totalSpent")}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{data.user.referrals}</div>
              <div className="text-xs text-gray-600">{t("overview.referrals")}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">${data.user.referralEarnings}</div>
              <div className="text-xs text-gray-600">{t("overview.earned")}</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("overview.membershipTiers")}</h2>
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
                            {tier.current && <span className="px-2 py-0.5 bg-[#083f30] text-white text-xs font-bold rounded-full">{t("overview.current")}</span>}
                          </div>
                          <p className="text-sm text-gray-600">{tier.minPoints.toLocaleString(locale)}+ {t("overview.points")}</p>
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
              <h2 className="text-lg font-bold text-gray-900">{t("overview.recentActivity")}</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {data.recentActivity.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">{t("overview.emptyActivity")}</div>
              ) : (
                data.recentActivity.map((activity, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === "earned" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                        {activity.type === "earned" ? <TrendingUp size={20} /> : <Gift size={20} />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{activity.description}</div>
                        <div className="text-xs text-gray-600">{new Date(activity.date).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}</div>
                      </div>
                    </div>
                    <div className={`font-bold ${activity.type === "earned" ? "text-green-600" : "text-orange-600"}`}>{activity.points > 0 ? "+" : ""}{activity.points.toLocaleString(locale)} {t("overview.pointsAbbr")}</div>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("coupons.available")}</h2>
            <div className="space-y-3">
              {data.coupons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">
                  {t("coupons.emptyAvailable")}
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
                                {copiedCoupon === coupon.code ? t("actions.copied") : t("actions.copy")}
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                              <span className={isExpiringSoon ? "text-orange-600 font-semibold" : ""}>
                                <Calendar size={12} className="inline mr-1" />
                                {t("coupons.expires", { date: new Date(coupon.expiresAt).toLocaleDateString(locale, { month: "short", day: "numeric" }) })}
                                {isExpiringSoon ? t("coupons.daysLeft", { days: daysLeft }) : ""}
                              </span>
                              {coupon.minPurchase > 0 && (
                                <span>
                                  <Tag size={12} className="inline mr-1" />{t("coupons.minPurchase", { amount: coupon.minPurchase })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(coupon.providerServiceId ? `/app/booking/${coupon.providerServiceId}` : "/app/explore")}
                          className="w-full h-11 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors flex items-center justify-center gap-2"
                        >
                          {t("actions.useCoupon")} <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("coupons.used")}</h2>
            <div className="space-y-2">
              {data.usedCoupons.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                  {t("coupons.emptyUsed")}
                </div>
              ) : (
                data.usedCoupons.map((coupon) => (
                  <div key={coupon.id} className="bg-white rounded-xl border border-gray-200 p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">{coupon.title}</div>
                        <div className="text-xs text-gray-600">{t("coupons.usedOn", { date: new Date(coupon.expiresAt).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) })}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 mb-1">{t("coupons.saved", { amount: coupon.discount })}</div>
                        <div className="text-xs text-gray-500">{t("coupons.code", { code: coupon.code })}</div>
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
                <h2 className="text-xl font-bold">{t("referrals.inviteFriends")}</h2>
                <p className="text-white/80 text-sm">{t("referrals.schemaReady")}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="text-white/80 text-xs mb-2">{t("referrals.yourCode")}</div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono font-bold text-lg">{data.referral.code}</span>
                <button onClick={copyReferralCode} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
                  {copiedCode ? <><CheckCircle2 size={16} />{t("actions.copiedBang")}</> : <><Copy size={16} />{t("actions.copy")}</>}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({
                    title: t("referrals.shareTitle"),
                    text: t("referrals.shareText", { code: data.referral.code }),
                    url: "https://lsevin.com",
                  });
                }
              }}
              className="w-full h-12 bg-white text-[#083f30] rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} />{t("actions.shareWithFriends")}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t("referrals.howItWorks")}</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: t("referrals.steps.share.title"), description: t("referrals.steps.share.description") },
                { step: 2, title: t("referrals.steps.signup.title"), description: t("referrals.steps.signup.description") },
                { step: 3, title: t("referrals.steps.book.title"), description: t("referrals.steps.book.description") },
                { step: 4, title: t("referrals.steps.earn.title"), description: t("referrals.steps.earn.description") },
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
            <h3 className="font-bold text-gray-900 mb-4">{t("referrals.yourStats")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{data.referral.referrals}</div>
                <div className="text-sm text-green-700">{t("referrals.successful")}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">${data.referral.referralEarnings}</div>
                <div className="text-sm text-blue-700">{t("referrals.totalEarned")}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
