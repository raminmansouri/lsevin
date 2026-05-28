"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Facebook,
  Gift,
  Instagram,
  Mail,
  MessageSquare,
  Share2,
  TicketPercent,
  Users,
} from "lucide-react";

import type { ShareFriendsPageData } from "./types";
import { encodeShareText, formatDateLabel } from "./utils";

interface ShareFriendsPageClientProps {
  initialData: ShareFriendsPageData;
}

export function ShareFriendsPageClient({
  initialData,
}: ShareFriendsPageClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const pendingLabel = useMemo(() => `${initialData.stats.pendingRewards}%`, [initialData.stats.pendingRewards]);
  const earnedLabel = useMemo(() => `${initialData.stats.earnedRewards}%`, [initialData.stats.earnedRewards]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(initialData.referralCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(initialData.referralLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaMethod = (method: "sms" | "email" | "facebook" | "instagram") => {
    const shareText = initialData.shareMessage;
    const encodedText = encodeShareText(shareText);
    const encodedUrl = encodeShareText(initialData.referralLink);

    switch (method) {
      case "sms":
        window.location.href = `sms:?&body=${encodedText}`;
        return;
      case "email":
        window.location.href = `mailto:?subject=${encodeShareText("Join LSevin")}&body=${encodedText}`;
        return;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      case "instagram":
        navigator.clipboard.writeText(shareText);
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
        return;
      default:
        return;
    }
  };

  const moreOptions = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: "Join LSevin",
        text: initialData.shareMessage,
        url: initialData.referralLink,
      });
    } catch {
      // Native share was dismissed.
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-3">Share with Friends</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invite Friends, Earn Rewards</h2>
          <p className="text-white/90 mb-2">{initialData.heroSubtitle}</p>
          {initialData.programDescription ? (
            <p className="text-white/75 text-sm mb-6">{initialData.programDescription}</p>
          ) : (
            <div className="mb-6" />
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{initialData.stats.totalReferrals}</div>
              <div className="text-xs text-white/80">Friends Joined</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{pendingLabel}</div>
              <div className="text-xs text-white/80">Pending</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{earnedLabel}</div>
              <div className="text-xs text-white/80">Used</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Your Referral Code</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 flex items-center">
                <span className="text-2xl font-bold text-[#083f30] tracking-wider">
                  {initialData.referralCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className={`h-14 px-6 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-[#083f30] text-white hover:bg-[#0a5a44]"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">or share your referral link</div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center overflow-hidden">
                <span className="text-sm text-gray-600 truncate">{initialData.referralLink}</span>
              </div>
              <button
                onClick={copyLink}
                className={`h-12 px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  copiedLink
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {initialData.couponQueue.length > 0 && (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TicketPercent size={20} className="text-[#083f30]" />
              <h3 className="font-bold text-gray-900">Your Discount Queue</h3>
            </div>

            <div className="space-y-3">
              {initialData.couponQueue.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{coupon.title}</div>
                    <div className="text-xs text-gray-500">
                      Queue #{coupon.queuePosition} • {formatDateLabel(coupon.issuedAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#083f30]">{coupon.discountDisplay}</div>
                    <div className="text-xs text-orange-600 uppercase tracking-wide">{coupon.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Share via</h3>

          <div className="grid grid-cols-4 gap-3">
            {[
              { id: "sms", name: "Message", icon: MessageSquare, color: "bg-green-600" },
              { id: "email", name: "Email", icon: Mail, color: "bg-blue-600" },
              { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-700" },
              { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-pink-600" },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => shareViaMethod(method.id as "sms" | "email" | "facebook" | "instagram")}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-14 h-14 ${method.color} rounded-xl flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{method.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={moreOptions}
            className="w-full mt-4 h-12 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            More Options
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">How it Works</h3>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Share Your Code</h4>
                <p className="text-sm text-gray-600">
                  Send your unique referral code or referral link to friends and family.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">They Trigger the Active Program</h4>
                <p className="text-sm text-gray-600">
                  Rewards are created from the live referral policy, not from hard-coded app text.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Coupons Unlock in Order</h4>
                <p className="text-sm text-gray-600">
                  New discounts stay queued until the previous discount is used, based on your current policy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {initialData.referralHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Referral History</h3>
              <span className="text-sm text-gray-600">
                {initialData.referralHistory.length} referrals
              </span>
            </div>

            <div className="space-y-3">
              {initialData.referralHistory.slice(0, 5).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{referral.name}</div>
                      <div className="text-xs text-gray-500">{formatDateLabel(referral.date)}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-green-600">+{referral.rewardDisplay}</div>
                    <div
                      className={`text-xs ${
                        referral.status === "completed"
                          ? "text-green-600"
                          : referral.status === "pending"
                          ? "text-orange-600"
                          : "text-gray-500"
                      }`}
                    >
                      {referral.status === "completed"
                        ? "Earned"
                        : referral.status === "pending"
                        ? "Pending"
                        : "Invited"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-100 rounded-2xl p-5">
          <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            {initialData.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
